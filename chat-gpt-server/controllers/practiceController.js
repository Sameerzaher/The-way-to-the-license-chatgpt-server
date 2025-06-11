const practiceManager = require("../services/practiceManager");

// התחלת תרגול
exports.startPractice = (req, res) => {
  try {
    const { userId, numQuestions = 10 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const firstQuestion = practiceManager.startPractice(userId, numQuestions);
    res.json({ question: firstQuestion });
  } catch (err) {
    console.error("❌ startPractice error:", err);
    res.status(500).json({ error: "Failed to start practice" });
  }
};

// מענה על שאלה
exports.answerQuestion = (req, res) => {
  try {
    const { userId, selected } = req.body;

    if (!userId || !selected) {
      return res.status(400).json({ error: "userId and selected are required" });
    }

    const result = practiceManager.answerQuestion(userId, selected);

    if (!result) {
      return res.status(404).json({ error: "No practice session found for this user" });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ answerQuestion error:", err);
    res.status(500).json({ error: "Failed to answer question" });
  }
};

// איפוס תרגול
exports.resetPractice = (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    practiceManager.resetPractice(userId);
    res.json({ message: "Practice reset successfully" });
  } catch (err) {
    console.error("❌ resetPractice error:", err);
    res.status(500).json({ error: "Failed to reset practice" });
  }
};
