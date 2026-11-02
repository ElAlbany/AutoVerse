import { validCarImageUrl } from "./car-media";

export type CompareCar = {
  id: string;
  make: string;
  model: string;
  image: string;
  price: number;
  seats?: number | null;
  luggage?: number | null;
  transmission: string;
  fuel: string;
  usageTags?: string[];
};
export const COMPARE_KEY = "autoverse-compare";

export function parseComparison(raw: string | null): CompareCar[] {
  try {
    if (!raw || raw.length > 30000) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const result: CompareCar[] = [];
    const text = (v: unknown, max = 100): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;
      const car = entry as Record<string, unknown>;
      if (!text(car.id) || !/^[a-zA-Z0-9-]+$/.test(car.id) || !text(car.make) || !text(car.model) || !text(car.transmission) || !text(car.fuel) || typeof car.price !== "number" || !Number.isFinite(car.price) || car.price <= 0 || result.some((item) => item.id === car.id)) continue;
      const capacity = (n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= 20 ? Number(n) : null;
      result.push({
        id: car.id, make: car.make, model: car.model, price: car.price,
        transmission: car.transmission, fuel: car.fuel,
        image: text(car.image, 2000) && validCarImageUrl(car.image) ? car.image : "/vehicle-placeholder.svg",
        seats: capacity(car.seats), luggage: capacity(car.luggage),
        usageTags: Array.isArray(car.usageTags) ? car.usageTags.filter((tag): tag is string => text(tag, 60)).slice(0, 10) : [],
      });
      if (result.length === 3) break;
    }
    return result;
  } catch {
    return [];
  }
}

export function readComparison() {
  try { return parseComparison(localStorage.getItem(COMPARE_KEY)); }
  catch { return []; }
}
