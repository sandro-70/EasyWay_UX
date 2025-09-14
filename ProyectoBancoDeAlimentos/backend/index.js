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

//Inserciones iniciales en la base de datos

// Insertar
const insertUsuarios = require("./Inserts/InsertUsuarios");
const insertProductos = require("./Inserts/InsertProductos");
const insertMarcas = require("./Inserts/InsertsMarcas");
const insertSubcategorias = require("./Inserts/InsertsSubcategorias");
const insertImagesProducto = require("./Inserts/insertsImagesProducto");
const insertCategorias = require("./Inserts/InsertCategorias");
const insertEstadoPedido = require("./Inserts/InsertEstadoPedido");
const insertSucursales = require("./Inserts/InsertSucursales");
const insertDepartamentosSeed = require("./Inserts/InsertDepartamentos");
const insertMunicipios = require("./Inserts/InsertMunicipios");
const insertCupones = require("./Inserts/InsertCupones");
const insertPedido = require("./Inserts/InsertPedidos");
const insertPromociones = require("./Inserts/InsertPromociones");

// Conexión y sincronización con la base de datos y seeds secuenciales
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Conexión a la BD establecida");

    // Sincroniza modelos y reinicia IDs en desarrollo
    await db.sequelize.sync({ force: true });
    console.log("Modelos sincronizados y tablas reiniciadas");

    // Inserta los seeds en orden correcto
    await insertUsuarios(
      { app: { locals: { db } } },
      {
        status: () => ({ json: (msg) => console.log("Seed usuarios:", msg) }),
      }
    );
    await insertCategorias(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed categorias:", msg),
        }),
      }
    );
    await insertMarcas(
      { app: { locals: { db } } },
      { status: () => ({ json: (msg) => console.log("Seed marcas:", msg) }) }
    );
    await insertSubcategorias(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed subcategorias:", msg),
        }),
      }
    );
    await insertProductos(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed productos:", msg),
        }),
      }
    );
    await insertImagesProducto(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed images productos:", msg),
        }),
      }
    );
    await insertDepartamentosSeed(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed de departamentos:", msg),
        }),
      }
    );
    await insertMunicipios(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed de municipios:", msg),
        }),
      }
    );
    await insertCupones(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed de cupones:", msg),
        }),
      }
    );
    await insertSucursales(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed de sucursales:", msg),
        }),
      }
    );

    await await insertImagesProducto(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed de imagenes:", msg),
        }),
      }
    );
    await insertEstadoPedido(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed de estado de pedido:", msg),
        }),
      }
    );
    await insertPedido(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed de pedidos:", msg),
        }),
      }
    );
    await insertPromociones(
      { app: { locals: { db } } },
      {
        status: () => ({
          json: (msg) => console.log("Seed de promociones:", msg),
        }),
      }
    );

    console.log("Seeds insertados correctamente");
  } catch (error) {
    console.error("Error al conectar/sincronizar o insertar seeds:", error);
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
