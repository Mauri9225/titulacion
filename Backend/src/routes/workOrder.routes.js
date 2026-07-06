const { Router } = require('express');
const workOrderController = require('../controllers/workOrder.controller');

const router = Router();

router.get('/', workOrderController.listWorkOrders);
router.get('/:id', workOrderController.getWorkOrder);
router.post('/', workOrderController.createWorkOrder);
router.patch('/:id/status', workOrderController.updateStatus);

module.exports = router;
