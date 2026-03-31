type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

interface JobDefinition {
  name: string;
  handler: JobHandler;
  retries: number;
  backoffMs: number;
}

const jobRegistry = new Map<string, JobDefinition>();

export function defineJob(
  name: string,
  handler: JobHandler,
  options: { retries?: number; backoffMs?: number } = {},
): void {
  jobRegistry.set(name, {
    name,
    handler,
    retries: options.retries ?? 3,
    backoffMs: options.backoffMs ?? 1000,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enqueueJob(
  name: string,
  payload: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  const job = jobRegistry.get(name);
  if (!job) {
    return { success: false, error: `Job "${name}" not found in registry` };
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= job.retries; attempt++) {
    try {
      await job.handler(payload);
      return { success: true };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Job] ${name} attempt ${attempt + 1}/${job.retries + 1} failed:`, lastError.message);
      if (attempt < job.retries) {
        await sleep(job.backoffMs * Math.pow(2, attempt));
      }
    }
  }

  return { success: false, error: lastError?.message ?? "Unknown error" };
}

// Pre-register common jobs
import { syncIntegration } from "@/lib/crm/sync";
import { syncAdsIntegration } from "@/lib/ads/sync";

defineJob("crm:sync", async (payload) => {
  const integrationId = payload.integrationId as string;
  if (!integrationId) throw new Error("integrationId is required");
  await syncIntegration(integrationId);
}, { retries: 3, backoffMs: 2000 });

defineJob("ads:sync", async (payload) => {
  const integrationId = payload.integrationId as string;
  if (!integrationId) throw new Error("integrationId is required");
  await syncAdsIntegration(integrationId);
}, { retries: 3, backoffMs: 2000 });

defineJob("email:send", async (payload) => {
  const { sendEmail } = await import("@/lib/email");
  await sendEmail({
    to: payload.to as string,
    subject: payload.subject as string,
    html: payload.html as string,
    text: payload.text as string | undefined,
  });
}, { retries: 2, backoffMs: 1000 });
