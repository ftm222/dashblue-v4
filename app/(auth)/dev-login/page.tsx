"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function DevLoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Entrando…");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function run() {
      if (!isSupabaseConfigured) {
        setMessage("Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }

      const res = await fetch("/api/auth/dev-login", { method: "POST" });
      const json = (await res.json()) as { error?: string; access_token?: string; refresh_token?: string };

      if (cancelled) return;

      if (!res.ok) {
        setMessage(json.error ?? "Erro ao entrar.");
        return;
      }

      if (!json.access_token || !json.refresh_token) {
        setMessage("Resposta inválida do servidor.");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: json.access_token,
        refresh_token: json.refresh_token,
      });

      if (cancelled) return;

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/overview");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-4 text-center text-sm text-muted-foreground">
      <p className="text-foreground">{message}</p>
      <p className="max-w-md text-xs">
        Ambiente de desenvolvimento — login automático via <code className="rounded bg-muted px-1">/dev-login</code>.
      </p>
    </div>
  );
}
