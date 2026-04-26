import { useEffect, useState } from "react";
import type { Incident, Platform, StateRow } from "../types";
import {
  getHourly,
  getIncidents,
  getPlatforms,
  getStates,
  getWeeklyTrend,
  subscribeIncidents,
} from "./source";

export interface AsyncResource<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

function useAsync<T>(loader: () => Promise<T>): AsyncResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loader()
      .then((v) => {
        if (!cancelled) {
          setData(v);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { data, loading, error, refresh: () => setTick((t) => t + 1) };
}

export const useIncidents = () => useAsync<Incident[]>(getIncidents);
export const useStates = () => useAsync<StateRow[]>(getStates);
export const usePlatforms = () => useAsync<Platform[]>(getPlatforms);
export const useHourly = () => useAsync<number[]>(getHourly);
export const useWeeklyTrend = () => useAsync<number[]>(getWeeklyTrend);

// Live feed: seeded from an initial list, then prepends streamed incidents.
export function useLiveFeed(seed: Incident[], max = 6): Incident[] {
  const [feed, setFeed] = useState<Incident[]>(seed.slice(0, 4));

  useEffect(() => {
    setFeed(seed.slice(0, 4));
  }, [seed]);

  useEffect(() => {
    const unsubscribe = subscribeIncidents((inc) => {
      setFeed((f) => [inc, ...f].slice(0, max));
    });
    return unsubscribe;
  }, [max]);

  return feed;
}
