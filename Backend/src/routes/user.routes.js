const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', requireRole('admin'), authController.listUsers);
router.post('/', requireRole('admin'), authController.createUser);
router.patch('/:id/status', requireRole('admin'), authController.updateUserStatus);

module.exports = router;
