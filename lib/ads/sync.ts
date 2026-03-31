import { adminClient } from "@/lib/supabase-admin";
import { isMetaAdsConfig } from "./types";
import { fetchCampaignsFromMeta } from "./meta";
import type { MetaAdsConfig } from "./types";

const adminDb = adminClient as any;

interface AdsSyncResult {
  created: number;
  updated: number;
  errors: number;
  message: string;
}

export async function syncAdsIntegration(integrationId: string): Promise<AdsSyncResult> {
  const { data: integration, error: intError } = await adminDb
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (intError || !integration) {
    throw new Error("Integração não encontrada");
  }

  if (!isMetaAdsConfig(integration.config)) {
    throw new Error(
      "Integração Meta Ads não configurada. Conecte com um token de acesso (Access Token) nas configurações."
    );
  }

  const config = integration.config as MetaAdsConfig;
  const orgId: string = integration.organization_id;

  if (!orgId) {
    throw new Error("Integração sem organização vinculada");
  }

  await adminDb.from("integrations").update({ status: "syncing" }).eq("id", integrationId);

  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const periodEnd = now.toISOString().slice(0, 10);

    const campaigns = await fetchCampaignsFromMeta(config, periodStart, periodEnd);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const row of campaigns) {
      const record = {
        organization_id: orgId,
        integration_id: integrationId,
        external_id: row.external_id,
        name: row.name,
        source: row.source,
        medium: row.medium,
        investment: row.investment,
        impressions: row.impressions,
        clicks: row.clicks,
        leads: row.leads,
        booked: 0,
        received: 0,
        won: 0,
        revenue: 0,
        period_start: row.period_start,
        period_end: row.period_end,
        synced_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await adminDb
        .from("campaigns")
        .upsert(record, {
          onConflict: "integration_id,external_id",
          ignoreDuplicates: false,
        });

      if (upsertErr) {
        const { data: existing } = await adminDb
          .from("campaigns")
          .select("id")
          .eq("organization_id", orgId)
          .eq("integration_id", integrationId)
          .eq("external_id", row.external_id)
          .maybeSingle();

        if (existing) {
          const { error: updateErr } = await adminDb
            .from("campaigns")
            .update({
              name: record.name,
              source: record.source,
              medium: record.medium,
              investment: record.investment,
              impressions: record.impressions,
              clicks: record.clicks,
              leads: record.leads,
              period_start: record.period_start,
              period_end: record.period_end,
              synced_at: record.synced_at,
            })
            .eq("id", existing.id);
          if (!updateErr) updated++;
          else errors++;
        } else {
          const { error: insertErr } = await adminDb.from("campaigns").insert(record);
          if (!insertErr) created++;
          else errors++;
        }
      } else {
        created++;
      }
    }

    await adminDb
      .from("integrations")
      .update({
        status: "connected",
        last_sync: new Date().toISOString(),
      })
      .eq("id", integrationId);

    await adminDb.from("logs").insert({
      action: "ads_sync",
      entity_type: "integration",
      entity_id: integrationId,
      organization_id: orgId,
      details: {
        message: `Sincronização Meta Ads: ${created} criados, ${updated} atualizados, ${errors} erros`,
        provider: "meta",
        created,
        updated,
        errors,
        total_campaigns: campaigns.length,
      },
    });

    return {
      created,
      updated,
      errors,
      message: `${created + updated} campanhas sincronizadas${errors > 0 ? `, ${errors} erros` : ""}`,
    };
  } catch (err) {
    await adminDb
      .from("integrations")
      .update({ status: "error" })
      .eq("id", integrationId);

    const message = err instanceof Error ? err.message : "Erro desconhecido";

    await adminDb.from("logs").insert({
      action: "ads_sync_error",
      entity_type: "integration",
      entity_id: integrationId,
      organization_id: orgId,
      details: { message, provider: "meta" },
    });

    throw new Error(`Sync Meta Ads falhou: ${message}`);
  }
}
