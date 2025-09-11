require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
// Importar los modelos
const db = require("./models"); // ✅ Importa ./models/index.js
console.log("🔍 Modelos cargados:", Object.keys(db));

// Inicializar Express
const app = express();
app.use(cookieParser());
// Middlewares
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());

// Logger personalizado
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Importación de rutas
const routes = require("./routes/routes");
const authRoutes = require("./routes/routesLogin");
const prueba_rutas = require("./routes/prueba");

// Montaje de rutas
app.use("/api", routes);
app.use("/api", authRoutes);
app.use("/prueba", prueba_rutas);

// Manejador de errores
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Conexión y sincronización con la base de datos
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Conexión a la BD establecida");

    // Sincroniza modelos
    await db.sequelize.sync({ alter: true }); // usar { force: true } solo en desarrollo si quieres recrear tablas
    console.log("Modelos sincronizados");
  } catch (error) {
    console.error("Error al conectar/sincronizar:", error);
  }
})();

// Puerto
const PORT = process.env.PORT || 3001;

// Ruta raíz / health-check/ verificacion de puerto
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API backend corriendo" });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

//prueba enviar codigo de confirmacion al correo
const forgetPassword = require("./routes/forgetPassword");
app.use("/", forgetPassword);
