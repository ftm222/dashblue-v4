import { NextResponse } from "next/server";
import { getStripe, handleSubscriptionUpdate } from "@/lib/stripe";
import { supabaseAdmin, getAdminClient } from "@/lib/supabase-admin";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organization_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (orgId && customerId) {
          const admin = getAdminClient();
          await (admin.from("organizations") as any).update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            plan: session.metadata?.plan_id || "starter",
          }).eq("id", orgId);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const { status, planId } = await handleSubscriptionUpdate(subscription);

        const { data: org } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        const orgTyped = org as { id: string } | null;
        if (orgTyped) {
          const admin = getAdminClient();
          await (admin.from("organizations") as any).update({
            subscription_status: status,
            plan: event.type === "customer.subscription.deleted" ? "free" : planId,
          }).eq("id", orgTyped.id);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: org } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        const orgTyped2 = org as { id: string } | null;
        if (orgTyped2) {
          const admin = getAdminClient();
          await (admin.from("invoices") as any).insert({
            organization_id: orgTyped2.id,
            stripe_invoice_id: invoice.id,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency,
            status: "paid",
            invoice_url: invoice.hosted_invoice_url,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            paid_at: new Date().toISOString(),
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
