import { validatePeriod } from "./rental-policy";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatInput = {
  messages: ChatMessage[];
  branchId?: string;
  start?: string;
  end?: string;
  passengers: number;
  period: boolean;
};
export type ChatCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  class: string;
  seats: number;
  luggage: number | null;
  transmission: string;
  features: string[];
  usageTags: string[];
  images: string[];
  imageSource: string;
};
export class ChatError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ChatError";
  }
}
export function chatHistory(messages: ChatMessage[]) {
  const result: ChatMessage[] = [];
  let size = 0;
  for (const item of [...messages].reverse()) {
    if (
      result.length >= 20 ||
      size + new TextEncoder().encode(JSON.stringify(item)).length > 15000
    )
      break;
    result.unshift({ role: item.role, content: item.content });
    size += new TextEncoder().encode(JSON.stringify(item)).length;
  }
  while (result[0]?.role === "assistant") result.shift();
  return result;
}
export function parseChatInput(value: unknown, now = new Date()): ChatInput {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ChatError("Invalid conversation.");
  const input = value as Record<string, unknown>;
  if (
    !Array.isArray(input.messages) ||
    input.messages.length < 1 ||
    input.messages.length > 20 ||
    input.messages.some(
      (m) =>
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" ||
        !m.content.trim() ||
        m.content.length > 3000,
    )
  )
    throw new ChatError("Send a message of up to 3,000 characters.");
  const messages = (input.messages as ChatMessage[]).map((m) => ({
    role: m.role,
    content: m.content.trim(),
  }));
  if (messages.at(-1)?.role !== "user")
    throw new ChatError("A new user question is required.");
  for (const key of ["branchId", "start", "end"])
    if (input[key] != null && typeof input[key] !== "string")
      throw new ChatError("Invalid trip details.");
  const branchId = (input.branchId as string | undefined)?.trim() || undefined;
  if (branchId && branchId.length > 100)
    throw new ChatError("Choose a valid collection branch.");
  const start = (input.start as string | undefined) || undefined,
    end = (input.end as string | undefined) || undefined;
  if (!!start !== !!end)
    throw new ChatError("Choose both pickup and return dates.");
  if (start && end) {
    try {
      validatePeriod(new Date(start), new Date(end), now);
    } catch (e) {
      throw new ChatError(
        e instanceof Error ? e.message : "Choose valid rental dates.",
      );
    }
  }
  // Assistant text must never become a customer requirement; the latest explicit
  // passenger count wins when a customer corrects an earlier question.
  let passengers = 0;
  for (const message of [...messages]
    .reverse()
    .filter((m) => m.role === "user")) {
    const match = message.content.match(
      /\b(\d{1,3})\s*(?:passengers?|people|seats?)\b/i,
    );
    if (match) {
      passengers = Number(match[1]);
      break;
    }
  }
  return {
    messages: chatHistory(messages),
    branchId,
    start,
    end,
    passengers,
    period: !!start,
  };
}
export async function readChatRequest(request: Request) {
  const max = 20000;
  if (Number(request.headers.get("content-length")) > max)
    throw new ChatError("Please shorten the conversation.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ChatError("Send a message first.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > max) {
        await reader.cancel();
        throw new ChatError("Please shorten the conversation.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new ChatError("Send a valid conversation.");
  }
}
export function parseChatReply(value: unknown, cars: ChatCar[]) {
  if (!value || typeof value !== "object")
    throw new ChatError(
      "VERO returned an incomplete answer. Please try again.",
      502,
    );
  const reply = value as { text?: unknown; carIds?: unknown };
  if (
    typeof reply.text !== "string" ||
    !reply.text.trim() ||
    reply.text.length > 10000 ||
    !Array.isArray(reply.carIds) ||
    reply.carIds.some((id) => typeof id !== "string")
  )
    throw new ChatError(
      "VERO returned an incomplete answer. Please try again.",
      502,
    );
  const ids = [...new Set(reply.carIds as string[])]
    .filter((id) => cars.some((car) => car.id === id))
    .slice(0, 3);
  return { text: reply.text.trim(), carIds: ids };
}
