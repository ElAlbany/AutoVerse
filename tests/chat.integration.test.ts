import { test } from "node:test";
import assert from "node:assert/strict";
import { createChatHandler } from "../lib/chat-handler";
import { generateChatReply, DEFAULT_GEMINI_MODEL } from "../lib/gemini";
import { parseChatInput, type ChatCar } from "../lib/chat-policy";
const car = {
  id: "car-a",
  make: "Test",
  model: "Car",
  year: 2026,
  pricePerDay: 50,
  class: "Car",
  seats: 5,
  luggage: null,
  transmission: "a",
  features: [],
  usageTags: ["CITY"],
  images: [],
  imageSource: "API",
} satisfies ChatCar;
const input = parseChatInput({
  messages: [{ role: "user", content: "Need a car for 2 people" }],
});
const request = () =>
  new Request("https://example.test/api/chat", {
    method: "POST",
    body: JSON.stringify({
      messages: input.messages,
      branchId: "branch-a",
      start: "2099-01-01T10:00:00Z",
      end: "2099-01-02T10:00:00Z",
    }),
  });
function fixture(
  overrides: Partial<Parameters<typeof createChatHandler>[0]> = {},
) {
  return createChatHandler({
    authenticate: async () => "user-a",
    limit: async () => {},
    inventory: async () => [car],
    generate: async () => ({ text: "Your car", carIds: [car.id, "invented"] }),
    record: async () => {},
    ...overrides,
  });
}
test("chat HTTP workflow rejects unauthenticated and invalid requests before calling providers", async () => {
  let calls = 0;
  const handler = fixture({
    authenticate: async () => null,
    inventory: async () => {
      calls++;
      return [];
    },
  });
  assert.equal((await handler(request())).status, 401);
  assert.equal(calls, 0);
  assert.equal(
    (
      await fixture()(
        new Request("https://example.test", { method: "POST", body: "{}" }),
      )
    ).status,
    400,
  );
});
test("successful answers survive analytics failures and preserve the selected trip in links", async () => {
  const response = await fixture({
    record: async () => {
      throw new Error("database unavailable");
    },
  })(request());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.recommendedCars.length, 1);
  const url = new URL(body.recommendedCars[0].href, "https://example.test");
  assert.equal(url.searchParams.get("branchId"), "branch-a");
  assert.equal(url.searchParams.get("start"), "2099-01-01T10:00:00Z");
});
test("rate limits and unexpected infrastructure failures have safe actionable responses", async () => {
  const limited = await fixture({
    limit: async () => {
      throw new Error("Too many requests");
    },
  })(request());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "60");
  const failed = await fixture({
    inventory: async () => {
      throw new Error("sensitive connection string");
    },
  })(request());
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes("sensitive"));
});
test("Gemini model-not-found falls back and concatenates visible parts without returning thought data", async () => {
  const models: string[] = [];
  const fetcher = (async (url, options) => {
    models.push(String(url));
    const body = JSON.parse(options?.body as string);
    assert.equal(body.generationConfig.responseMimeType, "application/json");
    return models.length === 1
      ? Response.json({}, { status: 404 })
      : Response.json({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  { thought: true, text: "private thought" },
                  { text: '{"text":"Hello",' },
                  { text: '"carIds":["car-a"]}' },
                ],
              },
            },
          ],
        });
  }) as typeof fetch;
  const result = await generateChatReply(input, [car], {
    fetcher,
    key: "fixture",
    model: "old-model",
  });
  assert.equal(result.text, "Hello");
  assert.equal(models.length, 2);
  assert.ok(models[1].includes(DEFAULT_GEMINI_MODEL));
});
test("provider quotas, empty answers and truncated thinking cannot masquerade as successful chat", async () => {
  await assert.rejects(
    generateChatReply(input, [car], {
      key: "fixture",
      model: DEFAULT_GEMINI_MODEL,
      fetcher: async () => Response.json({}, { status: 429 }),
    }),
    (e) => (e as { status: number }).status === 429,
  );
  for (const candidates of [
    [],
    [
      {
        finishReason: "MAX_TOKENS",
        content: { parts: [{ text: '{"text":"partial","carIds":[]}' }] },
      },
    ],
    [
      {
        finishReason: "STOP",
        content: { parts: [{ thought: true, text: "reasoning only" }] },
      },
    ],
  ])
    await assert.rejects(
      generateChatReply(input, [car], {
        key: "fixture",
        model: DEFAULT_GEMINI_MODEL,
        fetcher: async () => Response.json({ candidates }),
      }),
    );
});
