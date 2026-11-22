// 1. Importamos las librerías necesarias y nuestra conexión a MySQL
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db");

// 2. Inicializamos la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Configuramos los "middlewares" (filtros previos)
app.use(cors()); // Permite que tu Frontend se conecte sin bloqueos del navegador
app.use(express.json()); // Permite que el servidor entienda los datos en formato JSON que envíe el formulario

// 4. Ruta de prueba para comprobar que el servidor responde
app.get("/", (req, res) => {
  res.send("🚀 Servidor Backend de Sales-Record funcionando correctamente");
});


// =========================================================
// RUTAS DE LA API PARA REGISTROS (MYSQL)
// =========================================================

// A) OBTENER TODOS LOS REGISTROS (Para reportes, contador de hora y búsqueda)
app.get("/api/registros", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM registros ORDER BY id ASC");
    res.json(rows); // Devuelve la lista de registros en formato JSON
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// B) GUARDAR UN NUEVO REGISTRO (POST)
app.post("/api/registros", async (req, res) => {
  try {
    const { documento, fecha, hora, estado, observaciones } = req.body;
    const sql = "INSERT INTO registros (documento, fecha, hora, estado, observaciones) VALUES (?, ?, ?, ?, ?)";
    
    const [result] = await pool.query(sql, [documento, fecha, hora, estado, observaciones]);
    
    // Devolvemos el registro recién creado con el ID corto generado por MySQL
    res.status(201).json({
      id: result.insertId,
      documento,
      fecha,
      hora,
      estado,
      observaciones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// C) EDITAR UN REGISTRO EXISTENTE POR SU ID (PUT)
app.put("/api/registros/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { documento, estado, observaciones } = req.body;
    const sql = "UPDATE registros SET documento = ?, estado = ?, observaciones = ? WHERE id = ?";

    await pool.query(sql, [documento, estado, observaciones, id]);
    res.json({ mensaje: "Registro actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// D) ELIMINAR UN REGISTRO POR SU ID (DELETE)
app.delete("/api/registros/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM registros WHERE id = ?", [id]);
    res.json({ mensaje: "Registro eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 5. Encendemos el servidor en el puerto 3000
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
