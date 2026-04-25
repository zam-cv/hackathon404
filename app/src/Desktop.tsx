import "./App.css";
import { useEffect, useState } from "react";
import { Compass, Calculator, StickyNote } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa6";
import App from "./components/App";
import AppShell from "./components/AppShell";

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatDate(d: Date): string {
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function FaceWidget() {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 3.5;
      setGaze({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }, 1900);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let pending: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setBlink(true);
      pending = setTimeout(() => setBlink(false), 130);
    }, 3600);
    return () => {
      clearInterval(id);
      if (pending) clearTimeout(pending);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 mb-3">
      <div className="relative">
        {/* Glass card */}
        <div className="relative w-44 h-44 rounded-[2rem] overflow-hidden border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]">
          {/* Frosted backdrop */}
          <div className="absolute inset-0 backdrop-blur-2xl bg-white/20" />

          {/* Top sheen — single soft highlight, the only "wet" cue */}
          <div className="absolute inset-x-0 top-0 h-1/2 from-white/30 via-white/5 to-transparent" />

          {/* Crystalline eyes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="animate-float-face"
              style={{
                transform: `translate(${gaze.x * 0.6}px, ${gaze.y * 0.6}px)`,
                transition: "transform 800ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <svg
                viewBox="0 0 200 200"
                className="w-28 h-28"
                style={{
                  filter: "drop-shadow(0 4px 10px rgba(60,30,120,0.2))",
                }}
              >
                <rect
                  x="58"
                  y={blink ? 96 : 70}
                  width="24"
                  height={blink ? 8 : 60}
                  rx="12"
                  fill="rgba(255,255,255,0.95)"
                  style={{ transition: "y 130ms ease, height 130ms ease" }}
                />
                <rect
                  x="118"
                  y={blink ? 96 : 70}
                  width="24"
                  height={blink ? 8 : 60}
                  rx="12"
                  fill="rgba(255,255,255,0.95)"
                  style={{ transition: "y 130ms ease, height 130ms ease" }}
                />
              </svg>
            </div>
          </div>

          {/* Single soft specular — restraint is the design */}
          <div className="absolute top-3 left-5 w-24 h-6 rounded-full from-white/40 to-transparent blur-md pointer-events-none" />

          {/* Inner hairline */}
          <div className="absolute inset-0 border border-white/15 pointer-events-none" />
        </div>
      </div>

      <p className="text-white/95 text-sm font-light tracking-[0.12em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
        {formatDate(now)}
      </p>
    </div>
  );
}

export default function Desktop() {
  return (
    <AppShell className="gap-8">
      <FaceWidget />
      <div className="flex flex-wrap items-center justify-center gap-4">
        <App name="Navegador" nav="/navegador">
          <Compass className="w-8 h-8" strokeWidth={1.5} />
        </App>
        <App name="Facebook" nav="/facebook">
          <FaFacebookF className="w-7 h-7" />
        </App>
        <App name="Instagram" nav="/instagram">
          <FaInstagram className="w-8 h-8" />
        </App>
        <App name="Calculadora" nav="/calculadora">
          <Calculator className="w-8 h-8" strokeWidth={1.5} />
        </App>
        <App name="Notas" nav="/notas">
          <StickyNote className="w-8 h-8" strokeWidth={1.5} />
        </App>
      </div>
    </AppShell>
  );
}
