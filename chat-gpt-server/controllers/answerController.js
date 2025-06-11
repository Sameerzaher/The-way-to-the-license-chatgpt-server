const { evaluateAnswer } = require("../services/evaluationService");

exports.check = async (req, res) => {
  const { questionId, answer, lang } = req.body;
  console.log("📨 בקשה ל־/answers/check");
  console.log("📥 תוכן הבקשה:", { questionId, answer, lang });

  if (!questionId || !answer) {
    console.warn("⚠️ חסר questionId או answer");
    return res.status(400).json({ error: "Missing questionId or answer" });
  }

  try {
    const feedback = await evaluateAnswer({
      id: questionId,
      studentAnswer: answer.trim(),
      lang: lang === "ar" ? "ar" : "he",
    });

    console.log("✅ פידבק הוחזר:", feedback);
    res.json({ feedback });
  } catch (err) {
    console.error("❌ שגיאה בבדיקת תשובה:", err);
    res.status(500).json({ error: "Evaluation failed" });
  }
};
