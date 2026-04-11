import type { Person } from "@/types";

export interface SquadData {
  name: string;
  revenue: number;
  contracts: number;
  members: SquadMember[];
  callsRealized: number;
  callsQualified: number;
  leads: number;
  booked: number;
  received: number;
  showRate: number;
  conversionRate: number;
  qualificationRate: number;
  ticketMedio: number;
}

export interface SquadMember {
  id: string;
  name: string;
  role: "sdr" | "closer";
  revenue: number;
  contracts: number;
}

export const SQUAD_COLORS = [
  { border: "border-l-rose-500", bg: "bg-rose-500", text: "text-rose-500", hex: "#f43f5e" },
  { border: "border-l-blue-500", bg: "bg-blue-500", text: "text-blue-500", hex: "#3b82f6" },
  { border: "border-l-orange-500", bg: "bg-orange-500", text: "text-orange-500", hex: "#f97316" },
  { border: "border-l-violet-500", bg: "bg-violet-500", text: "text-violet-500", hex: "#8b5cf6" },
  { border: "border-l-emerald-500", bg: "bg-emerald-500", text: "text-emerald-500", hex: "#10b981" },
];

export function groupBySquad(sdrs: Person[], closers: Person[]): SquadData[] {
  const all = [...sdrs, ...closers];
  const map = new Map<string, SquadData>();

  for (const p of all) {
    const squad = p.squad ?? "Sem Squad";
    if (!map.has(squad)) {
      map.set(squad, {
        name: squad,
        revenue: 0,
        contracts: 0,
        members: [],
        callsRealized: 0,
        callsQualified: 0,
        leads: 0,
        booked: 0,
        received: 0,
        showRate: 0,
        conversionRate: 0,
        qualificationRate: 0,
        ticketMedio: 0,
      });
    }
    const s = map.get(squad)!;
    const rev = p.kpis.find((k) => k.key === "revenue")?.value ?? 0;
    const won = p.kpis.find((k) => k.key === "won")?.value ?? 0;
    const leads = p.kpis.find((k) => k.key === "leads")?.value ?? 0;
    const booked = p.kpis.find((k) => k.key === "booked")?.value ?? 0;
    const received = p.kpis.find((k) => k.key === "received")?.value ?? 0;

    s.revenue += rev;
    s.contracts += won;
    s.leads += leads;
    s.booked += booked;
    s.received += received;
    s.callsRealized += p.callMetrics?.answeredCalls ?? 0;
    s.callsQualified += Math.floor((p.callMetrics?.answeredCalls ?? 0) * 0.4);
    s.members.push({ id: p.id, name: p.name, role: p.role, revenue: rev, contracts: won });
  }

  for (const s of map.values()) {
    s.showRate = s.booked > 0 ? (s.received / s.booked) * 100 : 0;
    s.conversionRate = s.received > 0 ? (s.contracts / s.received) * 100 : 0;
    s.qualificationRate = s.callsRealized > 0 ? (s.callsQualified / s.callsRealized) * 100 : 0;
    s.ticketMedio = s.contracts > 0 ? s.revenue / s.contracts : 0;
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

/**
 * Inclui squads cadastrados na org que ainda não têm SDR/closer vinculado
 * (a agregação só a partir de `people` não os mostraria).
 */
export function mergeSquadsFromRegistry(
  fromPeople: SquadData[],
  registeredSquads: { id: string; name: string }[],
): SquadData[] {
  const byName = new Map<string, SquadData>();
  for (const s of fromPeople) {
    byName.set(s.name, s);
  }
  for (const reg of registeredSquads) {
    if (!byName.has(reg.name)) {
      byName.set(reg.name, {
        name: reg.name,
        revenue: 0,
        contracts: 0,
        members: [],
        callsRealized: 0,
        callsQualified: 0,
        leads: 0,
        booked: 0,
        received: 0,
        showRate: 0,
        conversionRate: 0,
        qualificationRate: 0,
        ticketMedio: 0,
      });
    }
  }
  return Array.from(byName.values()).sort((a, b) => b.revenue - a.revenue);
}

export function fmtCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtShortCurrency(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")}k`;
  }
  return value.toLocaleString("pt-BR");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
