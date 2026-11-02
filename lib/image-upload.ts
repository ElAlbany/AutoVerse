import sharp from "sharp";
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export async function prepareVehicleImage(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
    throw new Error("Choose a JPEG, PNG or WebP photo no larger than 3 MB.");
  try {
    const image = sharp(bytes, {
      limitInputPixels: 24_000_000,
      failOn: "error",
    });
    const meta = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format || "") ||
      (meta.pages || 1) > 1
    )
      throw new Error("unsupported");
    // Re-encoding verifies the content and strips EXIF/GPS metadata by default.
    return await image
      .rotate()
      .resize({
        width: 1600,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error(
      "This file is not a supported single-frame JPEG, PNG or WebP photograph (maximum 24 megapixels).",
    );
  }
}
