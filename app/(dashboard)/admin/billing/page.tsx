"use client";

import { useState, useEffect } from "react";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const PLAN_PRICES = {
  starter: { month: "R$ 197/mês", year: "R$ 1.970/ano" },
  pro: { month: "R$ 497/mês", year: "R$ 4.970/ano" },
};

export default function BillingPage() {
  const { organization, profile } = useAuth();
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  const isAdmin = profile?.role === "owner" || profile?.role === "admin";

  // Fetch stripe_customer_id from org (not in AuthProvider org select)
  useEffect(() => {
    if (!organization?.id) return;
    supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", organization.id)
      .single()
      .then(({ data }) => setStripeCustomerId((data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null));
  }, [organization?.id]);

  async function handleCheckout(planId: "starter" | "pro", interval: "month" | "year") {
    if (!isAdmin || !organization) return;
    setLoading("checkout");
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, interval }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erro ao iniciar checkout");
      if (json.url) window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar checkout");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    if (!isAdmin) return;
    setLoading("portal");
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sessão expirada");

      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erro ao abrir portal");
      if (json.url) window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir portal");
    } finally {
      setLoading(null);
    }
  }

  if (!organization) {
    return (
      <AdminPageWrapper title="Billing" description="Gerencie seu plano e assinatura">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Carregando organização...</p>
          </CardContent>
        </Card>
      </AdminPageWrapper>
    );
  }

  if (!isAdmin) {
    return (
      <AdminPageWrapper title="Billing" description="Gerencie seu plano e assinatura">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
            <p className="mt-4 text-sm text-muted-foreground">
              Apenas owners e admins podem gerenciar o billing.
            </p>
          </CardContent>
        </Card>
      </AdminPageWrapper>
    );
  }

  const planLabel = PLAN_LABELS[organization.plan] ?? organization.plan;
  const hasStripeCustomer = Boolean(stripeCustomerId);

  return (
    <AdminPageWrapper title="Billing" description="Gerencie seu plano e assinatura">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Plano atual</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {planLabel}
                  </Badge>
                  {" · "}
                  {organization.subscription_status === "trialing" && "Período de teste"}
                  {organization.subscription_status === "active" && "Ativo"}
                  {organization.subscription_status === "past_due" && "Pagamento pendente"}
                  {organization.subscription_status === "canceled" && "Cancelado"}
                  {organization.subscription_status === "unpaid" && "Não pago"}
                </p>
              </div>
              {hasStripeCustomer && (
                <Button
                  variant="outline"
                  onClick={handlePortal}
                  disabled={!!loading}
                  className="gap-2"
                >
                  {loading === "portal" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Gerenciar assinatura
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {organization.plan === "free" && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">Fazer upgrade</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha um plano para desbloquear mais recursos e integrar Stripe.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="font-medium">Starter</p>
                  <p className="mt-1 text-2xl font-bold">{PLAN_PRICES.starter.month}</p>
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    onClick={() => handleCheckout("starter", "month")}
                    disabled={!!loading}
                  >
                    {loading === "checkout" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Assinar mensal"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    size="sm"
                    onClick={() => handleCheckout("starter", "year")}
                    disabled={!!loading}
                  >
                    Assinar anual (2 meses grátis)
                  </Button>
                </div>
                <div className="rounded-lg border border-blue-600 bg-blue-50/50 p-4 dark:bg-blue-950/20">
                  <p className="font-medium">Pro</p>
                  <p className="mt-1 text-2xl font-bold">{PLAN_PRICES.pro.month}</p>
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    onClick={() => handleCheckout("pro", "month")}
                    disabled={!!loading}
                  >
                    {loading === "checkout" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Assinar mensal"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    size="sm"
                    onClick={() => handleCheckout("pro", "year")}
                    disabled={!!loading}
                  >
                    Assinar anual (2 meses grátis)
                  </Button>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Configure STRIPE_SECRET_KEY e os IDs de preço (STRIPE_PRICE_*) no .env.local para
                que o checkout funcione.
              </p>
            </CardContent>
        </Card>
        )}
      </div>
    </AdminPageWrapper>
  );
}
