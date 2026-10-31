"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";

export default function BookingSearch({
  start = "",
  end = "",
  location = "",
}: {
  start?: string;
  end?: string;
  location?: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  useEffect(() => {
    const local = (v: string) => {
      const d = new Date(v);
      return Number.isFinite(d.getTime())
        ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : "";
    };
    setFrom(local(start));
    setUntil(local(end));
  }, [start, end]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const query = new URLSearchParams({
          start: new Date(String(data.get("start"))).toISOString(),
          end: new Date(String(data.get("end"))).toISOString(),
        });
        if (data.get("location"))
          query.set("location", String(data.get("location")));
        router.push(`/?${query}#discover`);
      }}
      className="av-search"
      aria-label="Find available cars"
    >
      <label className="av-search-location">
        <span>
          <MapPin size={14} /> Collection point
        </span>
        <input
          name="location"
          placeholder="Main collection point"
          defaultValue={location}
          maxLength={100}
        />
      </label>
      <label>
        <span>Pickup · your local time</span>
        <input
          type="datetime-local"
          name="start"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Pickup date and time"
          required
        />
      </label>
      <label>
        <span>Return · your local time</span>
        <input
          type="datetime-local"
          name="end"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          aria-label="Return date and time"
          required
        />
      </label>
      <button className="av-button" type="submit">
        Find a car <ArrowUpRight size={18} />
      </button>
    </form>
  );
}
