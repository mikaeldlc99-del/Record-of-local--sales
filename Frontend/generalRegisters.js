const API_URL = "http://localhost:3000/api/registros";

document.addEventListener("DOMContentLoaded", () => {
  cargarTodosLosRegistros();
});

async function cargarTodosLosRegistros() {
  const tbody = document.getElementById("tbodyTodosRegistros");

  try {
    // 1. Consultamos todos los registros a MySQL
    const respuesta = await fetch(API_URL);
    const registros = await respuesta.json();

    // 2. Si no hay datos, mostramos el aviso
    if (registros.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="no-data">No hay registros guardados todavía.</td>
        </tr>
      `;
      return;
    }

    // 3. Limpiamos la tabla y ordenamos de menor a mayor (1, 2, 3...)
    tbody.innerHTML = "";
    const listaOrdenada = [...registros].sort((a, b) => a.id - b.id);

    // 4. Dibujamos cada fila
    listaOrdenada.forEach((reg) => {
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
  } catch (error) {
    console.error("Error al cargar registros desde MySQL:", error);
  }
}

async function exportarCSV() {
  try {
    // 1. Pedimos los registros actualizados directamente desde MySQL
    const respuesta = await fetch(API_URL);
    const registros = await respuesta.json();

    if (registros.length === 0) {
      alert("No hay registros en MySQL para exportar.");
      return;
    }

    const listaOrdenada = [...registros].sort((a, b) => a.id - b.id);

    // 2. Encabezados del Excel
    const encabezados = ["ID", "DNI/C.E/RUC", "Fecha", "Hora", "Estado", "Observaciones"];
    const filasCSV = [encabezados.join(";")];

    // 3. Convertimos cada fila
    listaOrdenada.forEach((reg) => {
      const obsLimpia = (reg.observaciones || "-")
        .replace(/"/g, '""')
        .replace(/\r?\n|\r/g, " ");

      const fila = [
        reg.id,
        `"${reg.documento}"`,
        reg.fecha,
        reg.hora,
        reg.estado,
        `"${obsLimpia}"`
      ];

      filasCSV.push(fila.join(";"));
    });

    // 4. Descargamos el archivo CSV con formato UTF-8 para Excel
    const contenidoCSV = "\uFEFF" + filasCSV.join("\n");
    const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    const fechaArchivo = new Date().toLocaleDateString().replace(/\//g, "-");
    enlace.href = url;
    enlace.download = `Registros_MySQL_${fechaArchivo}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al exportar CSV:", error);
  }
}
