import { useState } from "react";
import "./general-styles.css";
import "./reporteHoras.css";
import "./generalRegisters.css";

import RegistroForm from "./components/RegistroForm";
import ReporteHoras from "./components/ReporteHoras";
import TodosRegistros from "./components/TodosRegistros";

export default function App() {
  // Controla qué pantalla se muestra sin recargar el navegador ("registro", "reporte" o "todos")
  const [vistaActual, setVistaActual] = useState("registro");

  return (
    <div
      className="layout-centrado"
      >
      {vistaActual === "registro" && (
        <RegistroForm onVerReportes={() => setVistaActual("reporte")} />
      )}

      {vistaActual === "reporte" && (
        <ReporteHoras
          onVolverInicio={() => setVistaActual("registro")}
          onVerTodos={() => setVistaActual("todos")}
        />
      )}

      {vistaActual === "todos" && (
        <TodosRegistros onVolverReporte={() => setVistaActual("reporte")} />
      )}
    </div>
  );
}
