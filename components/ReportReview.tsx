"use client";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reportReview } from "@/app/actions/review";
import { signInUrl } from "@/lib/sign-in";
export default function ReportReview({ id }: { id: string }) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <button
      className="av-text-link"
      style={{ fontSize: 10 }}
      disabled={!!message}
      onClick={async () => {
        if (!isSignedIn) {
          router.push(signInUrl(window.location.pathname));
          return;
        }
        try {
          await reportReview(id);
          setMessage("Reported to the team");
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Try again later");
        }
      }}
    >
      {message || "Report review"}
    </button>
  );
}
