"use client";

import { BarChart3 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Painel lateral decorativo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2030%2030%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%2030L30%200%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.03)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 backdrop-blur-sm">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Dashblue
            </span>
          </div>

          <div className="space-y-6">
            <blockquote className="space-y-3">
              <p className="text-2xl font-semibold leading-snug text-white/90">
                "A torre de controle que transformou a forma como gerenciamos nosso funil de vendas B2B."
              </p>
              <footer className="text-sm text-blue-300/80">
                — CEO, Empresa parceira
              </footer>
            </blockquote>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">+340%</p>
                <p className="text-xs text-blue-300/60 mt-1">Visibilidade do funil</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">-45%</p>
                <p className="text-xs text-blue-300/60 mt-1">Tempo de análise</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">2.8x</p>
                <p className="text-xs text-blue-300/60 mt-1">ROAS médio</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Dashblue. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Área do formulário */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
