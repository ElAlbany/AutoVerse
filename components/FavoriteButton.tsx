"use client";
import { Heart } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setFavorite } from "@/app/actions/favorite";
import { signInUrl } from "@/lib/sign-in";

export default function FavoriteButton({
  carId,
  initial = false,
}: {
  carId: string;
  initial?: boolean;
}) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <button
        className={`av-favorite ${saved ? "is-saved" : ""}`}
        aria-label={saved ? "Remove saved car" : "Save car"}
        aria-pressed={saved}
        disabled={pending}
        title={error || undefined}
        onClick={() => {
          if (!isSignedIn) {
            router.push(
              signInUrl(window.location.pathname + window.location.search)
            );
            return;
          }
          start(async () => {
            try {
              await setFavorite(carId, !saved);
              setSaved(!saved);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save car");
            }
          });
        }}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
      {error && (
        <span className="av-card-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
