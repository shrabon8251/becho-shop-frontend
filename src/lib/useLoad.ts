import { useCallback, useEffect, useState } from "react";
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => { setError(""); fn().then(setData).catch((e: Error) => setError(e.message)); }, deps);
  useEffect(reload, [reload]);
  return { data, error, reload };
}
