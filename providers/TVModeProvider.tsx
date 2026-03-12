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
import { useRouter } from "next/navigation";

const TV_PAGES = [
  "/overview",
  "/marketing",
  "/sdrs",
  "/closers",
  "/ai",
  "/evidence",
] as const;

interface TVModeContextValue {
  enabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

const TVModeContext = createContext<TVModeContextValue | null>(null);

export function TVModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const router = useRouter();

  const enable = useCallback(() => setEnabled(true), []);
  const disable = useCallback(() => setEnabled(false), []);
  const toggle = useCallback(() => setEnabled((prev) => !prev), []);

  useEffect(() => {
    if (enabled) {
      document.documentElement.classList.add("tv-mode");
    } else {
      document.documentElement.classList.remove("tv-mode");
    }
    return () => document.documentElement.classList.remove("tv-mode");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    function getCurrentPageIndex(): number {
      const path = window.location.pathname;
      const idx = TV_PAGES.indexOf(path as (typeof TV_PAGES)[number]);
      return idx === -1 ? 0 : idx;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEnabled(false);
        return;
      }

      if (e.key === "ArrowRight") {
        const next = (getCurrentPageIndex() + 1) % TV_PAGES.length;
        router.push(TV_PAGES[next]);
        return;
      }

      if (e.key === "ArrowLeft") {
        const prev =
          (getCurrentPageIndex() - 1 + TV_PAGES.length) % TV_PAGES.length;
        router.push(TV_PAGES[prev]);
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= TV_PAGES.length) {
        router.push(TV_PAGES[num - 1]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, router]);

  const value = useMemo<TVModeContextValue>(
    () => ({ enabled, toggle, enable, disable }),
    [enabled, toggle, enable, disable],
  );

  return (
    <TVModeContext.Provider value={value}>{children}</TVModeContext.Provider>
  );
}

export function useTVMode(): TVModeContextValue {
  const ctx = useContext(TVModeContext);
  if (!ctx) {
    throw new Error("useTVMode must be used within TVModeProvider");
  }
  return ctx;
}
