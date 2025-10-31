const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const controller = require('../controllers/students.controller');

const router = Router();

// Admin only
router.get('/', authenticate, authorize(['Admin']), controller.listStudents);
router.get('/:id', authenticate, authorize(['Admin']), controller.getStudentById);
router.post('/', authenticate, authorize(['Admin']), controller.createStudent);
router.put('/:id', authenticate, authorize(['Admin']), controller.updateStudent);
router.delete('/:id', authenticate, authorize(['Admin']), controller.deleteStudent);

module.exports = router;
