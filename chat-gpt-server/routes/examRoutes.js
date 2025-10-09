const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// יצירת בחינה חדשה
router.post('/create', examController.createExam);

// שמירת תשובה לשאלה בבחינה
router.post('/:examId/answer', examController.submitAnswer);

// סיום בחינה וקבלת תוצאות
router.post('/:examId/complete', examController.completeExam);

// קבלת כל הבחינות של משתמש
router.get('/user/:userId', examController.getUserExams);

// קבלת בחינה ספציפית
router.get('/:examId', examController.getExam);

// קבלת התקדמות בבחינה
router.get('/:examId/progress', examController.getExamProgress);

// קבלת סטטיסטיקות בחינות
router.get('/user/:userId/statistics', examController.getExamStatistics);

// מחיקת בחינה (רק בחינות שלא הושלמו)
router.delete('/:examId', examController.deleteExam);

// קבלת הישגי משתמש
router.get('/user/:userId/achievements', examController.getUserAchievements);

// יצירת דוח PDF לבחינה
router.post('/:examId/pdf', examController.generateExamPDF);

// יצירת תעודת הצלחה
router.post('/:examId/certificate', examController.generateCertificatePDF);

// שמירת PDF לשרת
router.post('/:examId/save-pdf', examController.saveExamPDF);

module.exports = router;

