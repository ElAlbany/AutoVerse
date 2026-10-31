"use client";
import { useState, useTransition } from "react";
import { saveReview } from "@/app/actions/review";
import { Star } from "lucide-react";

export default function ReviewForm({
  orderId,
  initial,
}: {
  orderId: string;
  initial?: { rating: number; comment: string | null } | null;
}) {
  const [rating, setRating] = useState(initial?.rating || 5);
  const [comment, setComment] = useState(initial?.comment || "");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="av-panel av-review-form"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await saveReview(orderId, rating, comment);
            setMessage("Your verified review has been saved.");
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Could not save review."
            );
          }
        });
      }}
    >
      <p className="av-eyebrow">Verified rental</p>
      <h2>{initial ? "Your experience" : "How was your drive?"}</h2>
      <p className="av-muted">
        Help the next driver choose. Reviews can be edited for 14 days.
      </p>
      <fieldset>
        <legend className="sr-only">Overall rating</legend>
        <div className="av-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n}>
              <input
                className="sr-only"
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
              />
              <Star size={28} fill={n <= rating ? "currentColor" : "none"} />
              <span className="sr-only">{n} stars</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="av-field">
        Your review
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Vehicle condition, collection, and anything future renters should know."
        />
      </label>
      <button className="av-button" disabled={pending}>
        {pending ? "Saving…" : "Publish review"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
