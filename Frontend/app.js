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

  // 2. Escuchamos cuando se envía el formulario
  form.addEventListener("submit", (e) => {
    // Evitamos que la página se recargue al enviar
    e.preventDefault();

    // 3. Cargamos lo que ya exista en localStorage o creamos un arreglo vacío []
    let registros = JSON.parse(localStorage.getItem("misRegistros")) || [];

    // 4. Verificamos si estamos EDITANDO un registro existente o CREANDO uno nuevo
    if (idEditando !== null) {
      
      // --- CASO A: MODO EDICIÓN ---
      // Buscamos la posición exacta (0, 1, 2...) del registro en la lista usando su ID
      const indice = registros.findIndex((reg) => reg.id === idEditando);

      // Si encontramos el registro, actualizamos solo los campos modificables
      if (indice !== -1) {
        registros[indice].documento = inputDocumento.value.trim(); // .trim() quita espacios extra
        registros[indice].estado = selectEstado.value;
        registros[indice].observaciones = textObservaciones.value.trim();

        // Guardamos la lista actualizada en localStorage convirtiéndola a texto
        localStorage.setItem("misRegistros", JSON.stringify(registros));

        // Mostramos mensaje de actualización
        divMensaje.textContent = "✅ Registro actualizado correctamente.";
        divMensaje.style.color = "blue";

        // Si la tabla de búsqueda estaba visible, la volvemos a cargar para ver el cambio al instante
        if (document.getElementById("contenedor-busqueda-index").style.display === "block") {
          buscarRegistro();
        }
      }

    } else {

            // --- CASO B: MODO CREAR NUEVO ---
      // Obtenemos fecha y hora actual (necesarias para las columnas de tu tabla)
      const ahora = new Date();
      const fechaActual = ahora.toLocaleDateString();
      const horaActual = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Generamos un ID corto correlativo (1, 2, 3...) buscando el número más alto actual y sumándole 1
      const nuevoId = registros.length > 0 
        ? Math.max(...registros.map((reg) => Number(reg.id) || 0)) + 1 
        : 1;

      // Creamos el objeto con los datos del nuevo registro
      const nuevoRegistro = {
        id: nuevoId, // Ahora será 1, 2, 3... en lugar de un número largo
        documento: inputDocumento.value.trim(), // .trim() quita espacios en blanco extra
        fecha: fechaActual,
        hora: horaActual,
        estado: selectEstado.value,
        observaciones: textObservaciones.value.trim()
      };


      // Agregamos el objeto a nuestra lista y lo guardamos en localStorage
      registros.push(nuevoRegistro);
      localStorage.setItem("misRegistros", JSON.stringify(registros)); /* esta función convierte tu lista de objetos en formato texto para poder guardarla. */

      // Mostramos confirmación de guardado
      divMensaje.textContent = "✅ Registro guardado correctamente.";
      divMensaje.style.color = "green";
    }

    // 5. Limpiamos el formulario y regresamos el título/botón a "New Register"
    resetearFormulario();
    actualizarContadorHoraActual();

    // 6. Ocultamos el mensaje después de 3 segundos
    setTimeout(() => {
      divMensaje.textContent = "";
    }, 3000);
  });

});


//Funcion para buscar un registro por id
function buscarRegistro() {
  const documentoBuscado = document.getElementById("id").value.trim();
  const contenedorTabla = document.getElementById("contenedor-busqueda-index");
  const tbody = document.getElementById("tbodyBusquedaIndex");
  const divMensaje = document.getElementById("mensaje");

  // Si el usuario no escribió nada, mostramos un aviso y salimos
  if (documentoBuscado === "") {
    divMensaje.textContent = "⚠️ Por favor, ingresa un DNI/C.E/RUC para buscar.";
    divMensaje.style.color = "orange";
    return;
  }

    // Obtenemos los registros guardados en memoria
  const registros = JSON.parse(localStorage.getItem("misRegistros")) || [];

  // Filtramos todos los registros que coincidan con el documento ingresado
  const resultados = registros.filter((reg) => reg.documento === documentoBuscado);

  // Limpiamos la tabla por si había una búsqueda anterior
  tbody.innerHTML = "";

    if (resultados.length === 0) {
    contenedorTabla.style.display = "none";
    divMensaje.textContent = "❌ No se encontraron registros con ese documento.";
    divMensaje.style.color = "red";
    return;
  }

  // Si hay resultados, limpiamos mensajes de error y mostramos la tabla
  divMensaje.textContent = "";
  contenedorTabla.style.display = "block";

  // Creamos una fila <tr> por cada registro encontrado
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
        <button type="button" class="btn-editar" onclick="cargarParaEditar(${reg.id})">Editar</button>
        <button type="button" class="btn-eliminar" onclick="eliminarRegistro(${reg.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

//Funcion para cerrar la tabla de registros encontrados
function cerrarBusquedaIndex() {
  document.getElementById("contenedor-busqueda-index").style.display = "none";
  document.getElementById("tbodyBusquedaIndex").innerHTML = "";
}

//Funcion para cargar datos al formulario para editar
function cargarParaEditar(id) {
  const registros = JSON.parse(localStorage.getItem("misRegistros")) || [];
  // .find() busca el único objeto que tenga exactamente ese ID
  const registro = registros.find((reg) => reg.id === id);

  if (!registro) return;

  // 1. Guardamos el ID en nuestra variable de control
  idEditando = id;

  // 2. Rellenamos los inputs con los datos guardados
  document.getElementById("id").value = registro.documento;
  document.getElementById("estado").value = registro.estado;
  document.getElementById("observaciones").value = registro.observaciones;

  // 3. Cambiamos los textos visuales para que el usuario note que está editando
  document.getElementById("formTitulo").textContent = "Edit Register #" + id;
  document.getElementById("btnEnviar").textContent = "Update Register";
  
  // 4. Llevamos la pantalla hacia arriba (al formulario)
  window.scrollTo({ top: 0, behavior: "smooth" });
}

//Funcion para resetear formulario
function resetearFormulario() {
  idEditando = null; // Volvemos al modo "Crear nuevo"
  document.getElementById("registroForm").reset();
  document.getElementById("formTitulo").textContent = "New Register";
  document.getElementById("btnEnviar").textContent = "Save Register";
}

// Función para eliminar un registro por su ID
function eliminarRegistro(id) {
  // 1. Pedimos confirmación al usuario para evitar borrados por accidente
  const confirmar = confirm(`¿Estás seguro de eliminar el registro #${id}?`);
  if (!confirmar) return;

  // 2. Cargamos los registros actuales desde localStorage
  let registros = JSON.parse(localStorage.getItem("misRegistros")) || [];

  // 3. Filtramos la lista para quedarnos con TODOS los registros EXCEPTO el que tiene ese ID
  registros = registros.filter((reg) => reg.id !== id);

  // 4. Guardamos la nueva lista actualizada en localStorage
  localStorage.setItem("misRegistros", JSON.stringify(registros));

  // 5. Si justo estábamos editando ese registro que se acaba de borrar, reseteamos el formulario
  if (idEditando === id) {
    resetearFormulario();
  }

  // 6. Mostramos un mensaje de confirmación en el formulario
  const divMensaje = document.getElementById("mensaje");
  divMensaje.textContent = "🗑️ Registro eliminado correctamente.";
  divMensaje.style.color = "red";

  setTimeout(() => {
    divMensaje.textContent = "";
  }, 3000);

  // 7. Actualizamos la tabla de búsqueda (si quedan más registros con ese DNI los muestra, si no, la oculta)
  const documentoBuscado = document.getElementById("id").value.trim();
  const quedanResultados = registros.some((reg) => reg.documento === documentoBuscado);

  if (quedanResultados) {
    buscarRegistro(); // Refresca la tabla con los que quedan
  } else {
    cerrarBusquedaIndex(); // Oculta la tabla si ya no queda ninguno para ese documento
  }
  actualizarContadorHoraActual();
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

  // Función corregida para contar cuántos registros llevas en la hora en curso
function actualizarContadorHoraActual() {
  const registros = JSON.parse(localStorage.getItem("misRegistros")) || [];
  const ahora = new Date();

  const fechaHoy = ahora.toLocaleDateString();
  const horaActualTexto = ahora
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .replace(/\s+/g, " ");

  // Usamos .at(0) para la hora ("11") y .at(1) para el periodo ("PM")
  const partesActual = horaActualTexto.split(" ");
  const horaActual = partesActual.at(0).split(":").at(0);
  const periodoActual = partesActual.at(1) || "";

  // Actualiza el texto superior de la tarjeta (ej. "11:00 PM")
  document.getElementById("rangoHoraActual").textContent = `${horaActual}:00 ${periodoActual}`.trim();

  // Cuenta los registros de HOY y de esta misma HORA y periodo (AM/PM)
  const totalEstaHora = registros.filter((reg) => {
    if (reg.fecha !== fechaHoy) return false;

    const partesReg = reg.hora.replace(/\s+/g, " ").split(" ");
    const regHora = partesReg.at(0).split(":").at(0);
    const regPeriodo = partesReg.at(1) || "";

    return regHora === horaActual && regPeriodo === periodoActual;
  }).length;

  // Actualiza el número en la tarjeta
  document.getElementById("contadorHoraActual").textContent = totalEstaHora;
}

