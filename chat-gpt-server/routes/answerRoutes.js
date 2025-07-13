// routes/answerRoutes.js
const express = require("express");
const router = express.Router();
const { check } = require("../controllers/answerController");
const { saveAnswerAndProgress } = require("../controllers/progressController");

console.log("answerRoutes loaded");

router.post("/check", check);
router.post("/", (req, res, next) => {
  console.log("POST /answers route hit");
  next();
}, saveAnswerAndProgress);

module.exports = router;
