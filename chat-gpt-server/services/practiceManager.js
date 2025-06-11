const path = require("path");
const fs = require("fs");

// טעינה של קבצים לפי תחום
function loadQuestionsForField(field) {
  const fileName =
    field === "psychology"
      ? "psychology_questions.json"
      : "gov_theory_questions_full.json";
  const raw = fs.readFileSync(path.join(__dirname, `../data/${fileName}`), "utf8");
  return JSON.parse(raw);
}

const allQuestionsMap = {
  theory: loadQuestionsForField("theory"),
  psychology: loadQuestionsForField("psychology"),
};

const sessions = new Map();
const options = ["א", "ב", "ג", "ד"];

function initSession(userId) {
  const session = {
    phase: "awaiting_topic",
    field: "theory", // ברירת מחדל – ניתן לשנות בתחילת התרגול
    topic: null,
    count: null,
    explainMode: null,
    current: 0,
    correct: 0,
    answersLog: [],
    questions: [],
  };
  sessions.set(userId, session);
  return session;
}

function getSession(userId) {
  return sessions.get(userId) || initSession(userId);
}

function resetSession(userId) {
  sessions.delete(userId);
}

function selectQuestions(field, topic, count) {
  const allQuestions = allQuestionsMap[field] || [];
  if (!topic || topic === "כללי") {
    return [...allQuestions].sort(() => Math.random() - 0.5).slice(0, count);
  }

  const words = topic.toLowerCase().split(/[ ,–-]+/);
  const filtered = allQuestions.filter(q => {
    const subject = (q.subject || "").toLowerCase();
    const subSubject = (q.subSubject || "").toLowerCase();
    return words.some(word =>
      subject.includes(word) || subSubject.includes(word)
    );
  });

  console.log(`🔍 [${field}] נושא שנבחר:`, topic, "→ נמצאו", filtered.length, "שאלות");

  return filtered.sort(() => Math.random() - 0.5).slice(0, count);
}

function formatQuestion(q, index = null) {
  if (!q || !q.answers || q.answers.length !== 4) {
    return "❌ שגיאה: השאלה אינה תקינה או חסרות תשובות.";
  }

  const prefix = index !== null ? `שאלה ${index + 1} (שאלה #${q.id || "?"}):\n` : "";
  const answersText = q.answers.map((a, i) => `${options[i]}. ${a}`).join("\n");
  return `${prefix}${q.question}\n\n${answersText}`;
}

function processUserMessage(userId, message) {
  const session = getSession(userId);
  const trimmed = message.trim();

  // זיהוי תחום שנבחר - רק בתחילת סשן
  if (session.phase === "awaiting_topic" && ["theory", "psychology"].includes(trimmed)) {
    session.field = trimmed;
    return { response: "🔍 באיזה נושא תרצה לתרגל?" };
  }

  const numberMatch = trimmed.match(/\d+/);
  const topicMatch = trimmed.replace(/\d+/g, '').trim();

  if (session.phase === "awaiting_topic") {
    if (numberMatch && topicMatch) {
      session.topic = topicMatch;
      session.count = Math.min(parseInt(numberMatch[0]), 20);
      session.phase = "awaiting_mode";
      return {
        response: "📝 האם תרצה לקבל הסבר אחרי כל שאלה, או רק בסוף כל הסדרה?"
      };
    }
    session.topic = trimmed;
    session.phase = "awaiting_count";
    return { response: "🔢 כמה שאלות תרצה?" };
  }

  if (session.phase === "awaiting_count") {
    const count = parseInt(trimmed);
    if (!isNaN(count)) {
      session.count = Math.min(count, 20);
      session.phase = "awaiting_mode";
      return {
        response: "📝 האם תרצה לקבל הסבר אחרי כל שאלה, או רק בסוף כל הסדרה?"
      };
    } else {
      return { response: "❗ לא הבנתי כמה שאלות תרצה. כתוב מספר בלבד." };
    }
  }

  if (session.phase === "awaiting_mode") {
    session.explainMode = trimmed.includes("כל שאלה") ? "perQuestion" : "atEnd";

    const selected = selectQuestions(session.field, session.topic, session.count);
    if (!selected || selected.length === 0) {
      return { response: `❗ לא נמצאו שאלות בנושא "${session.topic}". נסה נושא אחר.` };
    }

    session.questions = selected;
    session.phase = "in_practice";
    const q = session.questions[0];
    return {
      response: `📘 התחלת תרגול (${session.field}):\n\n${formatQuestion(q, 0)}\n\nענה עם א / ב / ג / ד`,
      image: q.image || null,
    };
  }

  return null;
}

function processAnswer(userId, selectedLetter) {
  const session = getSession(userId);
  if (session.phase !== "in_practice") return null;

  if (session.current >= session.questions.length) {
    session.phase = "finished";
    return { response: "כבר ענית על כל השאלות. התרגול הסתיים!" };
  }

  const selectedIdx = options.indexOf(selectedLetter);
  if (selectedIdx === -1) {
    return { response: "יש לבחור באחת האותיות: א / ב / ג / ד" };
  }

  const q = session.questions[session.current];
  const isCorrect = selectedIdx === q.correctAnswerIndex;

  const correctLetter = options[q.correctAnswerIndex] || "?";
  const correctText = q.answers[q.correctAnswerIndex] || "לא קיימת תשובה תקינה";
  const explanation = q.explanation || correctText;

  session.answersLog.push({
    question: q.question,
    selected: selectedIdx,
    correctIdx: q.correctAnswerIndex,
    explain: explanation,
  });

  if (isCorrect) session.correct++;
  session.current++;

  const finished = session.current >= session.count;

  if (session.explainMode === "perQuestion") {
    const feedback = isCorrect
      ? `✅ תשובה נכונה!`
      : `❌ תשובה שגויה.\nהתשובה הנכונה היא: ${correctLetter}\nהסבר: ${explanation}`;

    if (finished) {
      resetSession(userId);
      return {
        response: `${feedback}\n\n🎓 סיימת תרגול!\nנכונות: ${session.correct}/${session.count}\nכל הכבוד על ההשתתפות! 🎉`
      };
    }

    const next = session.questions[session.current];
    return {
      response: `${feedback}\n\n${formatQuestion(next, session.current)}`,
      image: next.image || null,
    };
  }

  if (!finished) {
    const next = session.questions[session.current];
    return {
      response: `${formatQuestion(next, session.current)}`,
      image: next.image || null,
    };
  }

  session.phase = "finished";

  let summary = `🎓 סיימת תרגול!\nנכונות: ${session.correct}/${session.count}\n\n`;

  session.answersLog.forEach((entry, idx) => {
    const status = entry.selected === entry.correctIdx ? "✅" : "❌";
    const letter = options[entry.correctIdx] || "?";
    summary += `${status} שאלה ${idx + 1}:\n${entry.question}\nהתשובה שלך: ${options[entry.selected]}\nהתשובה הנכונה: ${letter}\n${entry.explain ? "הסבר: " + entry.explain : ""}\n\n`;
  });

  summary += "כל הכבוד על ההשתתפות! 🎉\n\nתרצה לתרגל שוב? תוכל לבחור תחום ונושא חדש.";

  resetSession(userId);
  return { response: summary };
}

module.exports = {
  processUserMessage,
  processAnswer,
  getSession,
};
 