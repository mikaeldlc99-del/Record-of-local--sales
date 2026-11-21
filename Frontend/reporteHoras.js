const API_URL = "http://localhost:3000/api/registros";

document.addEventListener("DOMContentLoaded", () => {
  generarTablaPivot();
});

async function generarTablaPivot() {
  // 1. Capturamos el cuerpo y pie de la tabla
  const tbody = document.getElementById("tbodyPivot");
  const tfoot = document.getElementById("tfootPivot");

  try {
    // 2. Pedimos todos los registros reales a tu servidor Node.js + MySQL
    const respuesta = await fetch(API_URL);
    const registros = await respuesta.json();

    // 3. Si la tabla en MySQL está vacía, mostramos el aviso
    if (registros.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="no-data">No hay datos para resumir.</td>
        </tr>
      `;
      tfoot.innerHTML = "";
      return;
    }

    // 4. Agrupamos los registros por Fecha -> luego por Hora (ej. "11:00 PM")
    const resumen = {};
    let granTotal = { Completado: 0, Pendiente: 0, Observado: 0, total: 0 };

    registros.forEach((reg) => {
      const fecha = reg.fecha;

      // Extraemos la hora base y el periodo AM/PM de forma segura
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

    // 5. Dibujamos las filas (solo la fecha de HOY inicia abierta con "-")
    tbody.innerHTML = "";
    const fechaHoy = new Date().toLocaleDateString();

    Object.keys(resumen).forEach((fecha, index) => {
      const grupoId = `grupo-${index}`;
      const datosFecha = resumen[fecha];
      const esHoy = fecha === fechaHoy;

      // Fila principal de la FECHA
      const filaFecha = document.createElement("tr");
      filaFecha.className = "pivot-fila-fecha";
      filaFecha.onclick = () => toggleGrupo(grupoId, filaFecha);
      filaFecha.innerHTML = `
        <td><button type="button" class="btn-toggle">${esHoy ? "-" : "+"}</button> ${fecha}</td>
        <td></td>
        <td>${datosFecha.subtotal.Completado}</td>
        <td>${datosFecha.subtotal.Pendiente}</td>
        <td>${datosFecha.subtotal.Observado}</td>
        <td style="text-align: center;">${datosFecha.subtotal.total}</td>
      `;
      tbody.appendChild(filaFecha);

      // Filas hijas por cada HORA
      const horasOrdenadas = Object.keys(datosFecha.horas).sort();
      horasOrdenadas.forEach((hora) => {
        const conteo = datosFecha.horas[hora];
        const filaHora = document.createElement("tr");
        filaHora.className = `fila-detalle ${grupoId} ${esHoy ? "" : "oculto"}`;
        filaHora.innerHTML = `
          <td></td>
          <td>${hora}</td>
          <td>${conteo.Completado}</td>
          <td>${conteo.Pendiente}</td>
          <td>${conteo.Observado}</td>
          <td style="text-align: center;">${conteo.total}</td>
        `;
        tbody.appendChild(filaHora);
      });
    });

    // 6. Dibujamos la fila de TOTAL GENERAL
    tfoot.innerHTML = `
      <tr class="pivot-grand-total">
        <td colspan="2">Total General</td>
        <td>${granTotal.Completado}</td>
        <td>${granTotal.Pendiente}</td>
        <td>${granTotal.Observado}</td>
        <td style="text-align: center;">${granTotal.total}</td>
      </tr>
    `;
  } catch (error) {
    console.error("Error al cargar el reporte desde MySQL:", error);
  }
}

// 7. Función para expandir o contraer las horas de una fecha
function toggleGrupo(grupoId, filaFecha) {
  const filasHijas = document.querySelectorAll(`.${grupoId}`);
  const boton = filaFecha.querySelector(".btn-toggle");

  filasHijas.forEach((fila) => {
    fila.classList.toggle("oculto");
  });

  boton.textContent = boton.textContent === "-" ? "+" : "-";
}
