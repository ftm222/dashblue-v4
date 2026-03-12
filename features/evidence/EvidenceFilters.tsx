"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface EvidenceFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

const FUNNEL_STEPS = [
  { value: "leads", label: "Leads" },
  { value: "booked", label: "Agendados" },
  { value: "received", label: "Recebidos" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Fechados" },
];

const UTM_SOURCES = ["meta", "google", "instagram", "tiktok"];
const UTM_MEDIUMS = ["cpc", "cpm", "social", "display", "email", "organic"];

export function EvidenceFilters({ filters, onChange }: EvidenceFiltersProps) {
  function set(key: string, value: string) {
    if (!value || value === "all") {
      const next = { ...filters };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...filters, [key]: value });
    }
  }

  function reset() {
    onChange({});
  }

  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filters.funnelStep ?? "all"} onValueChange={(v) => set("funnelStep", v)}>
        <SelectTrigger className="w-[150px] h-9 text-xs">
          <SelectValue placeholder="Etapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas etapas</SelectItem>
          {FUNNEL_STEPS.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="SDR"
        value={filters.sdr ?? ""}
        onChange={(e) => set("sdr", e.target.value)}
        className="w-[130px] h-9 text-xs"
      />

      <Input
        placeholder="Closer"
        value={filters.closer ?? ""}
        onChange={(e) => set("closer", e.target.value)}
        className="w-[130px] h-9 text-xs"
      />

      <Select value={filters.utmSource ?? "all"} onValueChange={(v) => set("utmSource", v)}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="UTM Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas fontes</SelectItem>
          {UTM_SOURCES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.utmMedium ?? "all"} onValueChange={(v) => set("utmMedium", v)}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="UTM Medium" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos meios</SelectItem>
          {UTM_MEDIUMS.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="UTM Campaign"
        value={filters.utmCampaign ?? ""}
        onChange={(e) => set("utmCampaign", e.target.value)}
        className="w-[150px] h-9 text-xs"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-9 px-2 text-xs">
          <X className="mr-1 h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}
