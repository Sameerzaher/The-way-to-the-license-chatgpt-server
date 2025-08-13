const express = require('express');
const router = express.Router();
const pc = require('../controllers/progressController');
const auth = require('../middleware/auth');

// Get user progress
router.get('/', auth, pc.getProgress);

// Get progress statistics
router.get('/stats', auth, pc.getStats);

// Get progress by category
router.get('/categories', auth, pc.getCategories);

// Update user progress
router.post('/update', auth, pc.updateProgress);

// Update progress by category
router.post('/update-category', auth, pc.updateCategory);

// Save answered question
router.post('/answer-question', auth, pc.answerQuestion);

// Save answered practice
router.post('/answer-practice', auth, pc.answerPractice);

router.post('/mark-solved', pc.markQuestionSolved);
router.get('/user-progress', pc.getUserProgress);
router.get('/topic-progress', pc.topicProgress);

module.exports = router; 