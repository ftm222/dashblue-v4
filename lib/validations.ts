import { z } from "zod";

export const emailSchema = z.string().email("Email inválido").min(1, "Email é obrigatório");
export const passwordSchema = z.string().min(8, "Senha deve ter no mínimo 8 caracteres");

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

export const inviteSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  email: emailSchema,
  role: z.enum(["owner", "admin", "manager", "viewer"]).default("viewer"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
  phone: z.string().max(20).nullable().optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  alias: z.string().min(1, "Alias é obrigatório").max(100),
});

export const goalSchema = z.object({
  personId: z.string().uuid().nullable().optional(),
  type: z.enum(["revenue", "booked", "leads", "received", "won"]),
  target: z.number().positive("Meta deve ser maior que zero"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: YYYY-MM-DD"),
});

export const funnelMappingSchema = z.object({
  id: z.string().uuid(),
  stepKey: z.string().min(1),
  stepLabel: z.string().min(1),
  crmField: z.string(),
  crmValue: z.string(),
});

export const funnelMappingsArraySchema = z.array(funnelMappingSchema).min(1);

export const integrationConnectSchema = z.object({
  provider: z.enum(["kommo", "hubspot", "pipedrive"]),
  integrationId: z.string().uuid(),
});

export const webhookQuerySchema = z.object({
  id: z.string().uuid("ID de integração inválido"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const evidenceFilterSchema = z.object({
  funnelStep: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
});

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data, error: null };
  }
  const message = result.error.issues.map((i) => i.message).join(", ");
  return { data: null, error: message };
}
