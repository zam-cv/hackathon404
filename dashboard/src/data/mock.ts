import type { Incident, Platform, StateRow } from "../types";
import { T } from "../theme";

export const hourlyDataMock = [
  12, 18, 9, 7, 5, 14, 38, 52, 44, 30, 22, 19, 25, 28, 31, 27, 22, 68, 74, 55,
  42, 34, 28, 16,
];

export const weeklyTrendMock = [120, 145, 132, 168, 155, 190, 174];
export const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

export const platformsMock: Platform[] = [
  { name: "api-gateway",  incidents: 18423, pct: 43, color: T.secondary },
  { name: "auth-service", incidents: 11204, pct: 26, color: T.primary },
  { name: "cache-layer",  incidents:  7891, pct: 18, color: "#7289DA" },
  { name: "search-svc",   incidents:  3201, pct:  7, color: T.amber },
  { name: "otros",        incidents:  2193, pct:  5, color: T.text2 },
];

export const incidentsMock: Incident[] = [
  { id: "EVT-4821", platform: "api-gateway",  type: "Latency Spike",   risk: "CRÍTICO", estado: "Ciudad de México", municipio: "Cuauhtémoc",  time: "hace 4 min" },
  { id: "EVT-4820", platform: "auth-service", type: "Cache Miss",      risk: "ALTO",    estado: "Yucatán",          municipio: "Mérida",      time: "hace 12 min" },
  { id: "EVT-4819", platform: "cache-layer",  type: "Rate Limit",      risk: "ALTO",    estado: "Jalisco",          municipio: "Guadalajara", time: "hace 18 min" },
  { id: "EVT-4818", platform: "search-svc",   type: "Slow Query",      risk: "MEDIO",   estado: "Nuevo León",       municipio: "Monterrey",   time: "hace 31 min" },
  { id: "EVT-4817", platform: "api-gateway",  type: "Latency Spike",   risk: "CRÍTICO", estado: "Puebla",           municipio: "Puebla",      time: "hace 45 min" },
  { id: "EVT-4816", platform: "auth-service", type: "Memory Pressure", risk: "BAJO",    estado: "Quintana Roo",     municipio: "Cancún",      time: "hace 1h" },
  { id: "EVT-4815", platform: "cache-layer",  type: "Cache Miss",      risk: "ALTO",    estado: "Sonora",           municipio: "Hermosillo",  time: "hace 1h 10m" },
];

export const statesMock: StateRow[] = [
  { estado: "Ciudad de México", incidentes: 312, riesgo: "CRÍTICO", ofensa: "Latency Spike" },
  { estado: "Jalisco",          incidentes: 198, riesgo: "ALTO",    ofensa: "Auth Failure" },
  { estado: "Nuevo León",       incidentes: 175, riesgo: "ALTO",    ofensa: "Rate Limit" },
  { estado: "Puebla",           incidentes: 143, riesgo: "ALTO",    ofensa: "Cache Miss" },
  { estado: "Yucatán",          incidentes:  98, riesgo: "MEDIO",   ofensa: "Slow Query" },
  { estado: "Quintana Roo",     incidentes:  87, riesgo: "MEDIO",   ofensa: "Connection Timeout" },
  { estado: "Sonora",           incidentes:  76, riesgo: "MEDIO",   ofensa: "Auth Failure" },
  { estado: "Veracruz",         incidentes:  65, riesgo: "MEDIO",   ofensa: "Latency Spike" },
  { estado: "Guanajuato",       incidentes:  54, riesgo: "BAJO",    ofensa: "Memory Pressure" },
  { estado: "Chihuahua",        incidentes:  42, riesgo: "BAJO",    ofensa: "Cache Miss" },
  { estado: "Sinaloa",          incidentes:  38, riesgo: "BAJO",    ofensa: "Auth Failure" },
  { estado: "Tamaulipas",       incidentes:  31, riesgo: "BAJO",    ofensa: "Rate Limit" },
  { estado: "Michoacán",        incidentes:  29, riesgo: "BAJO",    ofensa: "Auth Failure" },
  { estado: "Oaxaca",           incidentes:  24, riesgo: "BAJO",    ofensa: "Connection Timeout" },
  { estado: "Chiapas",          incidentes:  21, riesgo: "BAJO",    ofensa: "Slow Query" },
];
