const express = require('express');
const router = express.Router();
const aiLearningController = require('../controllers/aiLearningController');

// נתיבים למערכת AI למידה מותאמת אישית
router.get('/:userId/weakness-analysis', aiLearningController.getWeaknessAnalysis);
router.get('/:userId/recommendations', aiLearningController.getQuestionRecommendations);
router.get('/:userId/learning-path', aiLearningController.getLearningPath);
router.get('/:userId/analysis', aiLearningController.getAIAnalysis);

module.exports = router;
