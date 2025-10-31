const { Router } = require('express');
const controller = require('../controllers/expert.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.me);

// Example expert-only route
router.get('/dashboard', authenticate, authorize(['Admin']), (req, res) => {
	res.json({ message: 'Expert dashboard' });
});

module.exports = router;
