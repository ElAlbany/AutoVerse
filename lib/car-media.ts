export function carImage(car: { images?: string[] }) {
  return (
    car.images?.find(
      (src) =>
        (src.startsWith("/") && !src.startsWith("//")) ||
        (src.startsWith("https://") && !src.includes("imagin.studio"))
    ) || "/vehicle-placeholder.svg"
  );
}

export function hasCarPhoto(car: { images?: string[] }) {
  return carImage(car) !== "/vehicle-placeholder.svg";
}
