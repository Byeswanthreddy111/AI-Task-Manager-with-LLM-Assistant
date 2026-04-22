const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getCompletionTrend,
  getActivityTimeline,
  getProductivityScore,
  getWeeklySummary,
  getTasksByTimeOfDay,
  exportAnalytics
} = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Analytics routes
router.get('/dashboard', getDashboardStats);
router.get('/trend', getCompletionTrend);
router.get('/activity', getActivityTimeline);
router.get('/score', getProductivityScore);
router.get('/weekly', getWeeklySummary);
router.get('/time-distribution', getTasksByTimeOfDay);
router.get('/export', exportAnalytics);

module.exports = router;