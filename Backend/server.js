const app = require('./src/app');
const { startCashCloseScheduler } = require('./src/services/cashCloseScheduler.service');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  startCashCloseScheduler();
});
