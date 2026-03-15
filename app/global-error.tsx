"use client";

import { useEffect } from "react";

/**
 * Captura erros fatais no root layout.
 * Deve incluir html e body pois substitui o layout inteiro.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0f172a", color: "#e2e8f0", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Erro interno do sistema
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Ocorreu um erro inesperado. Verifique se as variáveis de ambiente estão configuradas (.env.local).
            Para Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              borderRadius: "0.375rem",
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
