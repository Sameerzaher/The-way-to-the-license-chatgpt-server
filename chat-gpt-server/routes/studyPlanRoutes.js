const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlanController');

// קבלת כל התוכניות הזמינות
router.get('/plans', studyPlanController.getAvailablePlans);

// קבלת תוכנית ספציפית
router.get('/plans/:planId', studyPlanController.getStudyPlan);

// יצירת תוכנית לימוד אישית למשתמש
router.post('/users/:userId/plans', studyPlanController.createUserStudyPlan);

// קבלת תוכנית הלימוד של משתמש
router.get('/users/:userId/plan', studyPlanController.getUserStudyPlan);

// עדכון תוכנית לימוד קיימת
router.put('/users/:userId/plan', studyPlanController.updateUserStudyPlan);

// עדכון התקדמות בתוכנית הלימוד
router.put('/users/:userId/progress', studyPlanController.updateStudyPlanProgress);

// קבלת המשימה היומית
router.get('/users/:userId/daily-task', studyPlanController.getDailyTask);

// עדכון התקדמות המשימה היומית
router.put('/users/:userId/daily-task', studyPlanController.updateDailyTaskProgress);

// יצירת תוכנית מותאמת אישית
router.post('/users/:userId/custom-plan', studyPlanController.createCustomStudyPlan);

// קבלת סטטיסטיקות תוכנית הלימוד
router.get('/users/:userId/stats', studyPlanController.getStudyPlanStats);

module.exports = router;
