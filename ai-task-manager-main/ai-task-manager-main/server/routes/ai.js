const express = require('express');
const router = express.Router();
const {
  chat,
  getTaskSuggestions,
  analyzeProductivity,
  getChatHistory,
  clearChatHistory,
  categorizeTask,
  suggestPriority
} = require('../controllers/aiController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Chat routes
router.post('/chat', chat);
router.get('/chat/history', getChatHistory);
router.delete('/chat/history/:sessionId?', clearChatHistory);

// Task AI features
router.post('/suggestions', getTaskSuggestions);
router.post('/categorize', categorizeTask);
router.post('/priority', suggestPriority);

// Analytics
router.get('/analyze', analyzeProductivity);

module.exports = router;