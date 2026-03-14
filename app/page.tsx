"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ArrowRight,
  Check,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Users,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Phone,
  DollarSign,
  Brain,
  Menu,
  X,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────── DATA ─────────────── */

const NAV_LINKS = [
  { label: "Funcionalidades", href: "#features" },
  { label: "Planos", href: "#pricing" },
  { label: "Depoimentos", href: "#testimonials" },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Overview em tempo real",
    desc: "KPIs de receita, funil e performance atualizados automaticamente com dados do seu CRM.",
  },
  {
    icon: Megaphone,
    title: "Gestão de Tráfego",
    desc: "Acompanhe investimento, leads, CPL, CAC e ROAS por canal e campanha em um só lugar.",
  },
  {
    icon: Users,
    title: "Performance de SDRs",
    desc: "Monitore ligações, agendamentos, no-shows e taxas de conversão de cada pré-vendedor.",
  },
  {
    icon: Phone,
    title: "Controle de Closers",
    desc: "Visualize reuniões, propostas, fechamentos e ticket médio por closer.",
  },
  {
    icon: DollarSign,
    title: "Financeiro integrado",
    desc: "MRR, churn, LTV e contratos tudo conectado para ter visão completa do faturamento.",
  },
  {
    icon: Brain,
    title: "Diagnósticos com IA",
    desc: "Receba alertas inteligentes sobre gargalos no funil e sugestões de otimização.",
  },
];

const PLANS = [
  {
    name: "Starter",
    desc: "Para operações que estão começando a estruturar dados comerciais.",
    price: "297",
    period: "/mês",
    highlight: false,
    features: [
      "1 dashboard (Overview)",
      "Até 3 usuários",
      "Integração com 1 CRM",
      "Dados atualizados a cada 30min",
      "Suporte por email",
    ],
  },
  {
    name: "Growth",
    desc: "Para times que precisam de visibilidade completa do funil B2B.",
    price: "697",
    period: "/mês",
    highlight: true,
    badge: "Mais popular",
    features: [
      "Todos os dashboards",
      "Até 15 usuários",
      "Integrações ilimitadas",
      "Dados em tempo real",
      "Diagnósticos com IA",
      "Metas e acompanhamento",
      "Modo TV para gestão visual",
      "Suporte prioritário",
    ],
  },
  {
    name: "Enterprise",
    desc: "Para operações complexas com necessidades avançadas de customização.",
    price: "Sob consulta",
    period: "",
    highlight: false,
    features: [
      "Tudo do Growth",
      "Usuários ilimitados",
      "SSO / SAML",
      "API dedicada",
      "SLA garantido de 99.9%",
      "Onboarding personalizado",
      "Gerente de conta dedicado",
      "Customizações sob demanda",
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Lucas Ferreira",
    role: "Head Comercial",
    company: "ScaleUp Tech",
    text: "Antes do Dashblue, levávamos 2 horas por dia para consolidar relatórios. Agora temos visão completa do funil em segundos.",
    stars: 5,
  },
  {
    name: "Marina Costa",
    role: "CEO",
    company: "DataDrive",
    text: "A funcionalidade de diagnósticos com IA nos ajudou a identificar gargalos que não víamos. Nosso ROAS subiu 40% em 3 meses.",
    stars: 5,
  },
  {
    name: "Rafael Mendes",
    role: "Gestor de Tráfego",
    company: "Bolt Digital",
    text: "Finalmente consigo ver CPL e CAC por canal sem precisar abrir 5 planilhas diferentes. O Modo TV é um diferencial incrível.",
    stars: 5,
  },
];

const METRICS = [
  { value: "2.500+", label: "Empresas ativas" },
  { value: "R$ 180M+", label: "Monitorados no funil" },
  { value: "340%", label: "Mais visibilidade" },
  { value: "< 2min", label: "Tempo de setup" },
];

/* ─────────────── PAGE ─────────────── */

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* ── HEADER ── */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <BarChart3 className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Dashblue</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Começar grátis
            </Link>
          </div>

          <button
            className="md:hidden rounded-lg p-2 hover:bg-slate-100"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t bg-white px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenu(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  {l.label}
                </a>
              ))}
              <hr className="my-1" />
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Entrar
              </Link>
              <Link href="/register" className="rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white">
                Começar grátis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 mb-6">
            <Zap className="h-3.5 w-3.5" />
            <span>Torre de controle para vendas B2B</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Toda a sua operação comercial em{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              um único painel
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 leading-relaxed sm:text-xl">
            Conecte seu CRM, ads e ferramentas de vendas. Visualize KPIs, 
            identifique gargalos e tome decisões baseadas em dados — tudo em tempo real.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-7 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ver funcionalidades
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Metrics bar */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label}>
                <p className="text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">{m.value}</p>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mx-auto mt-16 max-w-6xl px-5">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-900/20">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-slate-500">app.dashblue.com.br</span>
            </div>
            <div className="grid grid-cols-4 gap-3 p-5 sm:p-8">
              {[
                { label: "MRR", val: "R$ 287.400", color: "from-blue-500 to-blue-600" },
                { label: "Leads", val: "1.842", color: "from-indigo-500 to-indigo-600" },
                { label: "Taxa de conversão", val: "24,8%", color: "from-emerald-500 to-emerald-600" },
                { label: "ROAS", val: "4.2x", color: "from-amber-500 to-amber-600" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl bg-slate-900 p-4">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider sm:text-xs">{kpi.label}</p>
                  <p className={cn("mt-2 text-lg font-bold tabular-nums bg-gradient-to-r bg-clip-text text-transparent sm:text-2xl", kpi.color)}>
                    {kpi.val}
                  </p>
                </div>
              ))}
              <div className="col-span-4 h-32 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 sm:h-48" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="scroll-mt-20 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Funcionalidades</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo que você precisa para escalar vendas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              Do tráfego ao financeiro, o Dashblue unifica seus dados e entrega inteligência para cada etapa do funil.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-7 transition-shadow hover:shadow-lg hover:shadow-slate-100">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY DASHBLUE ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Por que Dashblue</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Pare de tomar decisões no escuro
              </h2>
              <p className="mt-4 text-slate-500 leading-relaxed">
                A maioria dos times comerciais perde horas consolidando planilhas e ainda toma decisões com dados desatualizados. 
                O Dashblue centraliza tudo e entrega visão em tempo real.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  { icon: TrendingUp, title: "Dados atualizados automaticamente", desc: "Integração direta com CRM, Ads e ferramentas de vendas." },
                  { icon: Target, title: "Metas rastreáveis", desc: "Defina metas por equipe e indivíduo e acompanhe o progresso em tempo real." },
                  { icon: Shield, title: "Seguro e confiável", desc: "Dados criptografados, RLS no banco e acesso baseado em permissões." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{item.title}</h4>
                      <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50" />
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <div className="space-y-4">
                  {[
                    { label: "Investimento em Ads", value: "R$ 45.200", pct: 78, color: "bg-blue-500" },
                    { label: "Leads gerados", value: "1.842", pct: 92, color: "bg-indigo-500" },
                    { label: "Reuniões realizadas", value: "312", pct: 65, color: "bg-violet-500" },
                    { label: "Contratos fechados", value: "89", pct: 45, color: "bg-emerald-500" },
                    { label: "Receita recorrente", value: "R$ 287.400", pct: 88, color: "bg-amber-500" },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{bar.label}</span>
                        <span className="font-semibold tabular-nums">{bar.value}</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full transition-all", bar.color)}
                          style={{ width: `${bar.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="scroll-mt-20 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Depoimentos</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Quem usa, recomenda
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-7">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Planos</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Escolha o plano ideal para seu time
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              Comece grátis por 14 dias, sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-8 transition-shadow",
                  plan.highlight
                    ? "border-blue-600 bg-white shadow-xl shadow-blue-600/10 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:shadow-lg hover:shadow-slate-100",
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                      {(plan as { badge?: string }).badge}
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{plan.desc}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  {plan.price !== "Sob consulta" && (
                    <span className="text-sm font-medium text-slate-400">R$</span>
                  )}
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-slate-400">{plan.period}</span>
                  )}
                </div>

                <Link
                  href="/register"
                  className={cn(
                    "mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors",
                    plan.highlight
                      ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {plan.price === "Sob consulta" ? "Falar com vendas" : "Começar agora"}
                </Link>

                <ul className="mt-7 space-y-3 border-t border-slate-100 pt-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <span className="text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Pronto para ter controle total da sua operação?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Junte-se a milhares de empresas que já transformaram sua gestão comercial com o Dashblue.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500"
            >
              Testar grátis por 14 dias
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-8 py-4 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold tracking-tight">Dashblue</span>
              </div>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                Torre de controle para operações de vendas B2B. Dados, inteligência e performance em um só lugar.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Produto</h4>
              <ul className="mt-4 space-y-2.5">
                {["Funcionalidades", "Integrações", "Planos", "Changelog"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-900">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Empresa</h4>
              <ul className="mt-4 space-y-2.5">
                {["Sobre nós", "Blog", "Carreiras", "Contato"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-900">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</h4>
              <ul className="mt-4 space-y-2.5">
                {["Termos de Uso", "Privacidade", "LGPD", "SLA"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-900">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Dashblue. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <LineChart className="h-4 w-4 text-slate-300" />
              <span className="text-xs text-slate-400">B2B Analytics Control Tower</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
