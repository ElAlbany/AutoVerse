import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createChatHandler } from "@/lib/chat-handler";
import { findChatInventory } from "@/lib/chat-inventory";
import { generateChatReply } from "@/lib/gemini";

export const POST = createChatHandler({
  authenticate: async () => (await auth()).userId,
  limit: (userId) => rateLimit(`chat:${userId}`, 20, 60),
  inventory: findChatInventory,
  generate: generateChatReply,
  record: async (clerkId, message, ids) => {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (user)
      await prisma.chatAnalytic.create({
        data: { userId: user.id, message, carsShown: ids },
      });
  },
});
