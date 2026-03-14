import type { CRMAdapter, CRMProvider } from "./types";
import { getProviderEnvConfig } from "./types";
import { createKommoAdapter } from "./kommo";
import { createHubSpotAdapter } from "./hubspot";
import { createPipedriveAdapter } from "./pipedrive";

const adapters: Record<CRMProvider, () => CRMAdapter> = {
  kommo: () => createKommoAdapter(getProviderEnvConfig("kommo")),
  hubspot: () => createHubSpotAdapter(getProviderEnvConfig("hubspot")),
  pipedrive: () => createPipedriveAdapter(getProviderEnvConfig("pipedrive")),
};

export function getCRMAdapter(provider: CRMProvider): CRMAdapter {
  const factory = adapters[provider];
  if (!factory) throw new Error(`CRM provider desconhecido: ${provider}`);
  return factory();
}

export function isValidProvider(value: string): value is CRMProvider {
  return ["kommo", "hubspot", "pipedrive"].includes(value);
}

export const PROVIDER_LABELS: Record<CRMProvider, string> = {
  kommo: "Kommo",
  hubspot: "HubSpot",
  pipedrive: "Pipedrive",
};
