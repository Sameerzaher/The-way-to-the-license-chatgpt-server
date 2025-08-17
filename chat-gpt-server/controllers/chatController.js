const practiceManager = require("../services/practiceManager");
const openai = require("../services/openaiService");
const { questions } = require("../index.js");

// function detectPracticeRequest(text) {
//   return [
//     "תן לי תרגול",
//     "תרגול בנושא",
//     "5 שאלות",
//     "תרגול קצר",
//     "מבחן תאוריה",
//     "רשימת שאלות",
//     "שאלות בנושא",
//     "תן לי שאלות",
//     "תרגול תמרורים",
//     "תרגול חוקי תנועה"
//   ].some(phrase => text.includes(phrase.trim()));
// }

// function detectWelcome(text) {
//   const lowerText = text.toLowerCase();

//   const welcomePhrases = [
//     "hi",
//     "hello",
//     "hey",
//     "שלום",
//     "مرحبا",
//     "היי"
//   ];

//   return welcomePhrases.some(phrase => lowerText.includes(phrase.toLowerCase()));
// }

function getRandomQuestions(category_questions, count) {
  const result = [];
  const usedIndices = new Set();

  while (result.length < count && result.length < category_questions.length) {
    const randomIndex = Math.floor(Math.random() * category_questions.length);
    if (!usedIndices.has(randomIndex)) {
      result.push(category_questions[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }

  return result;
}

const categories_list = [
  "חוקי התנועה",
  "תמרורים",
  "בטיחות",
  "הכרת הרכב"
];

function choose_questions_according_to_category(categories){
  let related_categories = [];
  categories.forEach(element => {
    related_categories.push(categories_list[element-1]);
  });
  console.log("Related categories:", related_categories);
  // console.log(`Loaded ${questions.length} questions`);
  let related_questions = [];
  related_categories.forEach(category=>{
    let category_questions = questions.filter(q => q.topic === category);
    const randomQuestions = getRandomQuestions(category_questions, 15);
    related_questions.push(...randomQuestions);
  });
  console.log(related_questions.length);
  console.log(related_questions[0].id);
  return related_questions;
}

exports.handleChat = async (req, res) => {
  let selectedQuestions = undefined;
  console.log("📥 בקשה נכנסת ל־/chat:", req.body);

  try {
    const { message, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "חסר מזהה משתמש (userId)" });
    }

    const trimmed = message.trim();
    const question_prompt = `
    You are an AI assistant. 
    Your task is to classify the user's message into one of two types:
    1. QUESTION_REQUEST - The user is asking for an exam-style question or a theory question about road laws/signs/driving.
    2. NORMAL - The user is just talking or asking something unrelated to exam questions.

    Rules:
    - Respond ONLY with "QUESTION_REQUEST" or "NORMAL".
    - Do NOT answer the user's question.
    `
    const messages = [
      { role: "system", content: question_prompt },
      { role: "user", content: trimmed }
    ];

    const question_response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages:messages,
    });
    console.log(question_response.choices[0].message.content);
    if (question_response.choices[0].message.content === "QUESTION_REQUEST"){
      cattegory_prompt = `
      You are an AI assistant that classifies the user's request into one or more exam question categories.

      Categories:
      1 - חוקי התנועה
      2 - תמרורים או שלטי הדרכים
      3 - בטיחות
      4 - הכרת הרכב

      Rules:
      - Return only the list of category numbers in square brackets. Example: [1, 3]
      - If no category is related, return "none".
      - Do NOT include any explanation or extra text.
      `
     
      const messages2 = [
        { role: "system", content: cattegory_prompt },
        { role: "user", content: trimmed }
      ];

      const category_response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages:messages2,
      });
      console.log(category_response.choices[0].message.content);
      if(category_response.choices[0].message.content !== "none"){
        let questions_related_to_query = choose_questions_according_to_category(JSON.parse(category_response.choices[0].message.content));
        console.log(questions_related_to_query.length);
        const questionsSummary = questions_related_to_query.map(q => ({ id: q.id, type: q.topic }));
        let choosing_question_prompt = `
          You are an AI assistant that selects exam questions based on the user's request.

          User query: "${trimmed}"

          Instructions:
          - Choose questions that match the user's intent and category.
          - The selection should be RANDOM among the relevant questions, not just from top to bottom.
          - Choose question IDs relevant to the query and the listed topics.
          - If the user asks for "1 question" or "a single question" → return 1 ID.
          - If the user asks for "2" or "3" questions → return exactly that number of IDs.
          - If the user asks for "an exam" or "test" → return 10 random but relevant IDs (or as many as available).
          - If the user just gives a topic without specifying number, choose 5 relevant IDs by default.
          - Respond ONLY with a valid JSON array of numbers (e.g., [12, 34, 56]) and nothing else.
          - Return the list of IDs as a JSON array of strings, e.g., ["1167", "0467", "0611", "1565"].

          Available questions (id, type, snippet):
          ${JSON.stringify(questionsSummary, null, 2)}
        `;

        const messages3 = [
          { role: "system", content: choosing_question_prompt },
          { role: "user", content: trimmed }
        ];

        const choosing_questions_response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages:messages3,
        });
        
        console.log(choosing_questions_response.choices[0].message.content);
        // console.log("before");
        const selected_ids = JSON.parse(choosing_questions_response.choices[0].message.content);
        // console.log("after");
        selectedQuestions = questions_related_to_query.filter(q => selected_ids.includes(q.id));
      }
    };
    let examPrompt = `
      You are an AI assistant. 

      - If the user has provided questions, create a well-formatted exam 
      that the user can read and understands 
      imagine the user is a kid or an old man who doesnt know anything about technology:
        - Each item must include: id, question_text, type, and 4 options (a, b, c, d).
        - Shuffle the order of the questions randomly.
        - Do not add explanations or extra text.
      - If the user has NOT provided questions, just answer normally in human-readable text as you would in a chat.

      Selected questions (if any):
      ${selectedQuestions && selectedQuestions.length > 0 
        ? JSON.stringify(selectedQuestions, null, 2) 
        : "none"}
    `;

        const messages4 = [
          { role: "system", content: examPrompt },
          { role: "user", content: trimmed }
        ];

        const final_response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: messages4
        });
        const exam = final_response.choices[0].message.content;
        console.log(exam);
        res.json({ response: exam });

//     const validOptions = ["א", "ב", "ג", "ד"];
//     const selected = validOptions.find(opt => trimmed === opt) || null;

//     const session = practiceManager.getSession(userId);
//     const inPractice = session.phase && session.phase.startsWith("awaiting") || session.phase === "in_practice";

//     console.log("📌 מצב session:", session.phase);
//     console.log("🧪 תשובה נבחרת:", selected);
//     console.log("request", detectPracticeRequest(trimmed));
//     console.log("in practice", inPractice);

//     if (detectWelcome(trimmed)){
//       console.log("welcome");
//       return res.json({
//         response: "היי, האם אתה רוצה לתרגל שאלות תיאוריתים או פסיכולוגיים היום?"
//       });
//     }

//     if (!inPractice && detectPracticeRequest(trimmed)) {
//       console.log("not pratice with request");
//       session.phase = "awaiting_topic";
//       return res.json({
//         response: "מה תרצה לתרגל? תוכל לבחור נושא מסוים או תרגול כללי."
//       });
//     }

//     if (inPractice && !selected) {
//       console.log("practice without an answer");
//       const reply = practiceManager.processUserMessage(userId, trimmed);
//       if (reply) {
//         return res.json(reply);
//       }
//     }

//     if (session.phase === "in_practice" && selected) {
//       console.log("practice with answer");
//       const reply = practiceManager.processAnswer(userId, selected);
//       if (reply) {
//         return res.json(reply);
//       }
//     }

//     // בקשה רגילה ל-GPT אם לא בזיהוי תרגול ולא בשאלה קיימת
//     const SYSTEM_PROMPT = `
// לוגיקה מלאה לצ'אט־בוט מורה תאוריה – גרסה סופית

// כללי יסוד:

// הבוט הוא מורה תאוריה מקצועי ומנוסה בישראל!

// הוא מלמד אך ורק לפי החומר הרשמי של משרד התחבורה – ללא פרשנויות, שינויים או תוספות חיצוניות!

// הבוט ישיב תמיד בשפה שבה נכתבה ההודעה האחרונה של המשתמש – עברית, ערבית, אנגלית, או כל שפה אחרת!

// הבוט לא יענה על שאלות שאינן שייכות לנושא תאוריה בישראל!

// הבוט לא יוסיף הקדמות, סיכומים, קישוטים או ניסוחים יצירתיים – רק ניסוח ברור, ישיר ומכבד!

// הבוט ישתמש אך ורק במידע ובמאגרי השאלות שניתנו לו מראש – אסור לו להמציא שאלות, להוסיף ידע ממקורות אחרים או לאלתר ניסוחים!

// !

// פתיחת שיחה – בירור כוונה:

// אם המשתמש מבקש תרגול או כותב הודעה כללית (כמו: "אפשר לתרגל?", "תן לי שאלות") – הבוט ישאל:
// מה תרצה לתרגל? תוכל לבחור נושא מסוים או תרגול כללי. וכמה שאלות תרצה?

// אם המשתמש עונה רק חלקית (רק נושא או רק כמות שאלות) – הבוט ישלים בעדינות:
// אם חסרה כמות – ישאל: כמה שאלות תרצה?
// אם חסר נושא – ישאל: רוצה תרגול כללי או בנושא מסוים?

// רק לאחר שהתקבלו שתי תשובות ברורות – תחל סדרת התרגול!

// !

// בחירת אופן קבלת ההסבר:

// לפני תחילת השאלה הראשונה, הבוט ישאל:
// האם תרצה לקבל תשובה והסבר לאחר כל שאלה, או רק בסוף כל הסדרה?

// אם המשתמש בוחר הסבר לאחר כל שאלה – הבוט יענה על כל שאלה מיד, כולל האם התשובה נכונה, מה התשובה הנכונה והסבר קצר. לאחר מכן יעבור לשאלה הבאה!

// אם המשתמש בוחר הסבר רק בסוף – הבוט ישמור את התשובות וההסברים, ויציג אותם רק לאחר סיום כל השאלות!

// !

// תהליך תרגול – שאלה שאלה:

// הבוט שואל שאלה אחת בלבד בכל פעם – לא שולח את כולן ברצף!

// כל שאלה תוצג בפורמט הבא:
// שאלה X:
// [טקסט השאלה]
// א. ...
// ב. ...
// ג. ...
// ד. ...

// הבוט ממתין לתשובת המשתמש, ורק אז ממשיך לשאלה הבאה!

// !

// סיום התרגול – במקרה של הסבר רק בסוף:

// לאחר שהמשתמש ענה על כל השאלות (אם בחר הסבר רק בסוף), הבוט יציג:

// האם כל תשובה הייתה נכונה או לא

// את התשובה הנכונה

// הסבר קצר

// ציון מסכם בין 1 ל־10

// המלצה לשיפור

// משפט סיום קבוע: כל הכבוד על ההשתתפות!

// !

// סיכום חוקים קשיחים – חובה לבוט:

// לשאול תמיד מה הנושא ומה מספר השאלות!

// לשאול שאלה אחת בלבד בכל פעם – ולא ברצף!

// להציג תמיד 4 אפשרויות תשובה!

// לא לחשוף תשובות נכונות לפני שהמשתמש ענה, אלא אם הוא ביקש לקבל הסבר מיידי!

// להסביר ולתת ציון רק לאחר סיום התרגול (או מיד אם התבקש)!

// להשתמש אך ורק בשאלות שנמסרו מראש – אין להמציא או לחפש חומר מבחוץ!
// `;

//     const messages = [
//       { role: "system", content: SYSTEM_PROMPT },
//       { role: "user", content: message }
//     ];

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages,
//     });

//     const response = completion.choices?.[0]?.message?.content || "אין תגובה זמינה.";
//     res.json({ response });

  } catch (err) {
    console.error("❌ שגיאה בצ’אט:", err);
    res.status(500).json({ error: "שגיאה בטיפול בבקשה" });
  }
};