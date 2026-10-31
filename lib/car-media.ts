type MediaCar = {
  make?: string;
  model?: string;
  year?: number;
  images?: string[];
  imageSource?: string;
};
export type GalleryImage = { src: string; label: string };
export function validCarImageUrl(src: string) {
  if (/^\/api\/media\/[a-f0-9-]{36}\.webp$/.test(src)) return true;
  if (/^\/vehicle-[a-zA-Z0-9._-]+$/.test(src)) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
const actualImages = (car: MediaCar) =>
  (car.images || []).filter(
    (src) =>
      validCarImageUrl(src) &&
      !src.includes("imagin.studio") &&
      !src.includes("placeholder"),
  );
export function hasCarPhoto(car: MediaCar) {
  return car.imageSource !== "API" && actualImages(car).length > 0;
}
export function carGallery(car: MediaCar): GalleryImage[] {
  if (hasCarPhoto(car))
    return actualImages(car)
      .slice(0, 12)
      .map((src, i) => ({
        src,
        label: i === 0 ? "Cover photo" : `Vehicle photo ${i + 1}`,
      }));
  if (!car.make || !car.model || !car.year)
    return [{ src: "/vehicle-placeholder.svg", label: "Vehicle illustration" }];
  return [
    { angle: "01", label: "Front three-quarter" },
    { angle: "21", label: "Side profile" },
    { angle: "13", label: "Rear view" },
  ].map((view) => {
    const query = new URLSearchParams({
      customer: process.env.NEXT_PUBLIC_IMAGIN_CUSTOMER || "img",
      make: car.make!.toLowerCase(),
      modelFamily: car.model!.split(" ")[0].toLowerCase(),
      modelYear: String(car.year),
      angle: view.angle,
      width: "1200",
      zoomType: "fullscreen",
    });
    return {
      src: `https://cdn.imagin.studio/getimage?${query}`,
      label: view.label,
    };
  });
}
export function carImage(car: MediaCar) {
  return carGallery(car)[0].src;
}
