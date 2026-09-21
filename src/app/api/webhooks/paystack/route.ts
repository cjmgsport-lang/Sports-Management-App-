import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { applyChargeSuccess, applyPaymentFailed, applySubscriptionCreated, applySubscriptionDisabled } from "@/lib/billing-events";

// Configure this exact URL (https://your-domain/api/webhooks/paystack) in
// the Paystack dashboard under Settings -> API Keys & Webhooks.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "charge.success":
        await applyChargeSuccess(event.data as Parameters<typeof applyChargeSuccess>[0]);
        break;
      case "subscription.create":
        await applySubscriptionCreated(event.data as Parameters<typeof applySubscriptionCreated>[0]);
        break;
      case "subscription.disable":
      case "subscription.not_renew":
        await applySubscriptionDisabled(event.data as Parameters<typeof applySubscriptionDisabled>[0]);
        break;
      case "invoice.payment_failed":
        await applyPaymentFailed(event.data as Parameters<typeof applyPaymentFailed>[0]);
        break;
      default:
        // Ignore anything else — new Paystack event types show up over time.
        break;
    }
  } catch (err) {
    // Log and still ack with 200 below — Paystack retries on non-2xx, and
    // a transient DB error shouldn't cause unbounded retries of a webhook
    // that may partially have already applied.
    console.error("Paystack webhook handler error:", err);
  }

  return NextResponse.json({ received: true });
}
