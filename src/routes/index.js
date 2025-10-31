const { Router } = require('express');

const router = Router();

// Example base route
router.get('/', (req, res) => {
	res.json({ message: 'API is running' });
});

router.use('/auth', require('./auth.routes'));
router.use('/expert', require('./expert.routes'));
router.use('/students', require('./students.routes'));
router.use('/stats', require('./stats.routes'));
router.use('/courses', require('./courseRoutes'));
router.use('/', require('./me.routes'));

module.exports = router;
