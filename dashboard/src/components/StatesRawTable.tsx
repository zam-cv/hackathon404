import type { CSSProperties } from "react";
import { T } from "../theme";
import { riskConfig, type StateRow } from "../types";
import { ExcelExportButton, buildExcelXml } from "./ExcelExportButton";

interface Props {
  rows: StateRow[];
}

const cell: CSSProperties = {
  padding: "6px 14px",
  fontSize: "12px",
  fontFamily: "Space Grotesk",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  whiteSpace: "nowrap",
};
const head: CSSProperties = {
  ...cell,
  color: T.text2,
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontWeight: 600,
  borderBottom: `1px solid ${T.border}`,
  padding: "8px 14px",
  background: T.bg1,
};

export function StatesRawTable({ rows }: Props) {
  return (
    <div
      style={{
        background: T.bg2,
        border: `1px solid ${T.border}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: T.bg1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "10px", fontFamily: "Space Grotesk", color: T.text2, letterSpacing: "0.1em" }}>
            RAW DATA ·
          </span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: T.text0, fontFamily: "Space Grotesk" }}>
            estados_eventos.csv
          </span>
          <span style={{ fontSize: "10px", color: T.text2, fontFamily: "Space Grotesk" }}>
            {rows.length} rows · 3 cols
          </span>
        </div>
        <ExcelExportButton
          filenamePrefix="sentinel_estados"
          label="DESCARGAR EXCEL"
          buildXml={() =>
            buildExcelXml(
              "Estados",
              ["estado", "tipo_de_evento", "eventos"],
              rows.map((r) => [r.estado, r.ofensa, r.incidentes])
            )
          }
        />
      </div>
      <div style={{ overflow: "auto", maxHeight: "340px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...head, width: "40px" }}>#</th>
              <th style={head}>estado</th>
              <th style={head}>tipo_de_evento</th>
              <th style={head}>eventos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rc = riskConfig[r.riesgo];
              return (
                <tr
                  key={r.estado}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(33,150,243,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td style={{ ...cell, color: T.text2, textAlign: "right", paddingRight: "10px" }}>
                    {String(i + 1).padStart(3, "0")}
                  </td>
                  <td style={{ ...cell, color: T.text0, fontFamily: "Inter", fontWeight: 500 }}>
                    {r.estado}
                  </td>
                  <td style={{ ...cell, color: rc.color }}>{r.ofensa}</td>
                  <td style={{ ...cell, color: T.text1 }}>{r.incidentes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: "8px 16px",
          borderTop: `1px solid ${T.border}`,
          fontSize: "10px",
          color: T.text2,
          fontFamily: "Space Grotesk",
          display: "flex",
          justifyContent: "space-between",
          background: T.bg1,
        }}
      >
        <span>encoding: UTF-8 · delimiter: ,</span>
        <span>last_sync: {new Date().toISOString()}</span>
      </div>
    </div>
  );
}
