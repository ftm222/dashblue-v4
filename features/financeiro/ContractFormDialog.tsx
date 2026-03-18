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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateContract, useAllPeople, useSquads } from "@/lib/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractFormDialog({ open, onOpenChange }: Props) {
  const createMut = useCreateContract();
  const { data: people } = useAllPeople();
  const { data: squads } = useSquads();

  const [form, setForm] = useState({
    client_name: "",
    value: "",
    status: "unsigned" as "signed_paid" | "signed_unpaid" | "unsigned",
    sdr_id: "",
    closer_id: "",
    squad_id: "",
    signed_at: "",
    paid_at: "",
  });

  const sdrs = (people ?? []).filter((p) => p.role === "sdr" && (p as { active?: boolean }).active !== false);
  const closers = (people ?? []).filter((p) => p.role === "closer" && (p as { active?: boolean }).active !== false);

  function handleSubmit() {
    createMut.mutate(
      {
        client_name: form.client_name,
        value: Number(form.value) || 0,
        status: form.status,
        sdr_id: form.sdr_id || null,
        closer_id: form.closer_id || null,
        squad_id: form.squad_id || null,
        signed_at: form.signed_at || null,
        paid_at: form.paid_at || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            client_name: "",
            value: "",
            status: "unsigned",
            sdr_id: "",
            closer_id: "",
            squad_id: "",
            signed_at: "",
            paid_at: "",
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Contrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              placeholder="Nome do cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as typeof form.status })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unsigned">Pendente</SelectItem>
                  <SelectItem value="signed_unpaid">Assinado</SelectItem>
                  <SelectItem value="signed_paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>SDR</Label>
              <Select value={form.sdr_id} onValueChange={(v) => setForm({ ...form, sdr_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {sdrs.map((p: { id: string; name: string }) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Closer</Label>
              <Select value={form.closer_id} onValueChange={(v) => setForm({ ...form, closer_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {closers.map((p: { id: string; name: string }) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Squad</Label>
            <Select value={form.squad_id} onValueChange={(v) => setForm({ ...form, squad_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {squads?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data assinatura</Label>
              <Input
                type="date"
                value={form.signed_at}
                onChange={(e) => setForm({ ...form, signed_at: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data pagamento</Label>
              <Input
                type="date"
                value={form.paid_at}
                onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!form.client_name || createMut.isPending}>
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
