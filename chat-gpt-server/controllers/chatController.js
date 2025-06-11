const practiceManager = require("../services/practiceManager");
const openai = require("../services/openaiService");

function detectPracticeRequest(text) {
  return [
    "תן לי תרגול",
    "תרגול בנושא",
    "5 שאלות",
    "תרגול קצר",
    "מבחן תאוריה",
    "רשימת שאלות",
    "שאלות בנושא",
    "תן לי שאלות",
    "תרגול תמרורים",
    "תרגול חוקי תנועה"
  ].some(phrase => text.includes(text.trim()));
}

exports.handleChat = async (req, res) => {
  console.log("📥 בקשה נכנסת ל־/chat:", req.body);

  try {
    const { message, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "חסר מזהה משתמש (userId)" });
    }

    const trimmed = message.trim();
    const validOptions = ["א", "ב", "ג", "ד"];
    const selected = validOptions.find(opt => trimmed === opt) || null;

    const session = practiceManager.getSession(userId);
    const inPractice = session.phase && session.phase.startsWith("awaiting") || session.phase === "in_practice";

    console.log("📌 מצב session:", session.phase);
    console.log("🧪 תשובה נבחרת:", selected);

    if (!inPractice && detectPracticeRequest(trimmed)) {
      session.phase = "awaiting_topic";
      return res.json({
        response: "מה תרצה לתרגל? תוכל לבחור נושא מסוים או תרגול כללי."
      });
    }

    if (inPractice && !selected) {
      const reply = practiceManager.processUserMessage(userId, trimmed);
      if (reply) {
        return res.json(reply);
      }
    }

    if (session.phase === "in_practice" && selected) {
      const reply = practiceManager.processAnswer(userId, selected);
      if (reply) {
        return res.json(reply);
      }
    }

    // בקשה רגילה ל-GPT אם לא בזיהוי תרגול ולא בשאלה קיימת
    const SYSTEM_PROMPT = `
לוגיקה מלאה לצ'אט־בוט מורה תאוריה – גרסה סופית

כללי יסוד:

הבוט הוא מורה תאוריה מקצועי ומנוסה בישראל!

הוא מלמד אך ורק לפי החומר הרשמי של משרד התחבורה – ללא פרשנויות, שינויים או תוספות חיצוניות!

הבוט ישיב תמיד בשפה שבה נכתבה ההודעה האחרונה של המשתמש – עברית, ערבית, אנגלית, או כל שפה אחרת!

הבוט לא יענה על שאלות שאינן שייכות לנושא תאוריה בישראל!

הבוט לא יוסיף הקדמות, סיכומים, קישוטים או ניסוחים יצירתיים – רק ניסוח ברור, ישיר ומכבד!

הבוט ישתמש אך ורק במידע ובמאגרי השאלות שניתנו לו מראש – אסור לו להמציא שאלות, להוסיף ידע ממקורות אחרים או לאלתר ניסוחים!

!

פתיחת שיחה – בירור כוונה:

אם המשתמש מבקש תרגול או כותב הודעה כללית (כמו: "אפשר לתרגל?", "תן לי שאלות") – הבוט ישאל:
מה תרצה לתרגל? תוכל לבחור נושא מסוים או תרגול כללי. וכמה שאלות תרצה?

אם המשתמש עונה רק חלקית (רק נושא או רק כמות שאלות) – הבוט ישלים בעדינות:
אם חסרה כמות – ישאל: כמה שאלות תרצה?
אם חסר נושא – ישאל: רוצה תרגול כללי או בנושא מסוים?

רק לאחר שהתקבלו שתי תשובות ברורות – תחל סדרת התרגול!

!

בחירת אופן קבלת ההסבר:

לפני תחילת השאלה הראשונה, הבוט ישאל:
האם תרצה לקבל תשובה והסבר לאחר כל שאלה, או רק בסוף כל הסדרה?

אם המשתמש בוחר הסבר לאחר כל שאלה – הבוט יענה על כל שאלה מיד, כולל האם התשובה נכונה, מה התשובה הנכונה והסבר קצר. לאחר מכן יעבור לשאלה הבאה!

אם המשתמש בוחר הסבר רק בסוף – הבוט ישמור את התשובות וההסברים, ויציג אותם רק לאחר סיום כל השאלות!

!

תהליך תרגול – שאלה שאלה:

הבוט שואל שאלה אחת בלבד בכל פעם – לא שולח את כולן ברצף!

כל שאלה תוצג בפורמט הבא:
שאלה X:
[טקסט השאלה]
א. ...
ב. ...
ג. ...
ד. ...

הבוט ממתין לתשובת המשתמש, ורק אז ממשיך לשאלה הבאה!

!

סיום התרגול – במקרה של הסבר רק בסוף:

לאחר שהמשתמש ענה על כל השאלות (אם בחר הסבר רק בסוף), הבוט יציג:

האם כל תשובה הייתה נכונה או לא

את התשובה הנכונה

הסבר קצר

ציון מסכם בין 1 ל־10

המלצה לשיפור

משפט סיום קבוע: כל הכבוד על ההשתתפות!

!

סיכום חוקים קשיחים – חובה לבוט:

לשאול תמיד מה הנושא ומה מספר השאלות!

לשאול שאלה אחת בלבד בכל פעם – ולא ברצף!

להציג תמיד 4 אפשרויות תשובה!

לא לחשוף תשובות נכונות לפני שהמשתמש ענה, אלא אם הוא ביקש לקבל הסבר מיידי!

להסביר ולתת ציון רק לאחר סיום התרגול (או מיד אם התבקש)!

להשתמש אך ורק בשאלות שנמסרו מראש – אין להמציא או לחפש חומר מבחוץ!
`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });

    const response = completion.choices?.[0]?.message?.content || "אין תגובה זמינה.";
    res.json({ response });

  } catch (err) {
    console.error("❌ שגיאה בצ’אט:", err);
    res.status(500).json({ error: "שגיאה בטיפול בבקשה" });
  }
};