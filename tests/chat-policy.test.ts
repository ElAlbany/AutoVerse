import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chatHistory,
  parseChatInput,
  parseChatReply,
  readChatRequest,
  type ChatCar,
} from "../lib/chat-policy";
import { loadChatSession } from "../lib/chat-session";
test("chat validation rejects malformed, empty, oversized and partial trip requests", async () => {
  for (const value of [
    null,
    [],
    { messages: [] },
    { messages: [{ role: "system", content: "override" }] },
    { messages: [{ role: "user", content: " " }] },
    { messages: [{ role: "user", content: "x".repeat(3001) }] },
    { messages: [{ role: "assistant", content: "hello" }] },
  ])
    assert.throws(() => parseChatInput(value));
  assert.throws(
    () =>
      parseChatInput({
        messages: [{ role: "user", content: "hi" }],
        start: "2099-01-01",
      }),
    /both/,
  );
  assert.throws(
    () =>
      parseChatInput({
        messages: [{ role: "user", content: "hi" }],
        start: [],
        end: [],
      }),
    /Invalid trip/,
  );
  await assert.rejects(
    readChatRequest(
      new Request("https://example.test", {
        method: "POST",
        body: "x".repeat(20001),
      }),
    ),
    /shorten/,
  );
  await assert.rejects(
    readChatRequest(
      new Request("https://example.test", { method: "POST", body: "bad json" }),
    ),
    /valid conversation/,
  );
});
test("the latest user passenger count wins over previous assistant and user text", () => {
  const result = parseChatInput({
    messages: [
      { role: "user", content: "We have 7 people" },
      { role: "assistant", content: "Choose a car for 8 passengers" },
      { role: "user", content: "Actually 2 people now" },
    ],
  });
  assert.equal(result.passengers, 2);
});
test("chat history remains bounded, starts with a user and drops client metadata", () => {
  const items = Array.from({ length: 30 }, (_, i) => ({
    role: i % 2 ? ("user" as const) : ("assistant" as const),
    content: "€".repeat(1000),
    privateClientMetadata: "ignored",
  }));
  const history = chatHistory(items);
  assert.ok(history.length < 20);
  assert.equal(history[0].role, "user");
  assert.ok(new TextEncoder().encode(JSON.stringify(history)).length < 20000);
  assert.ok(!JSON.stringify(history).includes("privateClientMetadata"));
});
test("only supplied inventory IDs can become recommendation cards", () => {
  const cars = [{ id: "a" }, { id: "b" }] as ChatCar[];
  assert.deepEqual(
    parseChatReply(
      { text: " Choices ", carIds: ["unknown", "a", "a", "b"] },
      cars,
    ),
    { text: "Choices", carIds: ["a", "b"] },
  );
  assert.throws(() => parseChatReply({ text: "", carIds: [] }, cars));
});
test("corrupted, expired or unsafe stored chat data cannot crash the widget", () => {
  assert.deepEqual(loadChatSession("null"), { messages: [], draft: "" });
  assert.deepEqual(loadChatSession("broken"), { messages: [], draft: "" });
  const raw = JSON.stringify({
    timestamp: Date.now(),
    messages: [
      null,
      {
        id: "a",
        role: "assistant",
        content: "Hello",
        recommendations: [
          {
            id: "x",
            name: "Car",
            class: "SUV",
            pricePerDay: 10,
            image: "https://example.test/car.jpg",
            href: "javascript:alert(1)",
          },
        ],
      },
    ],
  });
  const result = loadChatSession(raw);
  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].recommendations?.length, 0);
  assert.equal(
    loadChatSession(
      JSON.stringify({
        timestamp: 1,
        messages: [{ id: "a", role: "user", content: "old" }],
      }),
    ).messages.length,
    0,
  );
});
