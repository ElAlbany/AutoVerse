import { test } from "node:test";
import assert from "node:assert/strict";
import { carGallery, hasCarPhoto, validCarImageUrl } from "../lib/car-media";
const car = { make: "Audi", model: "Q7", year: 2023 };
test("API mode always provides distinct model illustration angles", () => {
  const gallery = carGallery({
    ...car,
    imageSource: "API",
    images: ["https://example.test/old-photo.jpg"],
  });
  assert.deepEqual(
    gallery.map((image) => new URL(image.src).searchParams.get("angle")),
    ["01", "21", "13"],
  );
  assert.equal(
    hasCarPhoto({
      ...car,
      imageSource: "API",
      images: ["https://example.test/old-photo.jpg"],
    }),
    false,
  );
});
test("real photos retain cover order, accept stored uploads and reject unsafe URL schemes", () => {
  const images = [
    "/api/media/12345678-1234-1234-1234-123456789abc.webp",
    "https://example.test/side.jpg",
  ];
  assert.deepEqual(
    carGallery({ ...car, imageSource: "UPLOADED", images }).map((i) => i.src),
    images,
  );
  for (const unsafe of [
    "//evil.test/x.jpg",
    "javascript:alert(1)",
    "data:image/svg+xml,x",
    "/api/media/../../.env",
    "https://user:password@example.test/photo.jpg",
  ])
    assert.equal(validCarImageUrl(unsafe), false);
});
