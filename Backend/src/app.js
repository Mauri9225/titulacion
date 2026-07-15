const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');

const app = express();
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['http://127.0.0.1:5173', 'http://localhost:5173'];

app.use(
  cors({
    origin(origin, callback) {
      // Permite herramientas como Postman y peticiones sin Origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origen no permitido por CORS'));
    },
  }),
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Electri-Incom funcionando correctamente' });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Error interno del servidor',
  });
});

module.exports = app;
