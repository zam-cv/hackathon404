// Adapta eventos del servidor (FilterEvent) al shape visual del prototipo
// (Incident, buckets numéricos, Risk). Funciones puras: reciben eventos,
// regresan derivados. Los componentes ya saben pintar Incident/buckets, así
// que con esto el dashboard hace MERGE: el mock sigue poblando la vista
// para que el prototipo se vea, y los eventos reales se suman encima.
//
// NO modifica events.ts ni FilteredEventsPage — solo provee adapters.

import type { FilterAction, FilterEvent } from "../events";
import type { Incident, Risk } from "../types";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** 24 buckets · idx 0 = hace 23h · idx 23 = la última hora. */
export function bucketHourly(events: FilterEvent[], now: number = Date.now()): number[] {
  const buckets = new Array<number>(24).fill(0);
  for (const e of events) {
    const diff = now - e.timestamp_ms;
    if (diff < 0 || diff >= 24 * HOUR_MS) continue;
    const idx = 23 - Math.floor(diff / HOUR_MS);
    if (idx >= 0 && idx < 24) buckets[idx]++;
  }
  return buckets;
}

/** 7 buckets · idx 0 = hace 6 días · idx 6 = hoy. */
export function bucketDaily(events: FilterEvent[], now: number = Date.now()): number[] {
  const buckets = new Array<number>(7).fill(0);
  for (const e of events) {
    const diff = now - e.timestamp_ms;
    if (diff < 0 || diff >= 7 * DAY_MS) continue;
    const idx = 6 - Math.floor(diff / DAY_MS);
    if (idx >= 0 && idx < 7) buckets[idx]++;
  }
  return buckets;
}

/** Suma elemento-a-elemento. Útil para mergear hourly/weekly mock + real. */
export function addArrays(a: number[], b: number[]): number[] {
  const len = Math.max(a.length, b.length);
  const out = new Array<number>(len);
  for (let i = 0; i < len; i++) out[i] = (a[i] ?? 0) + (b[i] ?? 0);
  return out;
}

export function actionToRisk(action: FilterAction): Risk {
  switch (action) {
    case "block": return "CRÍTICO";
    case "warn":  return "ALTO";
    case "allow": return "BAJO";
  }
}

function hostOf(url: string): string {
  try { return new URL(url).host || url || "—"; }
  catch { return url || "—"; }
}

function relativeTime(timestamp_ms: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - timestamp_ms);
  if (diff < 60_000) return "ahora mismo";
  if (diff < 60 * 60_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 24 * 60 * 60_000) return `hace ${Math.floor(diff / (60 * 60_000))}h`;
  return `hace ${Math.floor(diff / (24 * 60 * 60_000))}d`;
}

function shortText(s: string, n: number = 40): string {
  if (!s) return "—";
  return s.length <= n ? s : s.slice(0, n) + "…";
}

/**
 * Proyecta un FilterEvent al shape Incident que esperan los componentes
 * visuales. FilterEvent NO tiene info geográfica, así que estado/municipio
 * quedan como placeholders ("—"). Cuando el server agregue geolocalización
 * a sus eventos, se llenan aquí.
 */
export function eventToIncident(e: FilterEvent): Incident {
  return {
    id: `EVT-${e.id.slice(0, 6)}`,
    platform: e.kind === "image" ? "image-svc" : "text-svc",
    type: e.categories[0] ?? shortText(e.original, 40),
    risk: actionToRisk(e.action),
    estado: "—",
    municipio: hostOf(e.url),
    time: relativeTime(e.timestamp_ms),
  };
}

export function eventsToIncidents(events: FilterEvent[]): Incident[] {
  return events.map(eventToIncident);
}

export interface ActionCounts {
  total: number;
  block: number;
  warn: number;
  allow: number;
}

export function countByAction(events: FilterEvent[]): ActionCounts {
  let block = 0, warn = 0, allow = 0;
  for (const e of events) {
    if (e.action === "block") block++;
    else if (e.action === "warn") warn++;
    else allow++;
  }
  return { total: events.length, block, warn, allow };
}
