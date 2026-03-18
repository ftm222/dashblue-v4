/**
 * Catálogo de integrações disponíveis para conectar ao sistema.
 * Cada integração define módulos (o que o usuário pode trazer para o sistema).
 */

export type IntegrationCategory = "crm" | "pagamento" | "ads";

export interface IntegrationModule {
  key: string;
  label: string;
  description: string;
  enabledByDefault?: boolean;
}

export interface CatalogIntegration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  logo: string; // Letra ou emoji para fallback
  logoUrl?: string; // URL da imagem (ex: Clearbit logo API)
  color: string; // Classe Tailwind bg-*
  provider: string;
  modules: IntegrationModule[];
}

export const INTEGRATION_CATALOG: CatalogIntegration[] = [
  // CRMs
  {
    id: "kommo",
    name: "Kommo CRM",
    description: "Gerencie leads, contatos e pipelines. Webhooks para automações em tempo real.",
    category: "crm",
    logo: "K",
    logoUrl: "/integrations/kommo.svg",
    color: "bg-blue-600",
    provider: "kommo",
    modules: [
      { key: "leads", label: "Leads", description: "Sincronizar leads e oportunidades", enabledByDefault: true },
      { key: "contatos", label: "Contatos", description: "Importar contatos e empresas", enabledByDefault: true },
      { key: "pipelines", label: "Pipelines", description: "Mapear estágios do funil", enabledByDefault: true },
      { key: "webhooks", label: "Webhooks", description: "Receber eventos em tempo real (leads, deals)", enabledByDefault: false },
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM completo para inbound marketing, vendas e atendimento.",
    category: "crm",
    logo: "H",
    logoUrl: "/integrations/hubspot.svg",
    color: "bg-orange-500",
    provider: "hubspot",
    modules: [
      { key: "deals", label: "Deals", description: "Sincronizar negócios e estágios", enabledByDefault: true },
      { key: "contacts", label: "Contatos", description: "Importar contatos e empresas", enabledByDefault: true },
      { key: "companies", label: "Empresas", description: "Dados das empresas vinculadas", enabledByDefault: false },
    ],
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    description: "Pipeline visual de vendas. Foco em deals e atividades.",
    category: "crm",
    logo: "P",
    logoUrl: "/integrations/pipedrive.svg",
    color: "bg-green-600",
    provider: "pipedrive",
    modules: [
      { key: "deals", label: "Deals", description: "Sincronizar negócios e estágios", enabledByDefault: true },
      { key: "persons", label: "Pessoas", description: "Importar contatos", enabledByDefault: true },
      { key: "activities", label: "Atividades", description: "Tarefas e follow-ups", enabledByDefault: false },
    ],
  },
  {
    id: "rdstation",
    name: "RD Station",
    description: "Marketing e CRM brasileiro. Leads, automações e funil de vendas.",
    category: "crm",
    logo: "R",
    logoUrl: "/integrations/rdstation.svg",
    color: "bg-cyan-600",
    provider: "rdstation",
    modules: [
      { key: "leads", label: "Leads", description: "Sincronizar leads qualificados", enabledByDefault: true },
      { key: "contatos", label: "Contatos", description: "Importar base de contatos", enabledByDefault: true },
    ],
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    description: "Suite completa de CRM com módulos de vendas e marketing.",
    category: "crm",
    logo: "Z",
    logoUrl: "/integrations/zoho.svg",
    color: "bg-red-500",
    provider: "zoho",
    modules: [
      { key: "leads", label: "Leads", description: "Sincronizar leads", enabledByDefault: true },
      { key: "contacts", label: "Contatos", description: "Importar contatos", enabledByDefault: true },
      { key: "deals", label: "Deals", description: "Negócios e pipeline", enabledByDefault: true },
    ],
  },
  {
    id: "bitrix24",
    name: "Bitrix24",
    description: "CRM, tarefas e colaboração em uma única plataforma.",
    category: "crm",
    logo: "B",
    logoUrl: "/integrations/bitrix24.svg",
    color: "bg-amber-500",
    provider: "bitrix24",
    modules: [
      { key: "leads", label: "Leads", description: "Sincronizar leads", enabledByDefault: true },
      { key: "contacts", label: "Contatos", description: "Importar contatos", enabledByDefault: true },
      { key: "deals", label: "Negócios", description: "Pipeline de vendas", enabledByDefault: true },
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Líder em CRM enterprise. Leads, oportunidades e relatórios.",
    category: "crm",
    logo: "S",
    logoUrl: "/integrations/salesforce.svg",
    color: "bg-sky-500",
    provider: "salesforce",
    modules: [
      { key: "leads", label: "Leads", description: "Sincronizar leads", enabledByDefault: true },
      { key: "contacts", label: "Contatos", description: "Importar contatos", enabledByDefault: true },
      { key: "opportunities", label: "Oportunidades", description: "Pipeline de vendas", enabledByDefault: true },
    ],
  },
  {
    id: "asaas",
    name: "Asaas",
    description: "Cobrança e gestão financeira. Integre clientes e pagamentos.",
    category: "crm",
    logo: "A",
    logoUrl: "/integrations/asaas.svg",
    color: "bg-emerald-600",
    provider: "asaas",
    modules: [
      { key: "customers", label: "Clientes", description: "Sincronizar cadastro de clientes", enabledByDefault: true },
      { key: "charges", label: "Cobranças", description: "Status de cobranças e pagamentos", enabledByDefault: true },
    ],
  },
  // Pagamento
  {
    id: "stripe",
    name: "Stripe",
    description: "Cobrança, assinaturas e pagamentos recorrentes.",
    category: "pagamento",
    logo: "💳",
    logoUrl: "/integrations/stripe.svg",
    color: "bg-indigo-600",
    provider: "stripe",
    modules: [
      { key: "charges", label: "Cobrança", description: "Pagamentos únicos e recorrentes", enabledByDefault: true },
      { key: "subscriptions", label: "Assinaturas", description: "Planos e renovações automáticas", enabledByDefault: true },
      { key: "webhooks", label: "Webhooks", description: "Eventos de pagamento em tempo real", enabledByDefault: true },
    ],
  },
  // Ads
  {
    id: "meta-ads",
    name: "Meta Ads",
    description: "Anúncios no Facebook e Instagram. Leads, conversões e remarketing.",
    category: "ads",
    logo: "M",
    logoUrl: "/integrations/meta-ads.svg",
    color: "bg-slate-600",
    provider: "meta",
    modules: [
      { key: "leads", label: "Leads", description: "Leads de formulários e anúncios", enabledByDefault: true },
      { key: "campaigns", label: "Campanhas", description: "Dados de campanhas e desempenho", enabledByDefault: true },
      { key: "conversions", label: "Conversões", description: "Meta Conversions API para otimização", enabledByDefault: false },
    ],
  },
];

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  crm: "CRMs de Vendas",
  pagamento: "Gateway de Pagamento",
  ads: "Anúncios e Mídia",
};

export function getCatalogByProvider(provider: string): CatalogIntegration | undefined {
  return INTEGRATION_CATALOG.find((c) => c.provider === provider || c.name.toLowerCase().includes(provider.toLowerCase()));
}

export function getCatalogById(id: string): CatalogIntegration | undefined {
  return INTEGRATION_CATALOG.find((c) => c.id === id);
}
