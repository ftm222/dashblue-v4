"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFinancialData } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneCall, Handshake, Trophy } from "lucide-react";

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

interface CollaboratorData {
  name: string;
  paidRevenue: number;
  totalRevenue: number;
  contracts: number;
  paidContracts: number;
  receiptRate: number;
}

function aggregateByField(
  contracts: { sdr: string; closer: string; value: number; status: string }[],
  field: "sdr" | "closer"
): CollaboratorData[] {
  const map = new Map<string, CollaboratorData>();
  for (const c of contracts) {
    const name = c[field];
    if (!map.has(name)) {
      map.set(name, { name, paidRevenue: 0, totalRevenue: 0, contracts: 0, paidContracts: 0, receiptRate: 0 });
    }
    const entry = map.get(name)!;
    entry.totalRevenue += c.value;
    entry.contracts += 1;
    if (c.status === "signed_paid") {
      entry.paidRevenue += c.value;
      entry.paidContracts += 1;
    }
  }
  for (const e of map.values()) {
    e.receiptRate = e.totalRevenue > 0 ? (e.paidRevenue / e.totalRevenue) * 100 : 0;
  }
  return Array.from(map.values()).sort((a, b) => b.paidRevenue - a.paidRevenue);
}

const MEDALS = ["🥇", "🥈", "🥉"];

function CollaboratorList({
  title,
  icon: Icon,
  iconColor,
  data,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  data: CollaboratorData[];
}) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((person, idx) => (
          <div
            key={person.name}
            className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2.5 transition-colors hover:bg-muted/20"
          >
            <span className="w-6 text-center text-sm">
              {idx < 3 ? MEDALS[idx] : <span className="text-xs text-muted-foreground">{idx + 1}</span>}
            </span>

            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted/40 text-[10px] font-semibold text-muted-foreground">
                {initials(person.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
              <p className="text-[10px] text-muted-foreground/60">
                {person.paidContracts}/{person.contracts} contratos pagos
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-green-400">{fmtCurrency(person.paidRevenue)}</p>
              <Badge
                variant="outline"
                className={`text-[9px] ${
                  person.receiptRate >= 70
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : person.receiptRate >= 50
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {person.receiptRate.toFixed(0)}% recebido
              </Badge>
            </div>

            {idx === 0 && (
              <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FinancialCollaborators() {
  const { data, isLoading } = useFinancialData();

  if (isLoading || !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-border/40">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-14 rounded-lg" />)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const sdrs = aggregateByField(data.contracts, "sdr");
  const closers = aggregateByField(data.contracts, "closer");

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Análise por Colaborador</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <CollaboratorList
          title="Top SDRs por Receita Paga"
          icon={PhoneCall}
          iconColor="text-blue-400"
          data={sdrs}
        />
        <CollaboratorList
          title="Top Closers por Receita Paga"
          icon={Handshake}
          iconColor="text-emerald-400"
          data={closers}
        />
      </div>
    </section>
  );
}
