import { Resend } from "resend";

// Lazy initialization — only create Resend when needed
let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function sendOrderStatusEmail({
  to,
  subject,
  orderId,
  carName,
  status,
  startDate,
  endDate,
  totalPrice,
}: {
  to: string;
  subject: string;
  orderId: string;
  carName: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
}) {
  const resendInstance = getResend();

  if (!resendInstance) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return;
  }

  const messages: Record<string, string> = {
    PENDING: "Your order has been received and is currently under review.",
    CONFIRMED: "Great news! Your rental order has been confirmed by our team.",
    ACTIVE: "Your rental period has started. Enjoy your ride!",
    COMPLETED: "Your rental period has ended. Thank you for choosing CarHub!",
    CANCELLED: "Your rental order has been cancelled.",
  };

  try {
    await resendInstance.emails.send({
      from: "CarHub <onboarding@resend.dev>",
      to,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
          <h1 style="color:#2563eb;margin-bottom:8px;">CarHub</h1>
          <h2 style="font-size:20px;margin-bottom:16px;">${subject}</h2>
          <p style="color:#4b5563;line-height:1.6;">${messages[status] || "Your order status has been updated."}</p>
          
          <div style="background:#f8fafc;border-radius:16px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
            <h3 style="margin-top:0;font-size:16px;">Order Details</h3>
            <p style="margin:8px 0;"><strong>Order ID:</strong> #${orderId.slice(0, 8)}</p>
            <p style="margin:8px 0;"><strong>Car:</strong> ${carName}</p>
            <p style="margin:8px 0;"><strong>Status:</strong> <span style="color:#2563eb;font-weight:bold;">${status}</span></p>
            <p style="margin:8px 0;"><strong>Pick-up:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p style="margin:8px 0;"><strong>Return:</strong> ${new Date(endDate).toLocaleDateString()}</p>
            <p style="margin:8px 0;"><strong>Total:</strong> $${totalPrice}</p>
          </div>
          
          <p style="color:#9ca3af;font-size:12px;">Questions? Reply to this email or contact support.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
