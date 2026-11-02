"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { suggestedReturn } from "@/lib/rental-dates";
import RentalDateFields from "./RentalDateFields";
import { ArrowUpRight, MapPin } from "lucide-react";

export default function BookingSearch({
  start = "",
  end = "",
  branchId = "",
  branches = [],
}: {
  start?: string;
  end?: string;
  branchId?: string;
  branches?: { id: string; name: string; city: string }[];
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
    setUntil(suggestedReturn(local(start), local(end)));
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
        if (data.get("branchId"))
          query.set("branchId", String(data.get("branchId")));
        router.push(`/?${query}#discover`);
      }}
      className="av-search"
      aria-label="Find available cars"
    >
      <label className="av-search-location">
        <span>
          <MapPin size={14} /> Collection point
        </span>
        <select
          name="branchId"
          key={branchId}
          defaultValue={branchId}
          onChange={(e) => {
            const query = new URLSearchParams(window.location.search);
            query.set("branchId", e.target.value);
            query.delete("page");
            router.push(`/?${query}#discover`, { scroll: false });
          }}
          aria-label="Collection branch"
        >
          {!branches.length && <option value="">No open branches</option>}
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
              {branch.city !== branch.name ? ` · ${branch.city}` : ""}
            </option>
          ))}
        </select>
      </label>
      <RentalDateFields
        start={from}
        end={until}
        onStart={setFrom}
        onEnd={setUntil}
        compact
      />
      <button className="av-button" type="submit">
        Find a car <ArrowUpRight size={18} />
      </button>
    </form>
  );
}
