"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export function useLocalStorage<T>(key: string, fallback: T) {
  const keyRef = useRef(key);
  keyRef.current = key;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return fallback;
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(keyRef.current);
      if (stored) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      /* quota exceeded — silent */
    }
  }, [value, hydrated]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue(next);
  }, []);

  return [value, set] as const;
}
