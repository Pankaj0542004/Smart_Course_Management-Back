const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const controller = require('../controllers/stats.controller');

const router = Router();

// Admin-only stats
router.get('/users', authenticate, authorize(['Admin']), controller.users);

module.exports = router;


