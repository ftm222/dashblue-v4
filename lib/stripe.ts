import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
  return stripeClient;
}

export const PLAN_PRICES: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  },
};

export async function createCheckoutSession(params: {
  organizationId: string;
  planId: string;
  interval: "month" | "year";
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const prices = PLAN_PRICES[params.planId];
  if (!prices) return null;

  const priceId = params.interval === "month" ? prices.monthly : prices.yearly;
  if (!priceId) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: params.customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      organization_id: params.organizationId,
      plan_id: params.planId,
    },
  });

  return session.url;
}

export async function createBillingPortalSession(params: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });

  return session.url;
}

export async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<{
  status: string;
  planId: string;
  currentPeriodEnd: Date;
}> {
  const status = subscription.status;
  const item = subscription.items.data[0];
  const priceId = item?.price?.id || "";

  let planId = "free";
  for (const [plan, prices] of Object.entries(PLAN_PRICES)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      planId = plan;
      break;
    }
  }

  return {
    status,
    planId,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };
}
