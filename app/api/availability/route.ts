import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { availableUnits } from "@/lib/inventory";
import { quoteRental } from "@/lib/rental-policy";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    await rateLimit(
      `availability:${createHash("sha256").update(ip).digest("hex")}`,
      150
    );
    const params = new URL(request.url).searchParams;
    const car = await prisma.car.findFirst({
      where: { id: params.get("carId") || "", archived: false },
    });
    if (!car)
      return Response.json({ error: "Car not found." }, { status: 404 });
    const start = new Date(params.get("start") || "");
    const end = new Date(params.get("end") || "");
    const quote = quoteRental(Number(car.pricePerDay), start, end);
    const count = await availableUnits(car.id, start, end);
    return Response.json(
      { available: count, quote },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error ? e.message : "Availability could not be checked.",
      },
      { status: 400 }
    );
  }
}
