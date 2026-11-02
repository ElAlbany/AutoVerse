"use client";
import { useEffect, useState } from "react";
import { Columns2 } from "lucide-react";
import { COMPARE_KEY, readComparison, type CompareCar } from "@/lib/comparison";
export { COMPARE_KEY, type CompareCar } from "@/lib/comparison";
export default function CompareButton({ car }: { car: CompareCar }) {
  const [selected, setSelected] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const sync = () => {
      setSelected(readComparison().some((c) => c.id === car.id));
    };
    sync();
    window.addEventListener("autoverse-compare", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("autoverse-compare", sync);
      window.removeEventListener("storage", sync);
    };
  }, [car.id]);
  return (
    <div className="av-compare-control">
      <button
        aria-pressed={selected}
        onClick={() => {
          try {
            const current = readComparison();
            const alreadySelected = current.some((item) => item.id === car.id);
            if (!alreadySelected && current.length >= 3) {
              setMessage("Compare up to three cars. Remove one first.");
              return;
            }
            localStorage.setItem(
              COMPARE_KEY,
              JSON.stringify(
                alreadySelected
                  ? current.filter((c) => c.id !== car.id)
                  : [...current, car],
              ),
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
