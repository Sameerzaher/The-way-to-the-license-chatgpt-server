const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// נתיבים לדשבורד
router.get('/:userId', dashboardController.getDashboardData);
router.get('/:userId/statistics', dashboardController.getStatistics);
router.get('/:userId/progress-by-category', dashboardController.getProgressByCategory);
router.get('/:userId/recent-activity', dashboardController.getRecentActivity);
router.get('/:userId/goals', dashboardController.getGoals);
router.get('/:userId/trends', dashboardController.getTrends);
router.get('/:userId/achievements', dashboardController.getAchievements);

// עדכון מטרות
router.put('/:userId/goals', dashboardController.updateGoals);

module.exports = router;
