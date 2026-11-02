"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { COMPARE_KEY, readComparison, type CompareCar } from "@/lib/comparison";
import { useLabel } from "@/lib/vehicle-use";
import { money } from "@/lib/rental-policy";
export default function Comparison() {
  const [cars, setCars] = useState<CompareCar[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => setCars(readComparison());
    sync();
    window.addEventListener("autoverse-compare", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("autoverse-compare", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  if (!cars.length)
    return (
      <div className="av-panel av-empty">
        <h2>A little perspective helps.</h2>
        <p>
          Add up to three cars from the collection to compare them side by side.
        </p>
        <Link className="av-button" href="/#discover">
          Explore cars
        </Link>
      </div>
    );
  return (
    <div className="av-panel av-comparison">
      <p className="av-muted">
        Saved comparison. Check the vehicle page for current prices and date
        availability.
      </p>
      {error && <p role="alert" className="av-alert">{error}</p>}
      <table>
        <thead>
          <tr>
            <th scope="col">Your shortlist</th>
            {cars.map((c) => (
              <th key={c.id} scope="col">
                <Link href={`/car-details/${c.id}`}>
                  {c.make} {c.model}
                </Link>
                <button
                  className="av-text-link"
                  onClick={() => {
                    try {
                      const next = readComparison().filter((x) => x.id !== c.id);
                      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
                      setCars(next);
                      setError("");
                      window.dispatchEvent(new Event("autoverse-compare"));
                    } catch {
                      setError("Your browser could not update this comparison. Check its storage settings and try again.");
                    }
                  }}
                >
                  Remove
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Starting daily rate", ...cars.map((c) => money(c.price))],
            ["Collection branch", ...cars.map((c) => c.branchName || "Check vehicle page")],
            ["Seats", ...cars.map((c) => c.seats || "Ask the team")],
            ["Luggage", ...cars.map((c) => c.luggage ?? "Ask the team")],
            [
              "Transmission",
              ...cars.map((c) =>
                c.transmission === "a" ? "Automatic" : "Manual",
              ),
            ],
            ["Fuel", ...cars.map((c) => c.fuel)],
            [
              "Recommended journeys",
              ...cars.map(
                (c) => c.usageTags?.map(useLabel).join(", ") || "Ask the team",
              ),
            ],
          ].map((row) => (
            <tr key={row[0]}>
              <th scope="row">{row[0]}</th>
              {row.slice(1).map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
