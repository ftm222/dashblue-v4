# Dashblue v4 — B2B Analytics Control Tower

Dashboard SaaS para analytics de vendas B2B com integração a CRMs, gestão de funil, squads e financeiro.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 15, React 19, TypeScript |
| **UI** | shadcn/ui, Radix UI, Tailwind CSS |
| **Charts** | Recharts |
| **Database** | Supabase (PostgreSQL + Auth + RLS) |
| **State** | TanStack React Query + Context |
| **Billing** | Stripe |
| **Email** | Resend |
| **Monitoring** | Sentry |
| **Analytics** | PostHog |
| **Rate Limiting** | Upstash Redis |
| **Validation** | Zod |
| **Testes** | Vitest + Playwright |
| **CI/CD** | GitHub Actions |

## Arquitetura

```
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rotas públicas de autenticação
│   ├── (dashboard)/        # Rotas protegidas do dashboard
│   └── api/                # API Routes
│       ├── auth/           # Register, Invite
│       ├── billing/        # Checkout, Portal, Webhook (Stripe)
│       ├── health/         # Health check endpoint
│       └── integrations/   # CRM connect, callback, sync, webhook
├── components/
│   ├── ui/                 # Componentes base (shadcn)
│   └── shared/             # Componentes de negócio
├── features/               # Módulos por domínio (overview, sdrs, closers, etc.)
├── lib/                    # Utilitários e serviços
│   ├── crm/                # Adapters CRM (Kommo, HubSpot, Pipedrive)
│   ├── analytics.ts        # PostHog analytics
│   ├── email.ts            # Resend email service
│   ├── jobs.ts             # Background job runner
│   ├── rate-limit.ts       # Upstash rate limiting
│   ├── stripe.ts           # Stripe billing
│   └── validations.ts      # Zod schemas
├── providers/              # Context providers
├── supabase/
│   └── migrations/         # SQL migrations versionadas
├── tests/                  # Testes unitários e E2E
└── types/                  # TypeScript type definitions
```

## Setup Local

### Pré-requisitos

- Node.js 20+
- npm

### Instalação

```bash
git clone https://github.com/ftm222/dashblue-v4.git
cd dashblue-v4
npm install
cp .env.example .env.local
```

### Variáveis de Ambiente

Edite `.env.local` com as credenciais do Supabase (obrigatório) e os demais serviços conforme necessário. Veja `.env.example` para a lista completa.

### Banco de Dados

Execute as migrations no SQL Editor do Supabase na ordem:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_multi_tenancy_rbac_billing.sql`
3. `supabase/migrations/003_fix_modeling.sql`
4. `supabase/migrations/004_settings_columns.sql`

### Desenvolvimento

```bash
npm run dev
```

### Testes

```bash
npm run test          # Testes unitários
npm run test:watch    # Watch mode
npm run test:e2e      # Testes E2E (precisa do app rodando)
```

### Build

```bash
npm run build
npm start
```

## Multi-tenancy

Cada organização (tenant) possui seus próprios dados isolados via `organization_id` em todas as tabelas + RLS no Supabase.

## Billing

Integração com Stripe para planos Free, Starter, Pro e Enterprise. Webhooks processam eventos de assinatura automaticamente.

## Segurança

- Autenticação via Supabase Auth
- RBAC: Owner > Admin > Manager > Viewer
- RLS em todas as tabelas com isolamento por tenant
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Rate limiting em rotas sensíveis
- Validação de input com Zod
- HMAC verification em webhooks

## CI/CD

Pipeline automático no GitHub Actions:
1. **Lint** — ESLint
2. **Type Check** — TypeScript
3. **Test** — Vitest
4. **Build** — Next.js

## Monitoramento

- **Sentry** — Error tracking e performance
- **PostHog** — Analytics de uso e feature flags
- **Health Check** — `GET /api/health`
