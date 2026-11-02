"use client";
import { useEffect, useState } from "react";
import { nextPickup, returnMinimum, suggestedReturn } from "@/lib/rental-dates";

export default function RentalDateFields({
  start,
  end,
  onStart,
  onEnd,
  compact = false,
}: {
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  compact?: boolean;
}) {
  const [minimum, setMinimum] = useState("");
  useEffect(() => {
    const update = () => setMinimum(nextPickup());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <label className={compact ? undefined : "av-field"}>
        <span>Pickup · your local time</span>
        <input
          aria-label="Pickup date and time"
          name="start"
          type="datetime-local"
          min={minimum}
          value={start}
          onChange={(e) => {
            const value = e.target.value;
            onStart(value);
            onEnd(suggestedReturn(value, end));
          }}
          required
        />
      </label>
      <label className={compact ? undefined : "av-field"}>
        <span>Return · your local time</span>
        <input
          aria-label="Return date and time"
          name="end"
          type="datetime-local"
          min={returnMinimum(start, minimum)}
          value={end}
          onChange={(e) => onEnd(e.target.value)}
          required
        />
      </label>
    </>
  );
}
