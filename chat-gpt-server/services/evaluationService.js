

const { getQuestionById } = require("./questionsService");
const openai = require("./openaiService");

async function evaluateAnswer({ id, studentAnswer, lang }) {
  const q = getQuestionById(id);
  if (!q) throw new Error("Question not found");

  const correctLetter = ["א", "ב", "ג", "ד"][q.correctAnswerIndex];
  const systemPrompt =
    lang === "ar"
      ? "أنت ممتحِن رسمي لامتحان نظرية السياقة باللغة العربية."
      : "אתה בוחן רשמי במבחן תיאוריה לרכב (עברית).";

  const userPrompt = `
שאלה:
${q.question}

תשובות:
${q.answers.map((a, i) => `${["א", "ב", "ג", "ד"][i]}. ${a}`).join("\n")}

תשובת תלמיד: ${studentAnswer}

הנחיות:
- ציין אם התלמיד צדק או טעה.
- אם טעה, כתוב מהי התשובה הנכונה (${correctLetter}) והסבר קצר.
- שמור על שפה ${lang === "ar" ? "ערבית" : "עברית"} פשוטה וברורה.
  `.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return completion.choices?.[0]?.message?.content || "אין תגובה זמינה.";
}

module.exports = { evaluateAnswer };
