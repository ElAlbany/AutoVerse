import "server-only";
import { prisma } from "./prisma";

export async function rateLimit(key: string, limit: number, minutes = 10) {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" (key, count, "resetAt") VALUES (${key}, 1, NOW() + ${minutes} * INTERVAL '1 minute')
    ON CONFLICT (key) DO UPDATE SET count = CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit".count + 1 END,
    "resetAt" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN NOW() + ${minutes} * INTERVAL '1 minute' ELSE "RateLimit"."resetAt" END
    RETURNING count`;
  if (rows[0].count > limit)
    throw new Error("Too many requests. Please try again shortly.");
}
