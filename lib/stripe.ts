import Stripe from "stripe";

export interface StripeOrgConfig {
  secret_key?: string;
  webhook_secret?: string;
  price_starter_monthly?: string;
  price_starter_yearly?: string;
  price_pro_monthly?: string;
  price_pro_yearly?: string;
}

let stripeClient: Stripe | null = null;

/** Retorna cliente Stripe. Se config for passado e tiver secret_key, usa-a; senão usa env. */
export function getStripe(config?: StripeOrgConfig): Stripe | null {
  const key = config?.secret_key || process.env.STRIPE_SECRET_KEY;
  if (!key) return config ? null : stripeClient;
  if (config?.secret_key) {
    return new Stripe(config.secret_key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
  }
  if (stripeClient) return stripeClient;
  stripeClient = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
  return stripeClient;
}

function getPricesForConfig(config?: StripeOrgConfig | null): Record<string, { monthly: string; yearly: string }> {
  if (config?.price_starter_monthly || config?.price_pro_monthly) {
    return {
      starter: {
        monthly: config.price_starter_monthly || "",
        yearly: config.price_starter_yearly || "",
      },
      pro: {
        monthly: config.price_pro_monthly || "",
        yearly: config.price_pro_yearly || "",
      },
    };
  }
  return {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    },
  };
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
  stripeConfig?: StripeOrgConfig;
}): Promise<string | null> {
  const prices = getPricesForConfig(params.stripeConfig);
  const stripe = getStripe(params.stripeConfig);
  if (!stripe) return null;

  const planPrices = prices[params.planId];
  if (!planPrices) return null;

  const priceId = params.interval === "month" ? planPrices.monthly : planPrices.yearly;
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
  stripeConfig?: StripeOrgConfig;
}): Promise<string | null> {
  const stripe = getStripe(params.stripeConfig);
  if (!stripe) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });

  return session.url;
}

export async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  orgConfig?: StripeOrgConfig | null,
): Promise<{
  status: string;
  planId: string;
  currentPeriodEnd: Date;
}> {
  const status = subscription.status;
  const item = subscription.items.data[0];
  const priceId = item?.price?.id || "";

  const prices = getPricesForConfig(orgConfig);
  let planId = "free";
  for (const [plan, p] of Object.entries(prices)) {
    if (p.monthly === priceId || p.yearly === priceId) {
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
