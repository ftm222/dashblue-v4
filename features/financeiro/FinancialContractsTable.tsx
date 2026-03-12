"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinancialData } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, ArrowUpDown } from "lucide-react";
import type { FinancialContract } from "@/types";

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const STATUS_MAP: Record<FinancialContract["status"], { label: string; className: string }> = {
  signed_paid: {
    label: "Pago",
    className: "border-green-500/20 bg-green-500/10 text-green-400",
  },
  signed_unpaid: {
    label: "Assinado",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  },
  unsigned: {
    label: "Pendente",
    className: "border-red-500/20 bg-red-500/10 text-red-400",
  },
};

type SortKey = "clientName" | "value" | "status" | "createdAt";
type SortDir = "asc" | "desc";

export function FinancialContractsTable() {
  const { data, isLoading } = useFinancialData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FinancialContract["status"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.contracts;

    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          c.sdr.toLowerCase().includes(q) ||
          c.closer.toLowerCase().includes(q) ||
          c.squad.toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "clientName":
          cmp = a.clientName.localeCompare(b.clientName);
          break;
        case "value":
          cmp = a.value - b.value;
          break;
        case "status": {
          const order = { signed_paid: 0, signed_unpaid: 1, unsigned: 2 };
          cmp = order[a.status] - order[b.status];
          break;
        }
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [data, search, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (isLoading || !data) {
    return (
      <Card className="border-border/40">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    );
  }

  const statusCounts = {
    all: data.contracts.length,
    signed_paid: data.contracts.filter((c) => c.status === "signed_paid").length,
    signed_unpaid: data.contracts.filter((c) => c.status === "signed_unpaid").length,
    unsigned: data.contracts.filter((c) => c.status === "unsigned").length,
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-4.5 w-4.5 text-blue-400" />
            Contratos Detalhados
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {filtered.length} de {data.contracts.length} contratos
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Buscar por cliente, SDR, closer ou squad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 text-xs"
            />
          </div>

          <div className="flex gap-1.5">
            {(["all", "signed_paid", "signed_unpaid", "unsigned"] as const).map((s) => {
              const isActive = statusFilter === s;
              const label = s === "all" ? "Todos" : STATUS_MAP[s].label;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {label} ({statusCounts[s]})
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none text-[10px]"
                  onClick={() => toggleSort("clientName")}
                >
                  <span className="flex items-center gap-1">
                    Cliente <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                  </span>
                </TableHead>
                <TableHead className="text-[10px]">SDR</TableHead>
                <TableHead className="text-[10px]">Closer</TableHead>
                <TableHead className="text-[10px]">Squad</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right text-[10px]"
                  onClick={() => toggleSort("value")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Valor <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-center text-[10px]"
                  onClick={() => toggleSort("status")}
                >
                  <span className="flex items-center justify-center gap-1">
                    Status <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-center text-[10px]"
                  onClick={() => toggleSort("createdAt")}
                >
                  <span className="flex items-center justify-center gap-1">
                    Data <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const st = STATUS_MAP[c.status];
                  return (
                    <TableRow key={c.id} className="border-border/20 hover:bg-muted/10">
                      <TableCell className="text-xs font-medium">{c.clientName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.sdr}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.closer}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] border-border/30">
                          {c.squad}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-foreground">
                        {fmtCurrency(c.value)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[9px] ${st.className}`}>
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-[10px] text-muted-foreground">
                        {fmtDate(c.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
