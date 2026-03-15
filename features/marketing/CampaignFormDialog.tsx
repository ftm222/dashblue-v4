"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateCampaign } from "@/lib/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function CampaignFormDialog({ open, onOpenChange }: Props) {
  const createMut = useCreateCampaign();

  const [form, setForm] = useState({
    name: "",
    source: "",
    medium: "",
    investment: "",
    impressions: "",
    clicks: "",
    leads: "",
    booked: "",
    received: "",
    won: "",
    revenue: "",
    period_start: today(),
    period_end: today(),
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    createMut.mutate(
      {
        name: form.name,
        source: form.source,
        medium: form.medium,
        investment: Number(form.investment) || 0,
        impressions: Number(form.impressions) || 0,
        clicks: Number(form.clicks) || 0,
        leads: Number(form.leads) || 0,
        booked: Number(form.booked) || 0,
        received: Number(form.received) || 0,
        won: Number(form.won) || 0,
        revenue: Number(form.revenue) || 0,
        period_start: form.period_start,
        period_end: form.period_end,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            name: "",
            source: "",
            medium: "",
            investment: "",
            impressions: "",
            clicks: "",
            leads: "",
            booked: "",
            received: "",
            won: "",
            revenue: "",
            period_start: today(),
            period_end: today(),
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Campanha</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Nome da campanha</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Meta - Leads Jan" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="facebook, google..." />
            </div>
            <div className="space-y-1.5">
              <Label>Medium</Label>
              <Input value={form.medium} onChange={(e) => set("medium", e.target.value)} placeholder="cpc, cpm..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Período início</Label>
              <Input type="date" value={form.period_start} onChange={(e) => set("period_start", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Período fim</Label>
              <Input type="date" value={form.period_end} onChange={(e) => set("period_end", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Investimento</Label>
              <Input type="number" value={form.investment} onChange={(e) => set("investment", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Impressões</Label>
              <Input type="number" value={form.impressions} onChange={(e) => set("impressions", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Cliques</Label>
              <Input type="number" value={form.clicks} onChange={(e) => set("clicks", e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Leads</Label>
              <Input type="number" value={form.leads} onChange={(e) => set("leads", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Agendados</Label>
              <Input type="number" value={form.booked} onChange={(e) => set("booked", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Recebidos</Label>
              <Input type="number" value={form.received} onChange={(e) => set("received", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Fechados</Label>
              <Input type="number" value={form.won} onChange={(e) => set("won", e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Receita (R$)</Label>
            <Input type="number" value={form.revenue} onChange={(e) => set("revenue", e.target.value)} placeholder="0" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.period_start || createMut.isPending}>
            {createMut.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Salvando...
              </>
            ) : (
              "Adicionar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
