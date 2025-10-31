const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, authorize(['Student']), controller.me);

// Example role-based dashboards
router.get('/dashboard/student', authenticate, authorize(['Student']), (req, res) => {
	res.json({ message: 'Student dashboard' });
});
router.get('/dashboard/admin', authenticate, authorize(['Admin']), (req, res) => {
	res.json({ message: 'Admin dashboard' });
});

module.exports = router;
