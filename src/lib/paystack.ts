import crypto from "crypto";

// --- Plan pricing / Paystack plan codes -------------------------------
// STARTER has no Paystack plan (it's free). ENTERPRISE is "contact us"
// (custom pricing, no self-serve checkout). Only GROWTH and PRO go
// through Paystack Standard Checkout + Subscriptions.
//
// Plan codes come from your Paystack dashboard (Payments -> Plans -> add
// a plan priced in ZAR, matching the amounts below) — set them as
// PAYSTACK_PLAN_CODE_GROWTH / PAYSTACK_PLAN_CODE_PRO. See README.

export type BillablePlan = "GROWTH" | "PRO";

export const PLAN_PRICING: Record<BillablePlan, { name: string; amountZarCents: number; planCodeEnvVar: string }> = {
  GROWTH: { name: "Growth", amountZarCents: 249900, planCodeEnvVar: "PAYSTACK_PLAN_CODE_GROWTH" },
  PRO: { name: "Pro", amountZarCents: 599900, planCodeEnvVar: "PAYSTACK_PLAN_CODE_PRO" },
};

export function getPaystackPlanCode(plan: BillablePlan): string | null {
  return process.env[PLAN_PRICING[plan].planCodeEnvVar] || null;
}

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

async function paystackRequest<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) {
    throw new Error(`Paystack API error (${path}): ${json.message ?? res.statusText}`);
  }
  return json.data as T;
}

export type InitializeTransactionResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export async function initializeTransaction(opts: {
  email: string;
  amountZarCents: number;
  planCode: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<InitializeTransactionResult> {
  return paystackRequest<InitializeTransactionResult>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountZarCents,
      plan: opts.planCode,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata,
    }),
  });
}

// Kept loose/optional throughout (rather than strict) since this same shape
// is passed to src/lib/billing-events.ts's PaystackEventData, which also
// describes webhook payloads — those carry the same fields but Paystack's
// docs don't guarantee every field is always present.
export type VerifyTransactionResult = {
  status: string; // "success" | "failed" | "abandoned" | ...
  reference: string;
  customer?: { customer_code?: string; email?: string } | null;
  plan?: string | { plan_code?: string } | null;
  metadata?: { organizationId?: string; plan?: string } | null;
  authorization?: { authorization_code?: string };
};

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
  return paystackRequest<VerifyTransactionResult>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export type PaystackSubscription = {
  subscription_code: string;
  email_token: string;
  status: string;
  next_payment_date?: string;
  customer: { customer_code: string };
};

export async function getSubscription(code: string): Promise<PaystackSubscription> {
  return paystackRequest<PaystackSubscription>(`/subscription/${encodeURIComponent(code)}`);
}

export async function disableSubscription(code: string, emailToken: string): Promise<void> {
  await paystackRequest("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code, token: emailToken }),
  });
}

/** Verifies the `X-Paystack-Signature` header against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  // Constant-time comparison to avoid leaking the expected signature via timing.
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
