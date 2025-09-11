require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const routes = require('./routes/routes'); // <- ./routes/index.js
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

// ✅ Monta TODO lo de routes/index.js en /api
app.use('/api', routes);

// Healthcheck
app.get('/', (req, res) => res.send('API funcionando correctamente'));

// 404 y errores (opcional)
app.use((req, res) => res.status(404).json({ message: 'No encontrado' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno' });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL OK');
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
  }
}
startServer();
