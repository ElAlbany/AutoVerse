"use client";
import type { ActionResult } from "@/lib/action-result";
import { useState, useTransition } from "react";
export default function ActionForm({
  action,
  children,
  label,
}: {
  action: (form: FormData) => Promise<void | ActionResult>;
  children: React.ReactNode;
  label: string;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(async () => {
          try {
            const result = await action(data);
            if (result && !result.ok) throw new Error(result.error);
            setMessage("Saved.");
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Could not save.");
          }
        });
      }}
    >
      {children}
      <button className="av-button av-button-small" disabled={pending}>
        {pending ? "Saving…" : label}
      </button>
      <p className="av-muted" role="status">
        {message}
      </p>
    </form>
  );
}
