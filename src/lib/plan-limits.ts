// Seat limits per plan — kept in one place since they're set from three
// different code paths (signup's free Starter subscription, the free
// downgrade action, and a successful Paystack charge) and checked from a
// fourth (adding a new org member). ENTERPRISE has no self-serve checkout
// (it's "contact sales"), but a very high number here means an operator
// manually setting plan=ENTERPRISE in the database doesn't need a special
// "unlimited" case anywhere else in the code.
export const PLAN_SEAT_LIMITS: Record<string, number> = {
  STARTER: 50,
  GROWTH: 250,
  PRO: 1000,
  ENTERPRISE: 100000,
};

export function seatLimitForPlan(plan: string): number {
  return PLAN_SEAT_LIMITS[plan] ?? PLAN_SEAT_LIMITS.STARTER;
}
