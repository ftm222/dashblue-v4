/**
 * Helper para registro de auditoria em mutations.
 * Garante rastreabilidade de ações em contracts, people, campaigns, etc.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  admin: SupabaseClient,
  opts: {
    userId: string | null;
    orgId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    details?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await (admin.from("logs") as any).insert({
      user_id: opts.userId,
      organization_id: opts.orgId,
      action: opts.action,
      entity_type: opts.entityType,
      entity_id: opts.entityId,
      details: opts.details ?? null,
    });
  } catch (err) {
    console.error("[Audit] Falha ao registrar log:", err);
    // Não propaga erro — auditoria não deve quebrar a operação principal
  }
}
