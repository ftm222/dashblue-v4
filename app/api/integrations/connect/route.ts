import { NextResponse } from "next/server";
import { getCRMAdapter, isValidProvider } from "@/lib/crm/registry";
import { getProviderEnvConfig } from "@/lib/crm/types";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { provider, integrationId } = await request.json();

    if (!provider || !isValidProvider(provider)) {
      throw new ApiError("INVALID_PROVIDER", "Provider inválido.", 400);
    }

    if (!integrationId) {
      throw new ApiError("MISSING_PARAM", "integrationId é obrigatório.", 400);
    }

    const envConfig = getProviderEnvConfig(provider);
    if (!envConfig.client_id || !envConfig.client_secret) {
      throw new ApiError(
        "MISSING_CREDENTIALS",
        `Credenciais do ${provider} não configuradas. Adicione ${provider.toUpperCase()}_CLIENT_ID e ${provider.toUpperCase()}_CLIENT_SECRET no .env.local`,
        400,
      );
    }

    const state = Buffer.from(
      JSON.stringify({ integrationId, provider, nonce: crypto.randomUUID() }),
    ).toString("base64url");

    const adapter = getCRMAdapter(provider);
    const authUrl = adapter.getAuthUrl(state);

    return NextResponse.json({ authUrl, state });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
