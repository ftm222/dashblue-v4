import { adminClient } from "@/lib/supabase-admin";
import { getCRMAdapter } from "./registry";
import { isCRMConfig } from "./types";
import type { CRMConfig, CRMTokens } from "./types";

interface SyncResult {
  created: number;
  updated: number;
  errors: number;
  message: string;
}

async function ensureValidTokens(integrationId: string, config: CRMConfig): Promise<CRMTokens> {
  const tokens = config.tokens;

  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens;
  }

  const adapter = getCRMAdapter(config.provider);
  const newTokens = await adapter.refreshTokens(tokens);

  const updatedConfig: CRMConfig = {
    ...config,
    tokens: newTokens,
    ...(newTokens.company_domain && { company_domain: newTokens.company_domain }),
  };
  await adminClient
    .from("integrations")
    .update({ config: updatedConfig })
    .eq("id", integrationId);

  return newTokens;
}

function mapContactToFunnelStep(
  pipelineStage: string,
  mappings: { crm_value: string | null; step_key: string }[],
): string {
  const match = mappings.find((m) => m.crm_value === pipelineStage);
  return match?.step_key || "leads";
}

export async function syncIntegration(integrationId: string): Promise<SyncResult> {
  const { data: integration, error: intError } = await adminClient
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (intError || !integration) {
    throw new Error("Integração não encontrada");
  }

  if (!isCRMConfig(integration.config)) {
    throw new Error("Integração não configurada (sem tokens)");
  }
  const config: CRMConfig = integration.config;
  const orgId: string = integration.organization_id;

  await adminClient
    .from("integrations")
    .update({ status: "syncing" })
    .eq("id", integrationId);

  try {
    const tokens = await ensureValidTokens(integrationId, config);
    const adapter = getCRMAdapter(config.provider);

    const contacts = await adapter.fetchContacts(tokens, integration.last_sync || undefined, config);

    const { data: mappings } = await adminClient
      .from("funnel_mappings")
      .select("step_key, crm_value")
      .eq("organization_id", orgId)
      .order("sort_order");

    const funnelMappings = mappings ?? [];

    const { data: orgPeople } = await adminClient
      .from("people")
      .select("id, name, role")
      .eq("organization_id", orgId)
      .eq("active", true);

    const peopleList = orgPeople ?? [];

    function resolvePersonId(
      responsibleName: string | undefined,
    ): { sdr_id: string | null; closer_id: string | null } {
      if (!responsibleName) return { sdr_id: null, closer_id: null };
      const normalized = responsibleName.toLowerCase().trim();
      const match = peopleList.find((p) => p.name.toLowerCase().trim() === normalized);
      if (!match) return { sdr_id: null, closer_id: null };
      return match.role === "sdr"
        ? { sdr_id: match.id, closer_id: null }
        : { sdr_id: null, closer_id: match.id };
    }

    let created = 0;
    let updated = 0;
    let errors = 0;
    const errorDetails: { externalId: string; message: string }[] = [];

    const BATCH_SIZE = 15;
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);

      const externalIds = batch.map((c) => c.external_id);
      const { data: existingRows } = await adminClient
        .from("evidence")
        .select("id, crm_lead_id")
        .eq("organization_id", orgId)
        .in("crm_lead_id", externalIds);

      const existingMap = new Map(
        (existingRows ?? []).map((r: { id: string; crm_lead_id: string }) => [r.crm_lead_id, r.id]),
      );

      const toInsert: Record<string, unknown>[] = [];
      const toUpdate: { id: string; record: Record<string, unknown> }[] = [];

      for (const contact of batch) {
        const funnelStep = mapContactToFunnelStep(contact.pipeline_stage, funnelMappings);
        const personIds = resolvePersonId(contact.responsible_name);
        const record = {
          organization_id: orgId,
          contact_name: contact.name,
          email: contact.email || null,
          phone: contact.phone || null,
          crm_url: contact.crm_url,
          crm_lead_id: contact.external_id,
          funnel_step: funnelStep,
          value: contact.value,
          utm_source: contact.utm_source || null,
          utm_medium: contact.utm_medium || null,
          utm_campaign: contact.utm_campaign || null,
          tags: contact.tags,
          sdr_id: personIds.sdr_id,
          closer_id: personIds.closer_id,
          updated_at: new Date().toISOString(),
        };

        const existingId = existingMap.get(contact.external_id);
        if (existingId) {
          toUpdate.push({ id: existingId, record });
        } else {
          toInsert.push({ ...record, created_at: contact.created_at });
        }
      }

      if (toInsert.length > 0) {
        const { error: insertErr } = await adminClient.from("evidence").insert(toInsert);
        if (insertErr) {
          errors += toInsert.length;
          errorDetails.push({ externalId: "batch-insert", message: insertErr.message });
        } else {
          created += toInsert.length;
        }
      }

      const updateResults = await Promise.allSettled(
        toUpdate.map(({ id, record }) =>
          adminClient.from("evidence").update(record).eq("id", id),
        ),
      );

      for (let j = 0; j < updateResults.length; j++) {
        const result = updateResults[j];
        if (result.status === "fulfilled" && !result.value.error) {
          updated++;
        } else {
          errors++;
          const msg =
            result.status === "rejected"
              ? String(result.reason)
              : result.value.error?.message ?? "unknown";
          errorDetails.push({ externalId: toUpdate[j].id, message: msg });
        }
      }
    }

    await adminClient
      .from("integrations")
      .update({
        status: "connected",
        last_sync: new Date().toISOString(),
      })
      .eq("id", integrationId);

    await adminClient.from("logs").insert({
      action: "crm_sync",
      entity_type: "integration",
      entity_id: integrationId,
      details: {
        message: `Sincronização ${config.provider}: ${created} criados, ${updated} atualizados, ${errors} erros`,
        provider: config.provider,
        created,
        updated,
        errors,
        total_contacts: contacts.length,
        error_details: errorDetails.length > 0 ? errorDetails.slice(0, 50) : undefined,
      },
    });

    return {
      created,
      updated,
      errors,
      message: `${created} criados, ${updated} atualizados${errors > 0 ? `, ${errors} erros` : ""}`,
    };
  } catch (err) {
    await adminClient
      .from("integrations")
      .update({ status: "error" })
      .eq("id", integrationId);

    const message = err instanceof Error ? err.message : "Erro desconhecido";

    await adminClient.from("logs").insert({
      action: "crm_sync_error",
      entity_type: "integration",
      entity_id: integrationId,
      details: { message, provider: config.provider },
    });

    throw new Error(`Sync falhou: ${message}`);
  }
}

export async function fetchCRMStages(integrationId: string) {
  const { data: integration } = await adminClient
    .from("integrations")
    .select("config")
    .eq("id", integrationId)
    .single();

  if (!integration) throw new Error("Integração não encontrada");

  if (!isCRMConfig(integration.config)) {
    throw new Error("Integração sem tokens configurados");
  }
  const config: CRMConfig = integration.config;

  const tokens = await ensureValidTokens(integrationId, config);
  const adapter = getCRMAdapter(config.provider);
  return adapter.fetchPipelineStages(tokens);
}
