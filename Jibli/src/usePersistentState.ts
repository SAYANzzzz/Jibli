import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) || "null");
      if (initial && typeof initial === "object" && !Array.isArray(initial)) {
        if (!stored || typeof stored !== "object" || Array.isArray(stored)) return initial;
        // Older drafts may omit new fields; malformed values must not reach forms.
        return Object.fromEntries(Object.entries(initial).map(([field, fallback]) => {
          const candidate = (stored as Record<string, unknown>)[field];
          return [field, candidate !== null && typeof candidate === typeof fallback ? candidate : fallback];
        })) as T;
      }
      return stored !== null && typeof stored === typeof initial && Array.isArray(stored) === Array.isArray(initial) ? stored as T : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Continue without storage. */ }
  }, [key, value]);
  return [value, setValue] as const;
}
