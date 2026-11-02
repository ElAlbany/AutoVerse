import "server-only";
import {
  ChatError,
  readChatRequest,
  parseChatInput,
  type ChatCar,
  type ChatInput,
} from "./chat-policy";
import { carImage } from "./car-media";
type Dependencies = {
  authenticate: () => Promise<string | null>;
  limit: (userId: string) => Promise<void>;
  inventory: (input: ChatInput) => Promise<ChatCar[]>;
  generate: (
    input: ChatInput,
    cars: ChatCar[],
  ) => Promise<{ text: string; carIds: string[] }>;
  record: (userId: string, message: string, ids: string[]) => Promise<void>;
};
export function createChatHandler(deps: Dependencies) {
  return async (request: Request) => {
    try {
      const userId = await deps.authenticate();
      if (!userId)
        throw new ChatError(
          "Please sign in to use VERO. You can browse and compare freely.",
          401,
        );
      const input = parseChatInput(await readChatRequest(request));
      await deps.limit(userId);
      const cars = await deps.inventory(input);
      const reply = await deps.generate(input, cars);
      const recommendedCars = reply.carIds
        .flatMap((id) => {
          const car = cars.find((c) => c.id === id);
          if (!car) return [];
          const query = new URLSearchParams({ carId: id });
          if (input.branchId) query.set("branchId", input.branchId);
          if (input.start) query.set("start", input.start);
          if (input.end) query.set("end", input.end);
          return [
            {
              id: car.id,
              name: `${car.year} ${car.make} ${car.model}`,
              pricePerDay: car.pricePerDay,
              class: car.class,
              image: carImage(car),
              href: `/rent?${query}`,
            },
          ];
        })
        .slice(0, 3);
      try {
        await deps.record(
          userId,
          input.messages.at(-1)!.content,
          recommendedCars.map((c) => c.id),
        );
      } catch {
        console.warn("VERO analytics could not be recorded.");
      }
      return Response.json(
        { text: reply.text, recommendedCars },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (e) {
      const limited = e instanceof Error && e.message.startsWith("Too many");
      const error =
        e instanceof ChatError
          ? e
          : new ChatError(
              limited
                ? "Too many messages. Please try again shortly."
                : "VERO is temporarily unavailable. Please try again.",
              limited ? 429 : 503,
            );
      return Response.json(
        { error: error.message },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
            ...(error.status === 429 ? { "Retry-After": "60" } : {}),
          },
        },
      );
    }
  };
}
