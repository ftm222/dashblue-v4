"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface DrillDownState {
  isOpen: boolean;
  type: "evidence" | "calc" | null;
  filters: Record<string, string>;
  title: string;
}

interface DrillDownContextValue extends DrillDownState {
  openEvidence: (title: string, filters: Record<string, string>) => void;
  openCalc: (title: string, kpiKey: string) => void;
  navigateToEvidence: (filters: Record<string, string>) => void;
  close: () => void;
  openCRM: (url: string) => void;
  copyContact: (text: string) => Promise<void>;
  exportCSV: () => void;
}

const INITIAL_STATE: DrillDownState = {
  isOpen: false,
  type: null,
  filters: {},
  title: "",
};

const DrillDownContext = createContext<DrillDownContextValue | null>(null);

export function DrillDownProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrillDownState>(INITIAL_STATE);
  const router = useRouter();

  const openEvidence = useCallback(
    (title: string, filters: Record<string, string>) => {
      setState({ isOpen: true, type: "evidence", filters, title });
    },
    [],
  );

  const openCalc = useCallback((title: string, kpiKey: string) => {
    setState({
      isOpen: true,
      type: "calc",
      filters: { kpiKey },
      title,
    });
  }, []);

  const navigateToEvidence = useCallback(
    (filters: Record<string, string>) => {
      const params = new URLSearchParams(filters);
      router.push(`/evidence?${params.toString()}`);
    },
    [router],
  );

  const close = useCallback(() => setState(INITIAL_STATE), []);

  const openCRM = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const copyContact = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
  }, []);

  const exportCSV = useCallback(() => {
    // No-op at provider level — export is handled locally with data access
  }, []);

  const value = useMemo<DrillDownContextValue>(
    () => ({
      ...state,
      openEvidence,
      openCalc,
      navigateToEvidence,
      close,
      openCRM,
      copyContact,
      exportCSV,
    }),
    [
      state,
      openEvidence,
      openCalc,
      navigateToEvidence,
      close,
      openCRM,
      copyContact,
      exportCSV,
    ],
  );

  return (
    <DrillDownContext.Provider value={value}>
      {children}
    </DrillDownContext.Provider>
  );
}

export function useDrillDown(): DrillDownContextValue {
  const ctx = useContext(DrillDownContext);
  if (!ctx) {
    throw new Error("useDrillDown must be used within DrillDownProvider");
  }
  return ctx;
}
