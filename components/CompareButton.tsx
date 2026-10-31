"use client";
import { useEffect, useState } from "react";
import { Columns2 } from "lucide-react";
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
};
export const COMPARE_KEY = "autoverse-compare";
export default function CompareButton({ car }: { car: CompareCar }) {
  const [selected, setSelected] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const sync = () => {
      try {
        setSelected(
          (
            JSON.parse(
              localStorage.getItem(COMPARE_KEY) || "[]"
            ) as CompareCar[]
          ).some((c) => c.id === car.id)
        );
      } catch {}
    };
    sync();
    window.addEventListener("autoverse-compare", sync);
    return () => window.removeEventListener("autoverse-compare", sync);
  }, [car.id]);
  return (
    <div className="av-compare-control">
      <button
        aria-pressed={selected}
        onClick={() => {
          try {
            const current: CompareCar[] = JSON.parse(
              localStorage.getItem(COMPARE_KEY) || "[]"
            );
            if (!selected && current.length >= 3) {
              setMessage("Compare up to three cars. Remove one first.");
              return;
            }
            localStorage.setItem(
              COMPARE_KEY,
              JSON.stringify(
                selected
                  ? current.filter((c) => c.id !== car.id)
                  : [...current, car]
              )
            );
            window.dispatchEvent(new Event("autoverse-compare"));
            setMessage("");
          } catch {
            setMessage("Your browser could not save this comparison.");
          }
        }}
      >
        <Columns2 size={14} />
        {selected ? "Added to comparison" : "Compare"}
      </button>
      {selected && <a href="/compare">View comparison →</a>}
      {message && <small role="status">{message}</small>}
    </div>
  );
}
