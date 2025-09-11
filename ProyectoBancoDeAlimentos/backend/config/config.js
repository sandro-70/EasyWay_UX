// backend/config/config.js
require('dotenv').config(); // Carga variables de entorno

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret'
};

module.exports = {
  db: {
    user: process.env.DB_USER || 'usuario',
    password: process.env.DB_PASSWORD || 'contraseña_segura',
    database: process.env.DB_NAME || 'banco_alimentos',
    host: process.env.DB_HOST || 'database',
    dialect: 'postgres' 
  }
};