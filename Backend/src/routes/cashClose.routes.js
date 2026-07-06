const { Router } = require('express');
const cashCloseController = require('../controllers/cashClose.controller');

const router = Router();

router.get('/today', cashCloseController.getTodaySummary);
router.get('/reports', cashCloseController.listCashReports);
router.post('/', cashCloseController.createCashClose);

module.exports = router;
