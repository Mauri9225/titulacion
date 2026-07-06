const { Router } = require('express');
const { checkConnection } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const authRoutes = require('./auth.routes');
const cashCloseRoutes = require('./cashClose.routes');
const dashboardRoutes = require('./dashboard.routes');
const productRoutes = require('./product.routes');
const saleRoutes = require('./sale.routes');
const userRoutes = require('./user.routes');
const workOrderRoutes = require('./workOrder.routes');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'electri-incom-api' });
});

router.get('/health/db', async (req, res, next) => {
  try {
    const db = await checkConnection();
    res.json({ ok: true, database: 'postgres', connectedAt: db.connected_at });
  } catch (error) {
    next(error);
  }
});

router.use('/auth', authRoutes);

router.use(requireAuth);
router.use('/dashboard', requireRole('admin'), dashboardRoutes);
router.use('/products', productRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/sales', saleRoutes);
router.use('/cash-close', cashCloseRoutes);
router.use('/users', userRoutes);

module.exports = router;
