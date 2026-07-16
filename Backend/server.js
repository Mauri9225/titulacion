const app = require('./src/app');

const { checkConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const db = await checkConnection();

    console.log('====================================');
    console.log('✅ Conectado correctamente a PostgreSQL');
    console.log(`📅 Base de datos disponible desde: ${db.connected_at}`);
    console.log('====================================');

    app.listen(PORT, () => {
      console.log('====================================');
      console.log(`🚀 Electri-Incom iniciado`);
      console.log(`🌐 Puerto: ${PORT}`);
      console.log('====================================');
    });
  } catch (error) {
    console.error('====================================');
    console.error('❌ Error al conectar con PostgreSQL');
    console.error(error.message);
    console.error('====================================');

    process.exit(1);
  }
}

startServer();

const { startCashCloseScheduler } = require('./src/services/cashCloseScheduler.service');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  startCashCloseScheduler();
});

