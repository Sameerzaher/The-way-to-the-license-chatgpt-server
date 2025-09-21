const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// נתיבים להתראות
router.get('/:userId', notificationController.getNotifications);
router.get('/:userId/settings', notificationController.getNotificationSettings);
router.get('/:userId/history', notificationController.getNotificationHistory);
router.get('/:userId/test', notificationController.sendTestNotification);

// עדכון הגדרות התראות
router.put('/:userId/settings', notificationController.updateNotificationSettings);

module.exports = router;
