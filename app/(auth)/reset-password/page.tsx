"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, BarChart3, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setHasSession(true);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("A senha não atende aos requisitos mínimos.");
      return;
    }

    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => router.push("/overview"), 3000);
  }

  if (success) {
    return (
      <>
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">Dashblue</span>
        </div>

        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold">Senha redefinida!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua senha foi atualizada com sucesso. Redirecionando...
            </p>
          </div>
          <Link href="/overview">
            <Button className="mt-2">Ir ao painel</Button>
          </Link>
        </div>
      </>
    );
  }

  if (hasSession === false) {
    return (
      <>
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">Dashblue</span>
        </div>

        <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 p-8 text-center space-y-4">
          <h2 className="text-lg font-bold">Link inválido ou expirado</h2>
          <p className="text-sm text-muted-foreground">
            Solicite um novo link de redefinição de senha.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/forgot-password">
              <Button className="w-full">Solicitar novo link</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="w-full">Voltar ao login</Button>
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

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma nova senha para sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Crie uma senha forte"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password && (
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {[
                { label: "8+ caracteres", valid: password.length >= 8 },
                { label: "Maiúscula", valid: /[A-Z]/.test(password) },
                { label: "Número", valid: /\d/.test(password) },
                { label: "Especial", valid: /[^A-Za-z0-9]/.test(password) },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={cn("h-3 w-3 shrink-0", c.valid ? "text-emerald-500" : "text-muted-foreground/30")}
                  />
                  <span className={cn("text-[11px]", c.valid ? "text-foreground" : "text-muted-foreground/50")}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar nova senha</Label>
          <Input
            id="confirm"
            type="password"
            placeholder="Repita a nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            className={cn(
              "h-11",
              confirmPassword && !passwordsMatch && "border-destructive focus-visible:ring-destructive",
            )}
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive">As senhas não coincidem.</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 font-medium"
          disabled={loading || !passwordValid || !passwordsMatch}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Redefinir senha
        </Button>
      </form>
    </>
  );
}
