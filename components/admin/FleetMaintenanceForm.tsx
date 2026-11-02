"use client";
import { useState } from "react";
import { blockVehicle } from "@/app/actions/fleet";
import { parseFleetDateTime } from "@/lib/fleet-calendar";
import ActionForm from "./ActionForm";

export default function FleetMaintenanceForm({
  unitId,
  now,
}: {
  unitId: string;
  now: string;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  let minimumEnd = "";
  try {
    minimumEnd = new Date(parseFleetDateTime(start).getTime() + 60000)
      .toISOString()
      .slice(0, 16);
  } catch {
    /* Incomplete input is allowed while editing. */
  }
  return (
    <ActionForm action={blockVehicle} label="Schedule maintenance">
      <input type="hidden" name="unitId" value={unitId} />
      <div className="av-form-row">
        <label className="av-field">
          Start (UTC)
          <input
            name="start"
            type="datetime-local"
            value={start}
            min={new Date(new Date(now).getTime() + 60000)
              .toISOString()
              .slice(0, 16)}
            onChange={(e) => {
              const value = e.target.value;
              setStart(value);
              try {
                const date = parseFleetDateTime(value);
                if (!end || parseFleetDateTime(end) <= date)
                  setEnd(
                    new Date(date.getTime() + 3600000)
                      .toISOString()
                      .slice(0, 16),
                  );
              } catch {
                /* Preserve the user's input until it is complete. */
              }
            }}
            required
          />
        </label>
        <label className="av-field">
          End (UTC)
          <input
            name="end"
            type="datetime-local"
            value={end}
            min={minimumEnd}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </label>
      </div>
      <label className="av-field">
        Reason
        <input
          name="reason"
          placeholder="e.g. scheduled service"
          maxLength={150}
          required
        />
      </label>
      <p className="av-muted">
        Existing rentals and other maintenance periods cannot overlap this
        block.
      </p>
    </ActionForm>
  );
}
