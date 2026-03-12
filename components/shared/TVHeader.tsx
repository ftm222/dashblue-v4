"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Menu, MonitorOff } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { DataFreshnessIndicator } from "@/components/shared/DataFreshnessIndicator";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useTVMode } from "@/providers/TVModeProvider";

const TV_PAGES = [
  { label: "Overview", href: "/overview" },
  { label: "Marketing", href: "/marketing" },
  { label: "SDRs", href: "/sdrs" },
  { label: "Closers", href: "/closers" },
  { label: "AI Diagnosis", href: "/ai" },
  { label: "Evidências", href: "/evidence" },
] as const;

function formatPeriodLabel(period: { from: Date; to: Date; label?: string }): string {
  if (period.label && period.label !== "Personalizado") return period.label;
  const from = format(period.from, "dd MMM", { locale: ptBR });
  const to = format(period.to, "dd MMM", { locale: ptBR });
  return `${from} – ${to}`;
}

export function TVHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { period, setPreset, setCustomRange, presets, isCustom } = usePeriodFilter();
  const { disable: exitTV } = useTVMode();
  const [showCalendar, setShowCalendar] = useState(false);

  const currentPage = TV_PAGES.find((p) => pathname.startsWith(p.href));

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
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {TV_PAGES.map((page) => (
            <DropdownMenuItem
              key={page.href}
              onClick={() => router.push(page.href)}
            >
              {page.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="flex-1 text-center text-sm font-medium">
        {currentPage?.label ?? "Dashblue"}
      </span>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatPeriodLabel(period)}
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
                        period.label === preset ? "bg-accent font-medium" : ""
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

      <DataFreshnessIndicator />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={exitTV}
          >
            <MonitorOff className="h-3.5 w-3.5" />
            Sair do TV
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Sair do modo TV (Esc)</p>
        </TooltipContent>
      </Tooltip>
    </header>
  );
}
