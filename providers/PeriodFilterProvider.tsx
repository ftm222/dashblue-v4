"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PeriodRange } from "@/types";

const STORAGE_KEY = "dashblue:period";

const PRESETS = [
  "Hoje",
  "Últimos 7 dias",
  "Mês atual",
  "Mês anterior",
  "Personalizado",
] as const;

type PresetLabel = (typeof PRESETS)[number];

interface PeriodFilterContextValue {
  period: PeriodRange;
  setPeriod: (range: PeriodRange) => void;
  setPreset: (label: PresetLabel) => void;
  setCustomRange: (from: Date, to: Date) => void;
  presets: readonly PresetLabel[];
  isCustom: boolean;
}

function resolvePreset(label: PresetLabel): PeriodRange {
  const now = new Date();

  switch (label) {
    case "Hoje":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        to: now,
        label,
      };
    case "Últimos 7 dias": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, to: now, label };
    }
    case "Mês atual":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
        label,
      };
    case "Mês anterior": {
      const firstPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastPrev = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );
      return { from: firstPrev, to: lastPrev, label };
    }
    case "Personalizado":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
        label,
      };
  }
}

function defaultPeriod(): PeriodRange {
  return resolvePreset("Mês atual");
}

function serialize(range: PeriodRange): string {
  return JSON.stringify({
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    label: range.label,
  });
}

function deserialize(raw: string): PeriodRange | null {
  try {
    const parsed = JSON.parse(raw);
    const from = new Date(parsed.from);
    const to = new Date(parsed.to);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
    return { from, to, label: parsed.label };
  } catch {
    return null;
  }
}

const PeriodFilterContext = createContext<PeriodFilterContextValue | null>(null);

export function PeriodFilterProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<PeriodRange>(defaultPeriod);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const restored = deserialize(stored);
      if (restored) setPeriodState(restored);
    }
  }, []);

  const setPeriod = useCallback((range: PeriodRange) => {
    setPeriodState(range);
    sessionStorage.setItem(STORAGE_KEY, serialize(range));
  }, []);

  const setPreset = useCallback(
    (label: PresetLabel) => {
      if (label === "Personalizado") {
        const now = new Date();
        setPeriod({
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now,
          label: "Personalizado",
        });
        return;
      }
      const range = resolvePreset(label);
      setPeriod(range);
    },
    [setPeriod],
  );

  const setCustomRange = useCallback(
    (from: Date, to: Date) => {
      setPeriod({ from, to, label: "Personalizado" });
    },
    [setPeriod],
  );

  const isCustom = period.label === "Personalizado";

  const value = useMemo<PeriodFilterContextValue>(
    () => ({ period, setPeriod, setPreset, setCustomRange, presets: PRESETS, isCustom }),
    [period, setPeriod, setPreset, setCustomRange, isCustom],
  );

  return (
    <PeriodFilterContext.Provider value={value}>
      {children}
    </PeriodFilterContext.Provider>
  );
}

export function usePeriodFilter(): PeriodFilterContextValue {
  const ctx = useContext(PeriodFilterContext);
  if (!ctx) {
    throw new Error("usePeriodFilter must be used within PeriodFilterProvider");
  }
  return ctx;
}
