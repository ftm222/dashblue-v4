"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DataFreshnessState } from "@/types";

interface DataFreshnessContextValue extends DataFreshnessState {
  recordSync: () => void;
}

function computeStatus(
  lastSync: Date | null,
): Pick<DataFreshnessState, "status" | "secondsSinceSync"> {
  if (!lastSync) return { status: "unknown", secondsSinceSync: 0 };

  const seconds = Math.floor((Date.now() - lastSync.getTime()) / 1000);
  let status: DataFreshnessState["status"];

  if (seconds < 60) status = "fresh";
  else if (seconds <= 300) status = "warning";
  else status = "critical";

  return { status, secondsSinceSync: seconds };
}

const DataFreshnessContext = createContext<DataFreshnessContextValue | null>(
  null,
);

export function DataFreshnessProvider({ children }: { children: ReactNode }) {
  const lastSyncRef = useRef<Date | null>(null);
  const [state, setState] = useState<DataFreshnessState>({
    lastSync: null,
    status: "unknown",
    secondsSinceSync: 0,
  });

  const recalculate = useCallback(() => {
    const { status, secondsSinceSync } = computeStatus(lastSyncRef.current);
    setState((prev) => {
      if (prev.status === status && prev.secondsSinceSync === secondsSinceSync) {
        return prev;
      }
      return { lastSync: lastSyncRef.current, status, secondsSinceSync };
    });
  }, []);

  const recordSync = useCallback(() => {
    lastSyncRef.current = new Date();
    recalculate();
  }, [recalculate]);

  useEffect(() => {
    const id = setInterval(recalculate, 5_000);
    return () => clearInterval(id);
  }, [recalculate]);

  const value = useMemo<DataFreshnessContextValue>(
    () => ({ ...state, recordSync }),
    [state, recordSync],
  );

  return (
    <DataFreshnessContext.Provider value={value}>
      {children}
    </DataFreshnessContext.Provider>
  );
}

export function useDataFreshness(): DataFreshnessContextValue {
  const ctx = useContext(DataFreshnessContext);
  if (!ctx) {
    throw new Error(
      "useDataFreshness must be used within DataFreshnessProvider",
    );
  }
  return ctx;
}
