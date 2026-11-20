document.addEventListener("DOMContentLoaded", () => {
  generarTablaPivot();
});

// Escucha cambios en localStorage hechos desde otras pestañas (guardar, editar o eliminar)
window.addEventListener("storage", (event) => {
  if (event.key === "misRegistros") {
    generarTablaPivot(); // Vuelve a dibujar la tabla automáticamente al instante
  }
});

function generarTablaPivot() {
  // 1. Capturamos el cuerpo y pie de la tabla desde tu HTML
  const tbody = document.getElementById("tbodyPivot");
  const tfoot = document.getElementById("tfootPivot");

  // 2. Leemos los registros guardados desde localStorage
  const registros = JSON.parse(localStorage.getItem("misRegistros")) || [];

  // 3. Si no hay registros, mostramos el mensaje idéntico a tu imagen
  if (registros.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-data">No hay datos para resumir.</td>
      </tr>
    `;
    tfoot.innerHTML = "";
    return;
  }

  // 4. Agrupamos los registros por Fecha -> luego por Hora (ej. "10:00")
  const resumen = {};
  let granTotal = { Completado: 0, Pendiente: 0, Observado: 0, total: 0 };

  registros.forEach((reg) => {
    const fecha = reg.fecha;
    // Extraemos solo la hora base (ej. de "10:35" o "10:35 a. m." tomamos "10:00")
    const soloHora = reg.hora.split(":")[0].padStart(2, "0") + ":00";
    const estado = reg.estado; // "Completado", "Pendiente" u "Observado"

    // Creamos la estructura de la fecha si aún no existe
    if (!resumen[fecha]) {
      resumen[fecha] = {
        horas: {},
        subtotal: { Completado: 0, Pendiente: 0, Observado: 0, total: 0 }
      };
    }

    // Creamos la estructura de esa hora si aún no existe
    if (!resumen[fecha].horas[soloHora]) {
      resumen[fecha].horas[soloHora] = { Completado: 0, Pendiente: 0, Observado: 0, total: 0 };
    }

    // Sumamos 1 al estado correspondiente en: la hora, el subtotal del día y el total general
    if (resumen[fecha].horas[soloHora][estado] !== undefined) {
      resumen[fecha].horas[soloHora][estado]++;
      resumen[fecha].horas[soloHora].total++;

      resumen[fecha].subtotal[estado]++;
      resumen[fecha].subtotal.total++;

      granTotal[estado]++;
      granTotal.total++;
    }
  });

  // 5. Dibujamos las filas en el HTML
  // 5. Dibujamos las filas en el HTML (solo la fecha de HOY inicia desplegada)
  tbody.innerHTML = "";
  const fechaHoy = new Date().toLocaleDateString();

  Object.keys(resumen).forEach((fecha, index) => {
    const grupoId = `grupo-${index}`;
    const datosFecha = resumen[fecha];
    const esHoy = fecha === fechaHoy; // true solo si es la fecha actual

    // A) Fila principal de la FECHA: muestra "-" si es hoy, o "+" si es otro día
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

    // B) Filas hijas por cada HORA: si NO es hoy, les agregamos la clase "oculto"
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


  // 6. Dibujamos la fila de TOTAL GENERAL en el <tfoot>
  tfoot.innerHTML = `
    <tr class="pivot-grand-total">
      <td colspan="2">Total General</td>
      <td>${granTotal.Completado}</td>
      <td>${granTotal.Pendiente}</td>
      <td>${granTotal.Observado}</td>
      <td style="text-align: center;">${granTotal.total}</td>
    </tr>
  `;
}

// 7. Función para expandir o contraer las horas de una fecha al hacer clic
function toggleGrupo(grupoId, filaFecha) {
  const filasHijas = document.querySelectorAll(`.${grupoId}`);
  const boton = filaFecha.querySelector(".btn-toggle");

  filasHijas.forEach((fila) => {
    fila.classList.toggle("oculto"); // Usa tu clase .oculto { display: none; }
  });

  // Cambia el símbolo entre "-" y "+"
  boton.textContent = boton.textContent === "-" ? "+" : "-";
}
