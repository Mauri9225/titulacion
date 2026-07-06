const saleService = require('../services/sale.service');

async function listSales(req, res, next) {
  try {
    res.json(await saleService.list());
  } catch (error) {
    next(error);
  }
}

async function createSale(req, res, next) {
  try {
    const sale = await saleService.create(req.body);
    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSale,
  listSales,
};
