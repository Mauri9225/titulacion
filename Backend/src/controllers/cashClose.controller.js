const cashCloseService = require('../services/cashClose.service');

async function getTodaySummary(req, res, next) {
  try {
    res.json(await cashCloseService.getTodaySummary(req.user));
  } catch (error) {
    next(error);
  }
}

async function createCashClose(req, res, next) {
  try {
    console.log('createCashClose payload:', req.body);
    const cashClose = await cashCloseService.create(req.body, req.user);
    res.status(201).json(cashClose);
  } catch (error) {
    next(error);
  }
}

async function listCashReports(req, res, next) {
  try {
    res.json(await cashCloseService.listReports());
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCashClose,
  getTodaySummary,
  listCashReports,
};
