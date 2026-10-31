"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { COMPARE_KEY, CompareCar } from "./CompareButton";
import { money } from "@/lib/rental-policy";
export default function Comparison() {
  const [cars, setCars] = useState<CompareCar[]>([]);
  useEffect(() => {
    try {
      setCars(JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]"));
    } catch {}
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
                    const next = cars.filter((x) => x.id !== c.id);
                    setCars(next);
                    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
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
            ["Seats", ...cars.map((c) => c.seats || "Ask the team")],
            ["Luggage", ...cars.map((c) => c.luggage ?? "Ask the team")],
            [
              "Transmission",
              ...cars.map((c) =>
                c.transmission === "a" ? "Automatic" : "Manual"
              ),
            ],
            ["Fuel", ...cars.map((c) => c.fuel)],
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
