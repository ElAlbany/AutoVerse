import { getStripe, settleCheckout } from "@/lib/payments";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET)
    return new Response("Webhook not configured", { status: 400 });
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  if (event.livemode)
    return new Response("Live payments disabled", { status: 400 });
  try {
    if (
      [
        "checkout.session.completed",
        "checkout.session.expired",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type)
    ) {
      await settleCheckout(
        event.data.object as import("stripe").default.Checkout.Session,
        event.id
      );
    }
    return Response.json({ received: true });
  } catch {
    return new Response("Delivery could not be completed; retry required", {
      status: 500,
    });
  }
}
