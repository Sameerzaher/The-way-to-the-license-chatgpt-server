const express = require("express");
const router = express.Router();
const controller = require("../controllers/practiceController");

router.post("/start", controller.startPractice);
router.post("/answer", controller.answerQuestion);
router.post("/reset", controller.resetPractice);

module.exports = router;
