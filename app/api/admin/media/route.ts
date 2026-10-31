import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_IMAGE_BYTES, prepareVehicleImage } from "@/lib/image-upload";
import { mediaStorageInfo, storeVehicleImage } from "@/lib/media-storage";
export const runtime = "nodejs";
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return Response.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  }
  try {
    return Response.json(mediaStorageInfo(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Photo storage is unavailable.",
      },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return Response.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  }
  try {
    await rateLimit(`photos:${admin.id}`, 40);
    mediaStorageInfo();
    const maxRequest = MAX_IMAGE_BYTES + 100_000;
    if (Number(request.headers.get("content-length")) > maxRequest)
      return Response.json(
        { error: "Upload one photo at a time, up to 3 MB." },
        { status: 413 },
      );
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Choose a photo to upload.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxRequest) {
          await reader.cancel();
          return Response.json(
            { error: "Photo is too large. Maximum 3 MB." },
            { status: 413 },
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const form = await new Response(new Uint8Array(Buffer.concat(chunks)), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Choose a photo to upload.");
    const bytes = await prepareVehicleImage(
      new Uint8Array(await file.arrayBuffer()),
    );
    let url: string;
    try {
      url = await storeVehicleImage(bytes);
    } catch {
      throw new Error(
        "The photo could not be saved. Check the storage connection and try again.",
      );
    }
    return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Photo upload failed." },
      { status: 400 },
    );
  }
}
