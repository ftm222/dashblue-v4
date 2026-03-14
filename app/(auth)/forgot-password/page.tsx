"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, BarChart3, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Informe seu email.");
      return;
    }

    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` },
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <>
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">Dashblue</span>
        </div>

        <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/20 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Mail className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold">Email enviado!</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Se o email <span className="font-medium text-foreground">{email}</span> estiver
              cadastrado, você receberá um link para redefinir sua senha.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/60">
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" onClick={() => { setSent(false); setEmail(""); }}>
              Enviar novamente
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2.5 mb-8 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <BarChart3 className="h-4.5 w-4.5 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight">Dashblue</span>
      </div>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao login
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Esqueceu a senha?</h1>
        <p className="text-sm text-muted-foreground">
          Informe seu email e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            className="h-11"
            autoFocus
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar link de recuperação
        </Button>
      </form>
    </>
  );
}
