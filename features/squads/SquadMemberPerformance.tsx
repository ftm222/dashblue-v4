"use client";

import { cn } from "@/lib/utils";
import {
  type SquadData,
  SQUAD_COLORS,
  fmtCurrency,
  initials,
} from "@/lib/squad-utils";

const MEDAL = ["🥇", "🥈", "🥉"];

function SquadTable({
  squad,
  colorIdx,
}: {
  squad: SquadData;
  colorIdx: number;
}) {
  const color = SQUAD_COLORS[colorIdx % SQUAD_COLORS.length];
  const sorted = [...squad.members].sort((a, b) => b.revenue - a.revenue);
  const avgRevenue = squad.members.length > 0
    ? squad.revenue / squad.members.length
    : 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border-l-4 bg-card shadow-sm",
        color.border,
      )}
    >
      <div className="flex flex-col items-center gap-3 bg-sidebar/5 px-5 py-5 dark:bg-sidebar/20">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white shadow-md",
            color.bg,
          )}
        >
          {initials(squad.name)}
        </div>
        <h3 className="text-sm font-extrabold tracking-wider text-foreground">
          {squad.name}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left">
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Posição
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Membro
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Função
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Receita
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((member, i) => (
              <tr
                key={member.id}
                className={cn(
                  "border-b last:border-0 transition-colors hover:bg-muted/20",
                  i === 0 && "bg-amber-50/50 dark:bg-amber-500/5",
                )}
              >
                <td className="px-4 py-3 text-center">
                  {i < 3 ? (
                    <span className="text-base">{MEDAL[i]}</span>
                  ) : (
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {i + 1}º
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {member.name}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      member.role === "sdr"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
                    )}
                  >
                    {member.role === "sdr" ? "SDR" : "Closer"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                  {fmtCurrency(member.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-around border-t bg-muted/20 px-5 py-4">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Total do Squad
          </p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">
            {fmtCurrency(squad.revenue)}
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Média por Membro
          </p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">
            {fmtCurrency(avgRevenue)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SquadMemberPerformance({ squads }: { squads: SquadData[] }) {
  if (squads.length === 0) return null;

  return (
    <div className="space-y-5">
      <h2 className="text-center text-lg font-bold tracking-tight text-foreground">
        Desempenho Individual dos Guerreiros
      </h2>

      <div className="grid gap-6 lg:grid-cols-1">
        {squads.map((squad, i) => (
          <SquadTable key={squad.name} squad={squad} colorIdx={i} />
        ))}
      </div>
    </div>
  );
}
