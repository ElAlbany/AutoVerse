import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { moderateReview } from "@/app/actions/review";
import ActionForm from "@/components/admin/ActionForm";
export default async function ReviewsAdmin() {
  await requireAdmin();
  const reviews = await prisma.review.findMany({
    orderBy: [{ reported: "desc" }, { createdAt: "desc" }],
    include: { car: true },
    take: 100,
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Review moderation</h1>
      <p className="av-muted">
        Keep honest feedback visible. Hide content only for a specific policy
        violation. Showing the latest 100 reviews, with reports first.
      </p>
      {reviews.map((r) => (
        <section className="av-panel" key={r.id}>
          <h2>
            {r.car.make} {r.car.model} · {r.rating}/5
          </h2>
          <p className="av-muted my-4">{r.comment || "Rating only"}</p>
          <p className="av-muted mb-4">
            {r.hidden ? `Hidden: ${r.moderationReason}` : "Published"}
            {r.reported ? " · Reported" : ""}
          </p>
          <ActionForm
            label={r.hidden ? "Restore review" : "Hide with reason"}
            action={async (form) => {
              "use server";
              await moderateReview(
                r.id,
                !r.hidden,
                String(form.get("reason") || "Restored after review")
              );
            }}
          >
            <label className="av-field">
              Moderation reason
              <input
                name="reason"
                required={!r.hidden}
                minLength={r.hidden ? 0 : 10}
                maxLength={500}
              />
            </label>
          </ActionForm>
        </section>
      ))}
    </div>
  );
}
