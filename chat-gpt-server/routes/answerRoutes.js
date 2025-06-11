// routes/answerRoutes.js
const express = require("express");
const router = express.Router();
const { check } = require("../controllers/answerController");

router.post("/check", check);

module.exports = router;
