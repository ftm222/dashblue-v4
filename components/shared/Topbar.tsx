"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, LogOut, Monitor, Settings, User } from "lucide-react";
import type { Alert } from "@/types";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataFreshnessIndicator } from "@/components/shared/DataFreshnessIndicator";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useTVMode } from "@/providers/TVModeProvider";

const PAGE_TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/marketing": "Marketing",
  "/sdrs": "SDRs",
  "/closers": "Closers",
  "/ai": "AI Diagnosis",
  "/evidence": "Evidências",
  "/profile": "Perfil",
  "/settings": "Configurações",
  "/admin/setup": "Setup",
  "/admin/integrations": "Integrações",
  "/admin/funnel-mapping": "Funil",
  "/admin/tags-aliases": "Tags & Aliases",
  "/admin/ticket": "Ticket",
  "/admin/collaborators": "Colaboradores",
  "/admin/goals": "Metas",
  "/admin/logs": "Logs",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(route)) return title;
  }
  return "Dashblue";
}

function formatPeriodLabel(period: { from: Date; to: Date; label?: string }): string {
  if (period.label && period.label !== "Personalizado") return period.label;
  const from = format(period.from, "dd MMM", { locale: ptBR });
  const to = format(period.to, "dd MMM", { locale: ptBR });
  return `${from} – ${to}`;
}

interface TopbarProps {
  alerts?: Alert[];
  onDismissAlert?: (id: string) => void;
}

export function Topbar({ alerts = [], onDismissAlert }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { period, setPreset, setCustomRange, presets, isCustom } = usePeriodFilter();
  const { toggle: toggleTV } = useTVMode();
  const [showCalendar, setShowCalendar] = useState(false);

  const dateRange: DateRange = {
    from: period.from,
    to: period.to,
  };

  function handlePresetClick(preset: string) {
    if (preset === "Personalizado") {
      setShowCalendar(true);
      setPreset("Personalizado");
    } else {
      setShowCalendar(false);
      setPreset(preset as Parameters<typeof setPreset>[0]);
    }
  }

  function handleDateSelect(range: DateRange | undefined) {
    if (range?.from && range?.to) {
      setCustomRange(range.from, range.to);
    } else if (range?.from) {
      setCustomRange(range.from, range.from);
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <h1 className="text-sm font-semibold">{getPageTitle(pathname)}</h1>

      <div className="ml-auto flex items-center gap-3">
        <DataFreshnessIndicator />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-xs">{formatPeriodLabel(period)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className={showCalendar || isCustom ? "w-auto p-0" : "w-48 p-1"}>
            {showCalendar || isCustom ? (
              <div className="flex flex-col">
                <div className="flex border-b">
                  <div className="flex flex-col p-2 border-r min-w-[140px]">
                    {presets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetClick(preset)}
                        className={`flex w-full items-center rounded-sm px-3 py-1.5 text-sm hover:bg-accent text-left ${
                          period.label === preset
                            ? "bg-accent font-medium"
                            : ""
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    defaultMonth={period.from}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    {format(period.from, "dd/MM/yyyy")} – {format(period.to, "dd/MM/yyyy")}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCalendar(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            ) : (
              presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent ${
                    period.label === preset ? "bg-accent font-medium" : ""
                  }`}
                >
                  {preset}
                </button>
              ))
            )}
          </PopoverContent>
        </Popover>

        <NotificationCenter alerts={alerts} onDismiss={onDismissAlert} />

        <Button variant="ghost" size="icon" onClick={toggleTV} title="Modo TV">
          <Monitor className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/login")}>
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
