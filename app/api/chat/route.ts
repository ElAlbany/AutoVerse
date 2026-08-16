import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const { userId: clerkUserId } = await auth();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    // ── Pull live inventory ──────────────────────────────────────
    const cars = await prisma.car.findMany({
      where: { available: true },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        pricePerDay: true,
        class: true,
        fuel_type: true,
        transmission: true,
        drive: true,
        combination_mpg: true,
        description: true,
        featured: true,
        images: true,
      },
      orderBy: { pricePerDay: "asc" },
    });

    const carById = new Map<string, (typeof cars)[0]>();
    for (const c of cars) {
      carById.set(c.id, c);
    }

    // ── Smart filtering based on conversation ────────────────────
    const fullHistory = messages
      .map((m: { role: string; content: string }) => m.content.toLowerCase())
      .join(" ");

    const paxMatch = fullHistory.match(
      /(\d+)\s*(passengers?|people|persons?|seats?|pax)/g,
    );
    const maxPax = paxMatch
      ? Math.max(...paxMatch.map((m: string) => parseInt(m.match(/\d+/)![0])))
      : 0;

    let contextCars = cars;

    if (maxPax >= 7) {
      contextCars = cars.filter(
        (c) =>
          c.class?.toLowerCase().includes("suv") ||
          c.class?.toLowerCase().includes("truck") ||
          c.class?.toLowerCase().includes("van") ||
          c.class?.toLowerCase().includes("wagon"),
      );
    } else if (maxPax >= 5) {
      contextCars = cars.filter(
        (c) =>
          !c.class?.toLowerCase().includes("compact") &&
          !c.class?.toLowerCase().includes("subcompact") &&
          !c.class?.toLowerCase().includes("minicompact"),
      );
    }

    if (
      fullHistory.includes("expensive") ||
      fullHistory.includes("premium") ||
      fullHistory.includes("luxury") ||
      fullHistory.includes("best")
    ) {
      contextCars = [...contextCars].sort(
        (a, b) => Number(b.pricePerDay) - Number(a.pricePerDay),
      );
    } else if (
      fullHistory.includes("cheap") ||
      fullHistory.includes("budget") ||
      fullHistory.includes("least") ||
      fullHistory.includes("affordable")
    ) {
      contextCars = [...contextCars].sort(
        (a, b) => Number(a.pricePerDay) - Number(b.pricePerDay),
      );
    }

    const displayCars = contextCars.slice(0, 15);

    // Compact inventory with IDs visible so AI can reference them
    const inventoryText = displayCars
      .map((c) => {
        const trans = c.transmission === "a" ? "Auto" : "Manual";
        const feat = c.featured ? " ⭐" : "";
        return `ID:${c.id} | ${c.year} ${c.make} ${c.model} — ${c.class}, $${c.pricePerDay}/day, ${trans}${feat}`;
      })
      .join("\n");

    // ── Natural prompt with hidden ID marker ─────────────────────
    const systemPrompt = `You are VERO, a friendly car rental expert at AutoVerse. Talk naturally — warm, helpful, never robotic.

AVAILABLE CARS:
${inventoryText}

INSTRUCTIONS:
- Recommend 1–4 cars that actually fit what the customer asked for.
- Mention car names, prices, and real details from the list.
- Be honest if we don't have exactly what they want.
- Keep responses concise but complete.

CRITICAL: At the very end of your response, on its own line, add exactly:
RECOMMENDED: id-1, id-2, id-3
Use the exact car IDs from the list above. Only include cars you actually recommended. If none, write:
RECOMMENDED: none
Do NOT explain this line to the user. It is invisible metadata.`;

    const geminiMessages = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }),
    );

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.8,
          topP: 0.95,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[VERO] Gemini error:", errText);

      if (
        errText.includes("quota") ||
        errText.includes("429") ||
        errText.includes("RESOURCE_EXHAUSTED")
      ) {
        return Response.json(
          {
            error:
              "Rate limit reached. Free tier = 20 requests/day. Enable billing on your Google Cloud project for unlimited usage.",
          },
          { status: 429 },
        );
      }

      return Response.json(
        { error: "Failed to reach AI service", details: errText },
        { status: 502 },
      );
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("[VERO] Gemini raw:", rawText.slice(0, 150));

    // ── Extract hidden RECOMMENDED line ──────────────────────────
    let textForUser = rawText;
    let recommendedCarIds: string[] = [];

    const recMatch = rawText.match(/RECOMMENDED:\s*(.+)/i);
    if (recMatch) {
      const idsStr = recMatch[1].trim();
      if (idsStr.toLowerCase() !== "none") {
        recommendedCarIds = idsStr
          .split(",")
          .map((s: string) => s.trim())
          .filter((id: string) => carById.has(id));
      }
      // Remove the metadata line from user-facing text
      textForUser = rawText.replace(/RECOMMENDED:\s*.+/i, "").trim();
    }

    // Fallback: if AI forgot the marker, try name matching
    if (recommendedCarIds.length === 0) {
      const idByName = new Map<string, string>();
      for (const c of cars) {
        const full = `${c.year} ${c.make} ${c.model}`.toLowerCase();
        const short = `${c.make} ${c.model}`.toLowerCase();
        idByName.set(full, c.id);
        idByName.set(short, c.id);
        idByName.set(c.model.toLowerCase(), c.id);
      }
      const lowerText = textForUser.toLowerCase();
      for (const [name, id] of idByName.entries()) {
        if (lowerText.includes(name) && !recommendedCarIds.includes(id)) {
          recommendedCarIds.push(id);
        }
      }
    }

    const recommendedCars = recommendedCarIds
      .map((id) => carById.get(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({
        id: c.id,
        name: `${c.year} ${c.make} ${c.model}`,
        pricePerDay: Number(c.pricePerDay),
        class: c.class,
        image: c.images?.[0] || "",
      }));

    // ── Log to ChatAnalytic ─────────────────────────────────────
    const lastUserMessage =
      [...messages]
        .reverse()
        .find((m: { role: string; content: string }) => m.role === "user")
        ?.content || "";

    let prismaUserId: string | null = null;
    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
      if (user) prismaUserId = user.id;
    }

    try {
      await prisma.chatAnalytic.create({
        data: {
          userId: prismaUserId,
          message: lastUserMessage,
          carsShown: recommendedCarIds,
        },
      });
    } catch (dbErr) {
      console.error("[VERO] ChatAnalytic log failed:", dbErr);
    }

    return Response.json({
      text: textForUser,
      recommendedCars,
    });
  } catch (err) {
    console.error("[VERO] FATAL route error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
