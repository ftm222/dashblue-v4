import type { IndividualGoalConfig } from "@/types";

export const SDR_GOAL_METRICS: IndividualGoalConfig[] = [
  { metric: "leads", label: "Leads", format: "number" },
  { metric: "booked", label: "Agendados", format: "number" },
];

export const CLOSER_GOAL_METRICS: IndividualGoalConfig[] = [
  { metric: "received", label: "Recebidos", format: "number" },
  { metric: "won", label: "Fechados", format: "number" },
  { metric: "revenue", label: "Receita", format: "currency" },
];
