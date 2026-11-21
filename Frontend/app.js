const API_URL = "http://localhost:3000/api/registros";

// Variable global para saber si estamos creando (null) o editando (un ID)
let idEditando = null;

document.addEventListener("DOMContentLoaded", () => {
  actualizarContadorHoraActual();

  // 1. Capturamos los elementos del formulario usando sus IDs
  const form = document.getElementById("registroForm");
  const inputDocumento = document.getElementById("id");
  const selectEstado = document.getElementById("estado");
  const textObservaciones = document.getElementById("observaciones");
  const divMensaje = document.getElementById("mensaje");

    // Agregamos "async" porque usaremos "await fetch(...)" para esperar la respuesta de MySQL
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      if (idEditando !== null) {
        // --- CASO A: MODO EDICIÓN (PUT) ---
        const respuesta = await fetch(`${API_URL}/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documento: inputDocumento.value.trim(),
            estado: selectEstado.value,
            observaciones: textObservaciones.value.trim()
          })
        });

        if (!respuesta.ok) throw new Error("Error al actualizar en MySQL");

        divMensaje.textContent = "✅ Registro actualizado en MySQL.";
        divMensaje.style.color = "blue";

        if (document.getElementById("contenedor-busqueda-index").style.display === "block") {
          buscarRegistro();
        }
      } else {
        // --- CASO B: MODO CREAR NUEVO (POST) ---
        const ahora = new Date();
        const nuevoRegistro = {
          documento: inputDocumento.value.trim(),
          fecha: ahora.toLocaleDateString(),
          hora: ahora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          estado: selectEstado.value,
          observaciones: textObservaciones.value.trim()
        };

        // Enviamos el objeto al servidor Express para que lo guarde en MySQL
        const respuesta = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nuevoRegistro)
        });

        if (!respuesta.ok) throw new Error("Error al guardar en MySQL");

        divMensaje.textContent = "✅ Registro guardado en MySQL.";
        divMensaje.style.color = "green";
      }

      resetearFormulario();
      actualizarContadorHoraActual();

      setTimeout(() => {
        divMensaje.textContent = "";
      }, 3000);

    } catch (error) {
      console.error(error);
      divMensaje.textContent = "❌ Error de conexión con el servidor.";
      divMensaje.style.color = "red";
    }
  });
});



  
  // BUSCAR REGISTRO EN MYSQL (GET)
  async function buscarRegistro() {
    const documentoBuscado = document.getElementById("id").value.trim();
  const contenedorTabla = document.getElementById("contenedor-busqueda-index");
  const tbody = document.getElementById("tbodyBusquedaIndex");
  const divMensaje = document.getElementById("mensaje");
  
  if (documentoBuscado === "") {
    divMensaje.textContent = "⚠️ Por favor, ingresa un DNI/C.E/RUC para buscar.";
    divMensaje.style.color = "orange";
    return;
  }
  
  try {
    const respuesta = await fetch(API_URL);
    const registros = await respuesta.json(); // Obtenemos los datos reales de MySQL
    
    const resultados = registros.filter((reg) => reg.documento === documentoBuscado);
    tbody.innerHTML = "";
    
    if (resultados.length === 0) {
      contenedorTabla.style.display = "none";
      divMensaje.textContent = "❌ No se encontraron registros en MySQL.";
      divMensaje.style.color = "red";
      return;
    }
    
    divMensaje.textContent = "";
    contenedorTabla.style.display = "block";
    
    resultados.forEach((reg) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${reg.id}</td>
        <td>${reg.documento}</td>
        <td>${reg.fecha}</td>
        <td>${reg.hora}</td>
        <td>${reg.estado}</td>
        <td>${reg.observaciones || "-"}</td>
        <td>
        <button type="button" onclick="cargarParaEditar(${reg.id})">Editar</button>
        <button type="button" onclick="eliminarRegistro(${reg.id})">Eliminar</button>
        </td>
        `;
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al buscar:", error);
  }
}




//Funcion para cerrar la tabla de registros encontrados
function cerrarBusquedaIndex() {
  document.getElementById("contenedor-busqueda-index").style.display = "none";
  document.getElementById("tbodyBusquedaIndex").innerHTML = "";
}





// CARGAR DATOS DESDE MYSQL AL FORMULARIO PARA EDITAR
async function cargarParaEditar(id) {
  try {
    const respuesta = await fetch(API_URL);
    const registros = await respuesta.json();
    const registro = registros.find((reg) => reg.id === id);
    
    if (!registro) return;
    
    idEditando = id;
    document.getElementById("id").value = registro.documento;
    document.getElementById("estado").value = registro.estado;
    document.getElementById("observaciones").value = registro.observaciones || "";
    
    document.getElementById("formTitulo").textContent = "Edit Register #" + id;
    document.getElementById("btnEnviar").textContent = "Update Register";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Error al cargar edición:", error);
  }
}


//Funcion para resetear formulario
function resetearFormulario() {
  idEditando = null; // Volvemos al modo "Crear nuevo"
  document.getElementById("registroForm").reset();
  document.getElementById("formTitulo").textContent = "New Register";
  document.getElementById("btnEnviar").textContent = "Save Register";
}


// ELIMINAR REGISTRO EN MYSQL (DELETE)
async function eliminarRegistro(id) {
  if (!confirm(`¿Estás seguro de eliminar el registro #${id} de MySQL?`)) return;
  
  try {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar");
    
    if (idEditando === id) resetearFormulario();
    
    const divMensaje = document.getElementById("mensaje");
    divMensaje.textContent = "🗑️ Registro eliminado de MySQL.";
    divMensaje.style.color = "red";
    setTimeout(() => { divMensaje.textContent = ""; }, 3000);
    
    actualizarContadorHoraActual();
    
    // Verificamos si quedan registros con ese documento para refrescar o cerrar la tabla
    const resActualizada = await fetch(API_URL);
    const registros = await resActualizada.json();
    const documentoBuscado = document.getElementById("id").value.trim();
    const quedanResultados = registros.some((reg) => reg.documento === documentoBuscado);
    
    if (quedanResultados) {
      buscarRegistro();
    } else {
      cerrarBusquedaIndex();
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
  }
}



// 3. LÓGICA DE PLANTILLAS RÁPIDAS
// ==========================================
const listaPlantillas = document.getElementById("lista-plantillas");
const inputNuevaPlantilla = document.getElementById("nueva-plantilla-texto");

if (listaPlantillas) {
  let plantillas = JSON.parse(localStorage.getItem("misPlantillas")) || [
    "Cliente conforme con la atención brindada.",
  ];

  function renderizarPlantillas() {
    listaPlantillas.innerHTML = "";
    plantillas.forEach((texto, index) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta-plantilla";
      tarjeta.innerHTML = `
          <p>${texto}</p>
          <div class="acciones-plantilla">
          <button type="button" class="btn-copiar" data-index="${index}">Copiar</button>
          <button type="button" class="btn-borrar-mini" data-index="${index}">X</button>
          </div>
          `;
      listaPlantillas.appendChild(tarjeta);
    });
  }
  
  renderizarPlantillas();
  
  // Hacer global la función del botón "+"
  window.agregarPlantilla = function () {
    const texto = inputNuevaPlantilla.value.trim();
    if (!texto) {
      alert("Escribe el texto de la plantilla primero.");
      return;
    }
    plantillas.push(texto);
    localStorage.setItem("misPlantillas", JSON.stringify(plantillas));
    inputNuevaPlantilla.value = "";
    renderizarPlantillas();
  };
  
  // Permitir agregar también presionando Enter en el input
  if (inputNuevaPlantilla) {
    inputNuevaPlantilla.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        window.agregarPlantilla();
      }
    });
  }
  
  // Delegación de eventos para Copiar y Eliminar (X)
  listaPlantillas.addEventListener("click", (e) => {
    const index = e.target.getAttribute("data-index");
    if (index === null) return;
    
    // Botón Copiar -> Copia al portapapeles y lo pega en Observaciones
    if (e.target.classList.contains("btn-copiar")) {
      const textoACopiar = plantillas[index];
      navigator.clipboard.writeText(textoACopiar);
      
      const campoObs = document.getElementById("observaciones");
      if (campoObs) {
        campoObs.value = campoObs.value
        ? `${campoObs.value} ${textoACopiar}`
        : textoACopiar;
      }
      
      const textoOriginal = e.target.textContent;
      e.target.textContent = "¡Copiado!";
      setTimeout(() => (e.target.textContent = textoOriginal), 1000);
    }

    // Botón Eliminar (X)
    if (e.target.classList.contains("btn-borrar-mini")) {
      plantillas.splice(index, 1);
      localStorage.setItem("misPlantillas", JSON.stringify(plantillas));
      renderizarPlantillas();
    }
  });
}

function renderizarTablaPivot(lista) {
  const tbodyPivot = document.getElementById("tbodyPivot");
  const tfootPivot = document.getElementById("tfootPivot");
  if (!tbodyPivot || !tfootPivot) return;
  
  if (lista.length === 0) {
    tbodyPivot.innerHTML = `<tr><td colspan="6" class="no-data">No hay datos para resumir.</td></tr>`;
    tfootPivot.innerHTML = "";
    return;
  }
  
  function obtenerHora24(horaStr) {
    if (!horaStr) return "00";
    const match = horaStr.match(
        /(\d{1,2}):\d{2}\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/i,
      );
      if (!match) return "00";
      let h = parseInt(match[1], 10);
      const periodo = (match[2] || "").toLowerCase().replace(/\s|\./g, "");
      if (periodo === "pm" && h < 12) h += 12;
      if (periodo === "am" && h === 12) h = 0;
      return String(h).padStart(2, "0");
    }
    
    const grupos = {};
    const grandTotal = { Completado: 0, Pendiente: 0, Observado: 0, Total: 0 };
    
    lista.forEach((reg) => {
      const fecha = reg.fecha || "Sin fecha";
      const hora = obtenerHora24(reg.hora);
      const est = reg.estado || "Pendiente";
      
      if (!grupos[fecha]) {
        grupos[fecha] = {
          horas: {},
          subtotal: { Completado: 0, Pendiente: 0, Observado: 0, Total: 0 },
        };
      }
      if (!grupos[fecha].horas[hora]) {
        grupos[fecha].horas[hora] = {
          Completado: 0,
          Pendiente: 0,
          Observado: 0,
          Total: 0,
        };
      }
      
      if (grupos[fecha].horas[hora][est] !== undefined) {
        grupos[fecha].horas[hora][est]++;
        grupos[fecha].subtotal[est]++;
        grandTotal[est]++;
      }
      grupos[fecha].horas[hora].Total++;
      grupos[fecha].subtotal.Total++;
      grandTotal.Total++;
    });
    
    tbodyPivot.innerHTML = "";
    const fechasOrdenadas = Object.keys(grupos).sort();
    
    fechasOrdenadas.forEach((fecha, idx) => {
      const grupoId = `grupo-fecha-${idx}`;
      const sub = grupos[fecha].subtotal;
      
      // 1. Fila principal de la Fecha (colapsada por defecto con "+")
      const trFecha = document.createElement("tr");
      trFecha.className = "pivot-fila-fecha";
      trFecha.dataset.fecha = fecha;
      trFecha.innerHTML = `
      <td><button type="button" class="btn-toggle" data-target="${grupoId}">+</button>${fecha}</td>
      <td></td>
      <td>${sub.Completado || ""}</td>
      <td>${sub.Pendiente || ""}</td>
      <td>${sub.Observado || ""}</td>
      <td>${sub.Total}</td>
      `;
      tbodyPivot.appendChild(trFecha);
      
      // 2. Filas internas por cada Hora
      const horasOrdenadas = Object.keys(grupos[fecha].horas).sort();
      horasOrdenadas.forEach((hora, hIdx) => {
        const datosHora = grupos[fecha].horas[hora];
        const trHora = document.createElement("tr");
        trHora.className = `pivot-fila-hora ${grupoId} oculto`;
        trHora.innerHTML = `
        <td>${hIdx === 0 ? fecha : ""}</td>
        <td>${hora}</td>
        <td>${datosHora.Completado || ""}</td>
        <td>${datosHora.Pendiente || ""}</td>
        <td>${datosHora.Observado || ""}</td>
        <td>${datosHora.Total}</td>
        `;
        tbodyPivot.appendChild(trHora);
      });
      
      // 3. Fila de Subtotal por Fecha
      const trSub = document.createElement("tr");
      trSub.className = `pivot-fila-subtotal ${grupoId} oculto`;
      trSub.innerHTML = `
      <td colspan="2">Sub total</td>
      <td>${sub.Completado || 0}</td>
      <td>${sub.Pendiente || 0}</td>
      <td>${sub.Observado || 0}</td>
      <td>${sub.Total}</td>
      `;
      tbodyPivot.appendChild(trSub);
    });
    
    // 4. Fila Final: Grand Total
    tfootPivot.innerHTML = `
    <tr class="pivot-grand-total">
    <td colspan="2">Gran Total</td>
    <td>${grandTotal.Completado}</td>
    <td>${grandTotal.Pendiente}</td>
    <td>${grandTotal.Observado}</td>
    <td>${grandTotal.Total}</td>
    </tr>
    `;
    
    // Evento para desplegar / colapsar al hacer clic en la fila de fecha o en "+"
    tbodyPivot.onclick = (e) => {
      const filaFecha = e.target.closest(".pivot-fila-fecha");
      if (!filaFecha) return;
      
      const btn = filaFecha.querySelector(".btn-toggle");
      const targetClass = btn.getAttribute("data-target");
      const filasHijas = tbodyPivot.querySelectorAll(`.${targetClass}`);
      const estaExpandido = btn.textContent === "-";
      
      btn.textContent = estaExpandido ? "+" : "-";
      filasHijas.forEach((tr) => tr.classList.toggle("oculto", estaExpandido));
      
      const celdas = filaFecha.querySelectorAll("td");
      const fechaTxt = filaFecha.dataset.fecha;
      const sub = grupos[fechaTxt].subtotal;
      
      celdas[2].textContent = estaExpandido ? sub.Completado || "" : "";
      celdas[3].textContent = estaExpandido ? sub.Pendiente || "" : "";
      celdas[4].textContent = estaExpandido ? sub.Observado || "" : "";
      celdas[5].textContent = estaExpandido ? sub.Total : "";
    };
  }
  
  
  // 4. CONTADOR DE LA HORA EN CURSO LEYENDO DESDE MYSQL
  async function actualizarContadorHoraActual() {
    try {
      const respuesta = await fetch(API_URL);
      const registros = await respuesta.json();
      const ahora = new Date();
      
      const fechaHoy = ahora.toLocaleDateString();
      const horaActualTexto = ahora
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      .replace(/\s+/g, " ");
      
      const partesActual = horaActualTexto.split(" ");
      const horaActual = partesActual.at(0).split(":").at(0);
      const periodoActual = partesActual.at(1) || "";
      
      document.getElementById("rangoHoraActual").textContent = `${horaActual}:00 ${periodoActual}`.trim();
      
      const totalEstaHora = registros.filter((reg) => {
        if (reg.fecha !== fechaHoy) return false;
        const partesReg = reg.hora.replace(/\s+/g, " ").split(" ");
        const regHora = partesReg.at(0).split(":").at(0);
        const regPeriodo = partesReg.at(1) || "";
        return regHora === horaActual && regPeriodo === periodoActual;
      }).length;
      
      document.getElementById("contadorHoraActual").textContent = totalEstaHora;
    } catch (error) {
      console.error("Error al actualizar contador:", error);
    }
  }

