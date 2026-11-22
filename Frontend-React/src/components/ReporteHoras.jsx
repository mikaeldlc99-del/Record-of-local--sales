import { useState, useEffect } from "react";
//const API_URL = "http://localhost:3000/api/registros";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/registros";


export default function ReporteHoras({ onVolverInicio, onVerTodos }) {
  const [registros, setRegistros] = useState([]);
  const [fechasAbiertas, setFechasAbiertas] = useState({
    [new Date().toLocaleDateString()]: true
  });

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setRegistros(data))
      .catch((err) => console.error("Error al cargar reporte:", err));
  }, []);

  const toggleFecha = (fecha) => {
    setFechasAbiertas((prev) => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
  };

  // Agrupamos por Fecha -> Hora
  const resumen = {};
  const granTotal = { Completado: 0, Pendiente: 0, Observado: 0, total: 0 };

  registros.forEach((reg) => {
    const fecha = reg.fecha;
    const partesHora = reg.hora.replace(/\s+/g, " ").split(" ");
    const horaBase = partesHora.at(0).split(":").at(0).padStart(2, "0");
    const periodo = partesHora.at(1) || "";
    const soloHora = `${horaBase}:00 ${periodo}`.trim();
    const estado = reg.estado;

    if (!resumen[fecha]) {
      resumen[fecha] = {
        horas: {},
        subtotal: { Completado: 0, Pendiente: 0, Observado: 0, total: 0 }
      };
    }
    if (!resumen[fecha].horas[soloHora]) {
      resumen[fecha].horas[soloHora] = { Completado: 0, Pendiente: 0, Observado: 0, total: 0 };
    }
    if (resumen[fecha].horas[soloHora][estado] !== undefined) {
      resumen[fecha].horas[soloHora][estado]++;
      resumen[fecha].horas[soloHora].total++;
      resumen[fecha].subtotal[estado]++;
      resumen[fecha].subtotal.total++;
      granTotal[estado]++;
      granTotal.total++;
    }
  });

  const fechas = Object.keys(resumen);

  return (
    <div className="pivot-container">
            <div className="form-header">
        <h2>Resumen por Hora</h2>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <button type="button" className="btn-excel" onClick={onVerTodos}>
            See all registers
          </button>
          <button
            type="button"
            onClick={onVolverInicio}
            style={{
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ← Volver al Formulario
          </button>
        </div>
      </div>


      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Completado</th>
              <th>Pendiente</th>
              <th>Observado</th>
              <th style={{ textAlign: "center" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {fechas.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No hay datos para resumir.</td>
              </tr>
            ) : (
              fechas.map((fecha) => {
                const datosFecha = resumen[fecha];
                const abierta = !!fechasAbiertas[fecha];
                const horasOrdenadas = Object.keys(datosFecha.horas).sort();

                return (
                  <GrupoFecha
                    key={fecha}
                    fecha={fecha}
                    datosFecha={datosFecha}
                    abierta={abierta}
                    horasOrdenadas={horasOrdenadas}
                    onToggle={() => toggleFecha(fecha)}
                  />
                );
              })
            )}
          </tbody>
          {fechas.length > 0 && (
            <tfoot>
              <tr className="pivot-grand-total">
                <td colSpan="2">Total General</td>
                <td>{granTotal.Completado}</td>
                <td>{granTotal.Pendiente}</td>
                <td>{granTotal.Observado}</td>
                <td style={{ textAlign: "center" }}>{granTotal.total}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function GrupoFecha({ fecha, datosFecha, abierta, horasOrdenadas, onToggle }) {
  return (
    <>
      <tr className="pivot-fila-fecha" onClick={onToggle}>
        <td>
          <button type="button" className="btn-toggle">
            {abierta ? "-" : "+"}
          </button>{" "}
          {fecha}
        </td>
        <td></td>
        <td>{datosFecha.subtotal.Completado}</td>
        <td>{datosFecha.subtotal.Pendiente}</td>
        <td>{datosFecha.subtotal.Observado}</td>
        <td style={{ textAlign: "center" }}>{datosFecha.subtotal.total}</td>
      </tr>
      {abierta &&
        horasOrdenadas.map((hora) => {
          const conteo = datosFecha.horas[hora];
          return (
            <tr key={`${fecha}-${hora}`} className="fila-detalle">
              <td></td>
              <td>{hora}</td>
              <td>{conteo.Completado}</td>
              <td>{conteo.Pendiente}</td>
              <td>{conteo.Observado}</td>
              <td style={{ textAlign: "center" }}>{conteo.total}</td>
            </tr>
          );
        })}
    </>
  );
}
