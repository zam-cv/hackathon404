// OverviewPage — vista principal del prototipo.
//
// Estrategia: el mock data sigue alimentando la vista (para que el prototipo
// SIEMPRE se vea poblado, aunque no haya eventos reales). Encima de eso, los
// eventos reales que llegan del servidor se SUMAN a los buckets, se prependen
// al feed, a la tabla de incidentes recientes y a los KPIs. Si hay 0 eventos
// reales, la vista se ve idéntica al mock.

import { useMemo } from "react";
import { T } from "../theme";
import { weekDays } from "../data/mock";
import {
  useHourly,
  useIncidents,
  usePlatforms,
  useStates,
  useWeeklyTrend,
} from "../data/hooks";
import {
  addArrays,
  bucketDaily,
  bucketHourly,
  countByAction,
  eventsToIncidents,
} from "../data/realtime";
import type { FilterEvent } from "../events";
import { BarChart24h } from "../components/BarChart24h";
import { DonutChart } from "../components/DonutChart";
import { IncidentsTable } from "../components/IncidentsTable";
import { KpiCard } from "../components/KpiCard";
import { LiveFeed } from "../components/LiveFeed";
import { StatesRawTable } from "../components/StatesRawTable";
import { StatesTable } from "../components/StatesTable";
import { WeekChart } from "../components/WeekChart";

interface Props {
  /** Eventos reales del servidor (vía useFilterEvents en App). */
  events?: FilterEvent[];
}

export function OverviewPage({ events = [] }: Props) {
  const incidents = useIncidents();
  const states = useStates();
  const platforms = usePlatforms();
  const hourly = useHourly();
  const weekly = useWeeklyTrend();

  // Derivados de los eventos reales (recalcular cuando llega un evento nuevo).
  const real = useMemo(() => {
    const counts = countByAction(events);
    const realHourly = bucketHourly(events);
    const realWeekly = bucketDaily(events);
    // Más nuevos primero (events del hook viene en orden ascendente).
    const realIncidents = eventsToIncidents([...events].reverse());
    return { counts, realHourly, realWeekly, realIncidents };
  }, [events]);

  const hasReal = events.length > 0;

  // Merge mock + real para los gráficos numéricos.
  const mergedHourly = hourly.data ? addArrays(hourly.data, real.realHourly) : real.realHourly;
  const mergedWeekly = weekly.data ? addArrays(weekly.data, real.realWeekly) : real.realWeekly;

  // Para tablas e feed: real-converted-to-Incident primero, mock después.
  // El usuario percibe los reales en la cima, los mock como contexto.
  const mergedIncidents = [
    ...real.realIncidents,
    ...(incidents.data ?? []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* KPI Row — el valor grande sigue siendo mock; la línea inferior
          refleja los eventos reales del servidor cuando los hay. */}
      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
        <KpiCard
          label="Endpoints Activos"
          value="1,248,302"
          sub={hasReal ? `↑ ${real.counts.total} eventos en vivo` : "↑ +4.2% este mes"}
          subColor={T.green}
          icon="users"
          accent={T.primary}
          spark={mergedWeekly.length > 0 ? mergedWeekly : (weekly.data ?? [])}
        />
        <KpiCard
          label="Requests Bloqueadas"
          value={hasReal
            ? (42_912 + real.counts.block).toLocaleString("es-MX")
            : "42,912"}
          sub={hasReal ? `+${real.counts.block} bloqueos en vivo` : "⚠ Spike en api-gateway"}
          subColor={T.secondary}
          icon="block"
          accent={T.secondary}
          spark={[40, 55, 48, 62, 58, 70, 65]}
        />
        <KpiCard
          label="Alertas Activas"
          value={hasReal
            ? (284 + real.counts.warn + real.counts.block).toLocaleString("es-MX")
            : "284"}
          sub={hasReal
            ? `+${real.counts.warn + real.counts.block} alertas en vivo`
            : "↑ 18 en la última hora"}
          subColor={T.amber}
          icon="alert"
          accent={T.amber}
          spark={[20, 30, 25, 40, 35, 45, 42]}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
        <Card
          flex={2}
          title="Picos de Latencia"
          sub={hasReal
            ? `Últimas 24h · mock + ${real.counts.total} eventos en vivo`
            : "Últimas 24 horas · hora local UTC"}
          rightAccent="TENDENCIA"
        >
          <BarChart24h data={mergedHourly} />
        </Card>

        <Card flex={1} title="Servicios" sub="Distribución por servicio">
          {platforms.data && <DonutChart segments={platforms.data} />}
        </Card>
      </div>

      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
        <Card flex={1} title="Tendencia Semanal" sub="Alertas últimos 7 días">
          <WeekChart data={mergedWeekly} labels={weekDays} />
          <WeeklyStats data={mergedWeekly} />
        </Card>

        <Card
          flex={1}
          title="Feed en Vivo"
          sub={hasReal
            ? `${real.counts.total} eventos del servidor + simulación`
            : "Eventos entrantes (simulados — esperando servidor)"}
          rightAccent="LIVE"
        >
          {/* Pasamos los reales al inicio del seed; LiveFeed los muestra y
              su streamer interno (subscribeIncidents) sigue añadiendo mock
              para mantener el prototipo lleno. */}
          <LiveFeed
            seed={
              mergedIncidents.length > 0
                ? mergedIncidents
                : (incidents.data ?? [])
            }
          />
        </Card>
      </div>

      {/* Las dos tablas geográficas y la tabla raw son del prototipo: viven
          en mock. No hay equivalente geográfico en FilterEvent. */}
      {states.data && <StatesRawTable rows={states.data} />}
      {states.data && <StatesTable rows={states.data} />}

      {/* Incidentes Recientes: real primero, mock después. */}
      <IncidentsTable incidents={mergedIncidents} />
    </div>
  );
}

function Card({
  flex,
  title,
  sub,
  rightAccent,
  children,
}: {
  flex: number;
  title: string;
  sub: string;
  rightAccent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex,
        background: T.bg2,
        border: `1px solid ${T.border}`,
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: T.text0 }}>
            {title}
          </div>
          <div style={{ fontSize: "11px", color: T.text2, marginTop: "2px" }}>
            {sub}
          </div>
        </div>
        {rightAccent && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: T.primary,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: T.primary,
                display: "inline-block",
              }}
            />
            {rightAccent}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function WeeklyStats({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const peak = Math.max(...data);
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  const last = data[data.length - 1];
  const prev = data[data.length - 2] ?? last;
  const delta = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
  const arrow = delta >= 0 ? "↑" : "↓";

  return (
    <div style={{ marginTop: "10px", display: "flex", gap: "12px" }}>
      <Stat label="PICO" value={String(peak)} color={peak === last ? T.secondary : T.text0} />
      <Stat label="PROMEDIO" value={String(avg)} color={T.text0} />
      <Stat label="DELTA" value={`${arrow}${Math.abs(delta)}%`} color={T.amber} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: T.text2, fontFamily: "Space Grotesk" }}>
        {label}
      </div>
      <div style={{ fontSize: "16px", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
