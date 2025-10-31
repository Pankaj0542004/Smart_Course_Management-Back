const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const authController = require('../controllers/auth.controller');
const courseController = require('../controllers/courseController');

const router = Router();

// Student self profile routes
router.get('/me', authenticate, authorize(['Student']), authController.me);
router.put('/me', authenticate, authorize(['Student']), authController.updateMe);
router.get('/me/course', authenticate, authorize(['Student']), courseController.getMyCourses);

module.exports = router;


