import { useState, useEffect } from "react";
//const API_URL = "http://localhost:3000/api/registros";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/registros";


export default function RegistroForm({ onVerReportes }) {
  // 1. Estados del formulario
  const [documento, setDocumento] = useState("");
  const [estado, setEstado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [idEditando, setIdEditando] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", color: "" });

  // 2. Estados para búsqueda y contador de la hora actual
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [contadorHora, setContadorHora] = useState({
    rango: "Esta hora",
    total: 0,
  });

  // 3. Estados para Quick Templates (guardadas en localStorage del navegador)
  const [plantillas, setPlantillas] = useState(() => {
    const guardadas = JSON.parse(localStorage.getItem("misPlantillas"));
    return guardadas && guardadas.length > 0
      ? guardadas
      : ["Client satisfied with the service provided."];
  });
  const [nuevaPlantilla, setNuevaPlantilla] = useState("");
  const [copiadoIdx, setCopiadoIdx] = useState(null);

  useEffect(() => {
    actualizarContadorHoraActual();
  }, []);

  useEffect(() => {
    localStorage.setItem("misPlantillas", JSON.stringify(plantillas));
  }, [plantillas]);

  const mostrarAviso = (texto, color) => {
    setMensaje({ texto, color });
    setTimeout(() => setMensaje({ texto: "", color: "" }), 3000);
  };

  // Contador en vivo desde TiDB Cloud
  const actualizarContadorHoraActual = async () => {
    try {
      const res = await fetch(API_URL);
      const registros = await res.json();
      const ahora = new Date();

      const fechaHoy = ahora.toLocaleDateString();
      const horaActualTexto = ahora
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        .replace(/\s+/g, " ");

      const partesActual = horaActualTexto.split(" ");
      const horaActual = partesActual.at(0).split(":").at(0);
      const periodoActual = partesActual.at(1) || "";

      const totalEstaHora = registros.filter((reg) => {
        if (reg.fecha !== fechaHoy) return false;
        const partesReg = reg.hora.replace(/\s+/g, " ").split(" ");
        const regHora = partesReg.at(0).split(":").at(0);
        const regPeriodo = partesReg.at(1) || "";
        return regHora === horaActual && regPeriodo === periodoActual;
      }).length;

      setContadorHora({
        rango: `${horaActual}:00 ${periodoActual}`.trim(),
        total: totalEstaHora,
      });
    } catch (error) {
      console.error("Error al actualizar contador:", error);
    }
  };

  // Guardar (POST) o Actualizar (PUT) en TiDB Cloud
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (idEditando !== null) {
        const res = await fetch(`${API_URL}/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documento: documento.trim(),
            estado,
            observaciones: observaciones.trim(),
          }),
        });
        if (!res.ok) throw new Error("Error al actualizar");

        mostrarAviso("✅ Registro actualizado en TiDB Cloud.", "blue");
        if (mostrarBusqueda) buscarRegistro(documento.trim());
      } else {
        const ahora = new Date();
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documento: documento.trim(),
            fecha: ahora.toLocaleDateString(),
            hora: ahora.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            estado,
            observaciones: observaciones.trim(),
          }),
        });
        if (!res.ok) throw new Error("Error al guardar");

        mostrarAviso("✅ Registro guardado en TiDB Cloud.", "green");
      }

      resetearFormulario();
      actualizarContadorHoraActual();
    } catch (error) {
      console.error(error);
      mostrarAviso("❌ Error de conexión con el servidor.", "red");
    }
  };

  // Buscar por DNI/C.E/RUC (GET)
  const buscarRegistro = async (docParam) => {
    const docBuscado =
      typeof docParam === "string" ? docParam : documento.trim();

    if (!docBuscado) {
      mostrarAviso(
        "⚠️ Por favor, ingresa un DNI/C.E/RUC para buscar.",
        "orange",
      );
      return;
    }

    try {
      const res = await fetch(API_URL);
      const registros = await res.json();
      const filtrados = registros.filter(
        (reg) => String(reg.documento).trim() === docBuscado,
      );

      if (filtrados.length === 0) {
        setMostrarBusqueda(false);
        setResultadosBusqueda([]);
        mostrarAviso("❌ No se encontraron registros en TiDB Cloud.", "red");
        return;
      }

      setResultadosBusqueda(filtrados);
      setMostrarBusqueda(true);
    } catch (error) {
      console.error("Error al buscar:", error);
    }
  };

  const cargarParaEditar = (reg) => {
    setIdEditando(reg.id);
    setDocumento(reg.documento);
    setEstado(reg.estado);
    setObservaciones(reg.observaciones || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarRegistro = async (id) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro #${id}?`))
      return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");

      if (idEditando === id) resetearFormulario();
      mostrarAviso("🗑️ Registro eliminado de TiDB Cloud.", "red");
      actualizarContadorHoraActual();

      const restantes = resultadosBusqueda.filter((r) => r.id !== id);
      setResultadosBusqueda(restantes);
      if (restantes.length === 0) setMostrarBusqueda(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const resetearFormulario = () => {
    setIdEditando(null);
    setDocumento("");
    setEstado("");
    setObservaciones("");
  };

  // Funciones de Quick Templates
  const agregarPlantilla = () => {
    const texto = nuevaPlantilla.trim();
    if (!texto) return;
    setPlantillas([...plantillas, texto]);
    setNuevaPlantilla("");
  };

  const copiarTexto = (texto, idx) => {
    navigator.clipboard.writeText(texto);
    setObservaciones((prev) => (prev ? `${prev}\n${texto}` : texto));
    setCopiadoIdx(idx);
    setTimeout(() => setCopiadoIdx(null), 1500);
  };

  const eliminarPlantilla = (idx) => {
    setPlantillas(plantillas.filter((_, i) => i !== idx));
  };

  return (
    <div className="app-grid">
      {/* COLUMN 1: FORM */}
      <div className="form-container">
        <div className="form-header">
          <h1 id="formTitulo">
            {idEditando ? `Edit Register #${idEditando}` : "New Register"}
          </h1>
          <div
            className="hora-card"
            title="Registros creados en la hora en curso"
          >
            <span className="hora-titulo" id="rangoHoraActual">
              {contadorHora.rango}
            </span>
            <strong className="hora-numero" id="contadorHoraActual">
              {contadorHora.total}
            </strong>
          </div>
        </div>

        <form id="registroForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="id">DNI/C.E/RUC:</label>
            <div className="search-group">
              <input
                type="text"
                id="id"
                required
                placeholder="Ej: 45404471"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
              />
              <button
                type="button"
                id="btnBuscar"
                onClick={() => buscarRegistro()}
              >
                Search ID
              </button>
              <a
                href="#reports"
                id="aLimpiar"
                onClick={(e) => {
                  e.preventDefault();
                  onVerReportes();
                }}
              >
                Reports
              </a>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="estado">Status:</label>
            <select
              id="estado"
              required
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="" disabled>
                Select a status
              </option>
              <option value="Pendiente">Pending</option>
              <option value="Completado">Completed</option>
              <option value="Observado">Under Review</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="observaciones">Notes:</label>
            <textarea
              id="observaciones"
              placeholder="Additional details.."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          <div className="btn-actions">
            <button type="submit" id="btnEnviar">
              {idEditando ? "Update Register" : "Save Register"}
            </button>
            <button type="button" id="btnCancelar" onClick={resetearFormulario}>
              Cancel Editing
            </button>
          </div>

          {mensaje.texto && (
            <div id="mensaje" style={{ color: mensaje.color }}>
              {mensaje.texto}
            </div>
          )}
        </form>
      </div>

      {/* COLUMN 2: TEMPLATES */}
      <section className="panel panel-plantillas">
        <h2>Quick Templates</h2>

        <div className="agregar-plantilla">
          <input
            type="text"
            id="nueva-plantilla-texto"
            placeholder="Escribe una nueva plantilla..."
            value={nuevaPlantilla}
            onChange={(e) => setNuevaPlantilla(e.target.value)}
          />
          <button
            type="button"
            onClick={agregarPlantilla}
            className="btn-agregar"
          >
            +
          </button>
        </div>

        <div id="lista-plantillas" className="lista-plantillas">
          {plantillas.map((texto, idx) => (
            <div key={idx} className="tarjeta-plantilla">
              <p>{texto}</p>
              <div className="acciones-plantilla">
                <button
                  type="button"
                  onClick={() => copiarTexto(texto, idx)}
                  className="btn-copiar"
                >
                  {copiadoIdx === idx ? "¡Copiado!" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={() => eliminarPlantilla(idx)}
                  className="btn-borrar-mini"
                >
                  X
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COLUMN 3: QUICK SEARCH RESULTS IN INDEX */}
      {mostrarBusqueda && (
        <div
          id="contenedor-busqueda-index"
          className="grid-container"
          style={{ gridColumn: "1 / -1", marginTop: "20px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h2>Records Found</h2>
            <button
              type="button"
              onClick={() => setMostrarBusqueda(false)}
              className="btn-borrar-mini"
            >
              Close
            </button>
          </div>
          <div className="tabla-responsive">
            <table id="tabla-busqueda-index">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DNI/C.E/RUC</th>
                  <th>Date</th>
                  <th>Hour</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {resultadosBusqueda.map((reg) => (
                  <tr key={reg.id}>
                    <td>{reg.id}</td>
                    <td>{reg.documento}</td>
                    <td>{reg.fecha}</td>
                    <td>{reg.hora}</td>
                    <td>{reg.estado}</td>
                    <td>{reg.observaciones || "-"}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => cargarParaEditar(reg)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarRegistro(reg.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
