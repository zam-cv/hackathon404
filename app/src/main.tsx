import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Desktop from "./Desktop";
import Navegador from "./pages/Navegador";
import Facebook from "./pages/Facebook";
import Instagram from "./pages/Instagram";
import Calculadora from "./pages/Calculadora";
import Notas from "./pages/Notas";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Desktop />} />
        <Route path="/navegador" element={<Navegador />} />
        <Route path="/facebook" element={<Facebook />} />
        <Route path="/instagram" element={<Instagram />} />
        <Route path="/calculadora" element={<Calculadora />} />
        <Route path="/notas" element={<Notas />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
