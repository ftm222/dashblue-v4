"use client";

import { useState } from "react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CRM_FIELDS = [
  { value: "sale_value", label: "Valor da venda (sale_value)" },
  { value: "deal_value", label: "Valor do negócio (deal_value)" },
  { value: "custom_ticket", label: "Ticket personalizado (custom_ticket)" },
  { value: "contract_value", label: "Valor do contrato (contract_value)" },
];

export default function TicketPage() {
  const [field, setField] = useLocalStorage("dashblue:ticket-field", "sale_value");
  const [saved, setSaved] = useState(false);

  return (
    <AdminPageWrapper title="Campo de Ticket" description="Configure qual campo do CRM representa o valor de ticket">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-field">Campo do CRM para Ticket Médio</Label>
            <Select value={field} onValueChange={(v) => { setField(v); setSaved(false); }}>
              <SelectTrigger id="ticket-field" className="w-full max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRM_FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Este campo será usado para calcular o ticket médio nos relatórios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setSaved(true)}>
              Salvar
            </Button>
            {saved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Salvo com sucesso!
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
