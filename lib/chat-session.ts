import { validCarImageUrl } from "./car-media";
export type ChatRecommendation = {
  id: string;
  name: string;
  pricePerDay: number;
  class: string;
  image: string;
  href?: string;
};
export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: ChatRecommendation[];
};
export function loadChatSession(
  raw: string | null,
  now = Date.now(),
): { messages: StoredChatMessage[]; draft: string } {
  try {
    const data = JSON.parse(raw || "null");
    if (
      !data ||
      !Number.isFinite(data.timestamp) ||
      data.timestamp > now + 60000 ||
      now - data.timestamp >= 3600000 ||
      !Array.isArray(data.messages)
    )
      return { messages: [], draft: "" };
    const messages = data.messages
      .slice(-40)
      .filter(
        (m: StoredChatMessage) =>
          m &&
          typeof m.id === "string" &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string" &&
          m.content.length <= 10000,
      )
      .map((m: StoredChatMessage) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        recommendations: Array.isArray(m.recommendations)
          ? m.recommendations
              .filter(
                (c) =>
                  c &&
                  typeof c.id === "string" &&
                  typeof c.name === "string" &&
                  typeof c.class === "string" &&
                  Number.isFinite(c.pricePerDay) &&
                  typeof c.image === "string" &&
                  validCarImageUrl(c.image) &&
                  (!c.href || /^\/rent\?/.test(c.href)),
              )
              .slice(0, 3)
          : undefined,
      }));
    return {
      messages,
      draft: typeof data.draft === "string" ? data.draft.slice(0, 3000) : "",
    };
  } catch {
    return { messages: [], draft: "" };
  }
}
