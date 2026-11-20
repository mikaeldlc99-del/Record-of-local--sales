// 1. Importamos mysql2 (en su versión con promesas) y dotenv para leer el archivo .env
const mysql = require("mysql2/promise");
require("dotenv").config();

// 2. Creamos un "pool" (grupo) de conexiones usando los datos de tu archivo .env
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// 3. Probamos inmediatamente si la conexión funciona al iniciar
pool.getConnection()
  .then((connection) => {
    console.log("✅ Conectado exitosamente a la base de datos MySQL (ventas_db)");
    connection.release(); // Liberamos la conexión de prueba para que quede disponible
  })
  .catch((error) => {
    console.error("❌ Error al conectar con MySQL:", error.message);
  });

// 4. Exportamos el pool para usarlo en nuestras rutas del servidor
module.exports = pool;
