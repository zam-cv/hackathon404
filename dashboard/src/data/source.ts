// Single swap point between mock data and a real backend.
//
// To wire real data:
//   - Replace the body of each function with a fetch / Tauri `invoke` call.
//   - Keep the return type so the rest of the app doesn't change.

import type { Incident, Platform, StateRow } from "../types";
import {
  hourlyDataMock,
  incidentsMock,
  platformsMock,
  statesMock,
  weeklyTrendMock,
} from "./mock";

const FAKE_LATENCY_MS = 0;
const wait = <T,>(v: T): Promise<T> =>
  FAKE_LATENCY_MS > 0
    ? new Promise((res) => setTimeout(() => res(v), FAKE_LATENCY_MS))
    : Promise.resolve(v);

export async function getIncidents(): Promise<Incident[]> {
  return wait(incidentsMock);
}

export async function getStates(): Promise<StateRow[]> {
  return wait(statesMock);
}

export async function getPlatforms(): Promise<Platform[]> {
  return wait(platformsMock);
}

export async function getHourly(): Promise<number[]> {
  return wait(hourlyDataMock);
}

export async function getWeeklyTrend(): Promise<number[]> {
  return wait(weeklyTrendMock);
}

// Optional: stream of new incidents. Mock generates one every 6s; replace
// with a websocket/SSE/Tauri event subscription in production.
export function subscribeIncidents(onIncident: (i: Incident) => void): () => void {
  const platforms = ["api-gateway", "auth-service", "cache-layer", "search-svc"];
  const types = ["Latency Spike", "Slow Query", "Cache Miss"];
  const risks: Incident["risk"][] = ["CRÍTICO", "ALTO", "MEDIO"];
  // Pares (estado, municipio) ya emparejados para evitar combinaciones absurdas.
  const places: { estado: string; municipio: string }[] = [
    { estado: "Ciudad de México", municipio: "Cuauhtémoc" },
    { estado: "Jalisco",          municipio: "Guadalajara" },
    { estado: "Nuevo León",       municipio: "Monterrey" },
    { estado: "Puebla",           municipio: "Puebla" },
    { estado: "Yucatán",          municipio: "Mérida" },
    { estado: "Quintana Roo",     municipio: "Cancún" },
    { estado: "Sonora",           municipio: "Hermosillo" },
  ];

  const id = setInterval(() => {
    const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    const place = pick(places);
    onIncident({
      id: `EVT-${4800 + Math.floor(Math.random() * 100)}`,
      platform: pick(platforms),
      type: pick(types),
      risk: pick(risks),
      estado: place.estado,
      municipio: place.municipio,
      time: "ahora mismo",
    });
  }, 6000);

  return () => clearInterval(id);
}
