const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

// Get user progress
router.get('/', auth, progressController.getProgress);

// Get progress statistics
router.get('/stats', auth, progressController.getStats);

// Get progress by category
router.get('/categories', auth, progressController.getCategories);

// Update user progress
router.post('/update', auth, progressController.updateProgress);

// Update progress by category
router.post('/update-category', auth, progressController.updateCategory);

// Save answered question
router.post('/answer-question', auth, progressController.answerQuestion);

// Save answered practice
router.post('/answer-practice', auth, progressController.answerPractice);

module.exports = router; 