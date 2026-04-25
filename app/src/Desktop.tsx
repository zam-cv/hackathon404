import "./App.css";
import { Compass, Calculator, StickyNote } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa6";
import App from "./components/App";

export default function Desktop() {
  return (
    <main className="px-4 py-8">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <App name="Navegador">
          <Compass className="w-8 h-8" strokeWidth={1.5} />
        </App>
        <App name="Facebook">
          <FaFacebookF className="w-7 h-7" />
        </App>
        <App name="Instagram">
          <FaInstagram className="w-8 h-8" />
        </App>
        <App name="Calculadora">
          <Calculator className="w-8 h-8" strokeWidth={1.5} />
        </App>
        <App name="Notas">
          <StickyNote className="w-8 h-8" strokeWidth={1.5} />
        </App>
      </div>
    </main>
  );
}
