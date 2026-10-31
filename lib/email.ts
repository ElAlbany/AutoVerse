import { Resend } from "resend";

export async function sendOrderStatusEmail(
  data: {
    to: string;
    subject: string;
    orderId: string;
    carName: string;
    status: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
  },
  key?: string
) {
  if (!process.env.RESEND_API_KEY) throw new Error("Email is not configured.");
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
    {
      from: process.env.EMAIL_FROM || "AutoVerse <onboarding@resend.dev>",
      to: data.to,
      subject: data.subject,
      text: `AutoVerse\n\n${data.carName}\nRental reference: ${data.orderId}\nStatus: ${data.status}\nPickup: ${data.startDate}\nReturn: ${data.endDate}\nBooking total: $${data.totalPrice.toFixed(2)}\n\nManage your rental in your AutoVerse account. Completed rentals are eligible for a verified review.`,
    },
    key ? { idempotencyKey: key } : undefined
  );
  if (result.error) throw new Error("Email delivery failed.");
}
