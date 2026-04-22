const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
  getTasksByCategory,
  getUpcomingTasks,
  getOverdueTasks
} = require('../controllers/taskController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Task CRUD
router.get('/', getTasks);
router.get('/upcoming', getUpcomingTasks);
router.get('/overdue', getOverdueTasks);
router.get('/categories', getTasksByCategory);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/toggle', toggleComplete);

module.exports = router;