const workOrderService = require('../services/workOrder.service');

async function listWorkOrders(req, res, next) {
  try {
    res.json(await workOrderService.list(req.query));
  } catch (error) {
    next(error);
  }
}

async function getWorkOrder(req, res, next) {
  try {
    const order = await workOrderService.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Orden de trabajo no encontrada' });
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

async function createWorkOrder(req, res, next) {
  try {
    const order = await workOrderService.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const order = await workOrderService.updateStatus(req.params.id, req.body);

    if (!order) {
      return res.status(404).json({ message: 'Orden de trabajo no encontrada' });
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createWorkOrder,
  getWorkOrder,
  listWorkOrders,
  updateStatus,
};
