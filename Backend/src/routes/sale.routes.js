const { Router } = require('express');
const saleController = require('../controllers/sale.controller');

const router = Router();

router.get('/', saleController.listSales);
router.post('/', saleController.createSale);

module.exports = router;
