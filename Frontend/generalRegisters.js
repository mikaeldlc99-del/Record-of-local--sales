document.addEventListener("DOMContentLoaded", () => {
  cargarTodosLosRegistros();
});

// Escucha cambios en localStorage para actualizar la tabla al instante si guardas, editas o eliminas en index.html
window.addEventListener("storage", (event) => {
  if (event.key === "misRegistros") {
    cargarTodosLosRegistros();
  }
});

function cargarTodosLosRegistros() {
  // 1. Capturamos el cuerpo de la tabla
  const tbody = document.getElementById("tbodyTodosRegistros");

  // 2. Leemos todos los registros guardados en localStorage
  const registros = JSON.parse(localStorage.getItem("misRegistros")) || [];

  // 3. Si no hay registros, mostramos el mismo aviso estilizado
  if (registros.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-data">No hay registros guardados todavía.</td>
      </tr>
    `;
    return;
  }

  // 4. Limpiamos la tabla (los registros ya vienen guardados en orden del 1 en adelante)
  tbody.innerHTML = "";

    // 5. Dibujamos cada fila de menor a mayor (1, 2, 3...)
  const listaOrdenada = [...registros].sort((a, b) => a.id - b.id);

  listaOrdenada.forEach((reg) => { // <-- Usa listaOrdenada aquí
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${reg.id}</td>
      <td>${reg.documento}</td>
      <td>${reg.fecha}</td>
      <td>${reg.hora}</td>
      <td>${reg.estado}</td>
      <td>${reg.observaciones || "-"}</td>
    `;
    tbody.appendChild(fila);
  });

}

function exportarCSV() {
  // 1. Leemos y ordenamos los registros de menor a mayor (1, 2, 3...)
  const registros = JSON.parse(localStorage.getItem("misRegistros")) || [];

  if (registros.length === 0) {
    alert("No hay registros para exportar.");
    return;
  }

  const listaOrdenada = [...registros].sort((a, b) => a.id - b.id);

  // 2. Definimos los encabezados de las columnas (separados por ; para Excel en español)
  const encabezados = ["ID", "DNI/C.E/RUC", "Fecha", "Hora", "Estado", "Observaciones"];
  const filasCSV = [encabezados.join(";")];

  // 3. Convertimos cada registro en una fila de texto limpia
  listaOrdenada.forEach((reg) => {
    // Limpiamos saltos de línea o comillas en las observaciones para no romper las columnas
    const obsLimpia = (reg.observaciones || "-")
      .replace(/"/g, '""')
      .replace(/\r?\n|\r/g, " ");

    const fila = [
      reg.id,
      `"${reg.documento}"`, // Entre comillas para que Excel no borre ceros a la izquierda en DNIs
      reg.fecha,
      reg.hora,
      reg.estado,
      `"${obsLimpia}"`
    ];

    filasCSV.push(fila.join(";"));
  });

  // 4. Creamos el archivo descargable con formato UTF-8 (\uFEFF) para evitar errores con tildes/ñ
  const contenidoCSV = "\uFEFF" + filasCSV.join("\n");
  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // 5. Simulamos un clic de descarga con la fecha actual en el nombre del archivo
  const enlace = document.createElement("a");
  const fechaArchivo = new Date().toLocaleDateString().replace(/\//g, "-");
  enlace.href = url;
  enlace.download = `Registros_${fechaArchivo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

