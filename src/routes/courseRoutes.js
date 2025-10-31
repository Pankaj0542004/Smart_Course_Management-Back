const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const controller = require('../controllers/courseController');

const router = Router();

// Aliases per spec
const verifyToken = authenticate;
const isAdmin = authorize(['Admin']);

// Public routes
router.get('/', controller.getAllCourses);
router.get('/active', controller.getActiveCourses);
router.get('/:id', controller.getCourseById);

// Admin-only routes
router.post('/', verifyToken, isAdmin, controller.createCourse);
router.put('/:id', verifyToken, isAdmin, controller.updateCourse);
router.delete('/:id', verifyToken, isAdmin, controller.deleteCourse);
router.get('/:id/students', verifyToken, isAdmin, controller.getCourseStudents);

// Student routes
const isStudent = authorize(['Student']);
router.post('/:id/enroll', verifyToken, isStudent, controller.enrollInCourse);
router.get('/me/enrolled', verifyToken, isStudent, controller.getMyCourses);

module.exports = router;


