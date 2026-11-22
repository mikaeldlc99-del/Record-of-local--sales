import { useState, useEffect } from "react";

const API_URL = "http://localhost:3000/api/registros";

export default function TodosRegistros({ onVolverReporte }) {
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        const ordenados = [...data].sort((a, b) => a.id - b.id);
        setRegistros(ordenados);
      })
      .catch((err) => console.error("Error al cargar todos los registros:", err));
  }, []);

  const exportarCSV = () => {
    if (registros.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }

    const encabezados = ["ID", "DNI/C.E/RUC", "Fecha", "Hora", "Estado", "Observaciones"];
    const filasCSV = [encabezados.join(";")];

    registros.forEach((reg) => {
      const obsLimpia = (reg.observaciones || "-")
        .replace(/"/g, '""')
        .replace(/\r?\n|\r/g, " ");

      filasCSV.push(
        [reg.id, `"${reg.documento}"`, reg.fecha, reg.hora, reg.estado, `"${obsLimpia}"`].join(";")
      );
    });

    const contenidoCSV = "\uFEFF" + filasCSV.join("\n");
    const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    const fechaArchivo = new Date().toLocaleDateString().replace(/\//g, "-");
    enlace.href = url;
    enlace.download = `Registros_TiDB_${fechaArchivo}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pivot-container">
            <div className="form-header">
        <h2>Todos los Registros</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button type="button" onClick={exportarCSV} className="btn-excel">
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={onVolverReporte}
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
            ← Volver al Resumen
          </button>
        </div>
      </div>


      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>DNI/C.E/RUC</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No hay registros guardados todavía.</td>
              </tr>
            ) : (
              registros.map((reg) => (
                <tr key={reg.id}>
                  <td>{reg.id}</td>
                  <td>{reg.documento}</td>
                  <td>{reg.fecha}</td>
                  <td>{reg.hora}</td>
                  <td>{reg.estado}</td>
                  <td>{reg.observaciones || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
