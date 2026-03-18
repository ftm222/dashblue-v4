"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialData } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtShort(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(".", ",")}k`;
  return v.toLocaleString("pt-BR");
}

const STATUS_COLORS: Record<string, string> = {
  Pago: "#22c55e",
  Assinado: "#f59e0b",
  Pendente: "#ef4444",
};

const SQUAD_COLORS: Record<string, string> = {
  Alpha: "#f43f5e",
  Beta: "#3b82f6",
  Gamma: "#f97316",
};

function StatusDistributionChart({ data }: { data: { name: string; value: number; revenue: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Distribuição de Status</CardTitle>
        <p className="text-[11px] text-muted-foreground">Contratos por status de pagamento</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [`${value ?? 0} contratos`, String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[d.name] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{d.name}</span>
                    <span className="text-xs font-semibold text-foreground">{d.value}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground/60">
                      {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">{fmtCurrency(d.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueBySquadChart({ data }: { data: { squad: string; total: number; paid: number; gap: number }[] }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Receita por Squad</CardTitle>
        <p className="text-[11px] text-muted-foreground">Comparação de receita paga vs gap por squad</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${fmtShort(v)}`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="squad"
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [fmtCurrency(Number(value) || 0), String(name ?? "")]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px" }}
              />
              <Bar dataKey="paid" name="Receita Paga" fill="#22c55e" radius={[0, 4, 4, 0]} stackId="a" />
              <Bar dataKey="gap" name="Gap" fill="#ef4444" radius={[0, 4, 4, 0]} stackId="a" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastChart({ data }: { data: { scenario: string; value: number; color: string }[] }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Previsão de Recebimento</CardTitle>
        <p className="text-[11px] text-muted-foreground">Cenários de recebimento até fim do mês</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="scenario"
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${fmtShort(v)}`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [fmtCurrency(Number(value) || 0), "Receita Prevista"]}
              />
              <Bar dataKey="value" name="Receita Prevista" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.scenario} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {data.map((d) => (
            <div
              key={d.scenario}
              className="rounded-lg border border-border/30 bg-muted/10 p-2 text-center"
            >
              <p className="text-[10px] font-medium text-muted-foreground">{d.scenario}</p>
              <p className="text-sm font-bold" style={{ color: d.color }}>
                {fmtCurrency(d.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FinancialCharts() {
  const { data, isLoading } = useFinancialData();

  if (isLoading || !data) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Análise Gráfica</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-6"><Skeleton className="h-56 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const paidCount = data.contracts.filter((c) => c.status === "signed_paid").length;
  const signedCount = data.contracts.filter((c) => c.status === "signed_unpaid").length;
  const unsignedCount = data.contracts.filter((c) => c.status === "unsigned").length;

  const paidRev = data.paidRevenue;
  const signedRev = data.paymentGap;
  const unsignedRev = data.signatureGap;

  const statusData = [
    { name: "Pago", value: paidCount, revenue: paidRev },
    { name: "Assinado", value: signedCount, revenue: signedRev },
    { name: "Pendente", value: unsignedCount, revenue: unsignedRev },
  ];

  const squadMap = new Map<string, { total: number; paid: number }>();
  for (const c of data.contracts) {
    const sq = c.squad;
    if (!squadMap.has(sq)) squadMap.set(sq, { total: 0, paid: 0 });
    const entry = squadMap.get(sq)!;
    entry.total += c.value;
    if (c.status === "signed_paid") entry.paid += c.value;
  }
  const squadData = Array.from(squadMap.entries())
    .map(([squad, v]) => ({ squad, total: v.total, paid: v.paid, gap: v.total - v.paid }))
    .sort((a, b) => b.total - a.total);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const daysRemaining = daysInMonth - daysPassed;
  const dailyRate = daysPassed > 0 ? data.paidRevenue / daysPassed : 0;

  const forecastData = [
    { scenario: "Pessimista", value: data.paidRevenue + dailyRate * daysRemaining * 0.6, color: "#ef4444" },
    { scenario: "Realista", value: data.paidRevenue + dailyRate * daysRemaining * 1.0, color: "#f59e0b" },
    { scenario: "Otimista", value: data.paidRevenue + dailyRate * daysRemaining * 1.4, color: "#22c55e" },
  ];

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Análise Gráfica</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <StatusDistributionChart data={statusData} />
        <RevenueBySquadChart data={squadData} />
        <ForecastChart data={forecastData} />
      </div>
    </section>
  );
}
