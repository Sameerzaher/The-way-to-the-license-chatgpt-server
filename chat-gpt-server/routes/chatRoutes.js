const express = require('express');
const router = express.Router();
const { handleChat, getUserStats, getQuestionStatus } = require('../controllers/chatController');

router.post('/', handleChat);
router.get('/stats/:userId', getUserStats);
router.get('/question-status/:userId/:questionId', getQuestionStatus);

module.exports = router;
