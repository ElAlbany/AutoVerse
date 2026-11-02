import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { MAX_IMAGE_BYTES, prepareVehicleImage } from "../lib/image-upload";
test("photo preparation limits dimensions and removes identifying metadata", async () => {
  const input = await sharp({
    create: { width: 2400, height: 1600, channels: 3, background: "#abc" },
  })
    .jpeg()
    .withExif({ IFD0: { Artist: "Private fixture" } })
    .toBuffer();
  const output = await prepareVehicleImage(input);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 1600);
  assert.ok(metadata.height! <= 1200);
  assert.equal(metadata.exif, undefined);
});
test("photo preparation rejects spoofed content, SVG and oversized uploads", async () => {
  await assert.rejects(prepareVehicleImage(Buffer.from("not a photo")));
  await assert.rejects(
    prepareVehicleImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
      ),
    ),
  );
  await assert.rejects(
    prepareVehicleImage(new Uint8Array(MAX_IMAGE_BYTES + 1)),
    /3 MB/,
  );
});
