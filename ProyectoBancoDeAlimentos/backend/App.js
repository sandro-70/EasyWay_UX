// app.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const routes = require('./routes/routes');
const uploadRoutes = require('./routes/uploads'); // 👈 importa tus rutas de subida
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(cookieParser());
app.use(express.json());

/* === Archivos estáticos (antes de 404) === */
const path = require("path");
app.use("/api/images", express.static(path.resolve(__dirname, "public", "images"))); // ✅ /api/images/...
// (opcional mantener ambas)
app.use("/images",     express.static(path.resolve(__dirname, "public", "images")));
app.use(express.static(path.resolve(__dirname, "public")));

/* === Rutas de API === */
app.use('/api', routes);

// Healthcheck
app.get('/', (req, res) => res.send('API funcionando correctamente'));

// 404 y errores
app.use((req, res) => res.status(404).json({ message: 'No encontrado' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno' });
});