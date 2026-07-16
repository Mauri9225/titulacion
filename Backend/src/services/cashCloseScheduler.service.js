const cashCloseService = require('./cashClose.service');

const ECUADOR_TIME_ZONE = 'America/Guayaquil';

function getEcuadorTime() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ECUADOR_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  return Number(parts.find((part) => part.type === 'hour')?.value);
}

async function closeCashAtEndOfDay() {
  if (getEcuadorTime() !== 23) return;

  const summary = await cashCloseService.getTodaySummary();
  if (!summary.openedAt || summary.closedAt) return;

  await cashCloseService.create({
    openingCash: summary.openingCash,
    countedCash: summary.countedCash,
    openedAt: summary.openedAt,
    closedAt: new Date().toISOString(),
    user: summary.user,
  });

  console.log('Caja cerrada automaticamente a las 23:00 (America/Guayaquil).');
}

function startCashCloseScheduler() {
  const run = () => {
    closeCashAtEndOfDay().catch((error) => {
      console.error('No se pudo ejecutar el cierre automatico de caja:', error);
    });
  };

  run();
  return setInterval(run, 60 * 1000);
}

module.exports = {
  closeCashAtEndOfDay,
  startCashCloseScheduler,
};
