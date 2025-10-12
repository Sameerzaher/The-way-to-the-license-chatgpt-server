const practiceManager = require("../services/practiceManager");
const openai = require("../services/openaiService");
const { questions } = require("../index.js");
const { getUserProgress, saveProgress } = require("../services/userProgressFileService");

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

const userHistories = new Map();
const userCurrentQuestions = new Map(); // Store current questions for each user

const MAX_MESSAGES = 80;

// Function to detect if user's message is an answer (א, ב, ג, ד)
function detectAnswer(text) {
  const trimmed = text.trim();
  const validAnswers = ["א", "ב", "ג", "ד"];
  return validAnswers.includes(trimmed);
}

// Function to save user's answer progress
function saveUserAnswer(userId, questionId, userAnswer, isCorrect, responseTime = 0) {
  try {
    const userProgress = getUserProgress(userId);
    
    // Check if this question was already answered
    const existingAnswer = userProgress.completedQuestions.find(
      q => q.questionId === questionId
    );
    
    if (existingAnswer) {
      // Update existing answer
      existingAnswer.answer = userAnswer;
      existingAnswer.isCorrect = isCorrect;
      existingAnswer.answeredAt = new Date().toISOString();
      existingAnswer.responseTime = responseTime;
      existingAnswer.attempts = (existingAnswer.attempts || 1) + 1;
    } else {
      // Add new answer
      userProgress.completedQuestions.push({
        questionId: questionId,
        answer: userAnswer,
        isCorrect: isCorrect,
        answeredAt: new Date().toISOString(),
        responseTime: responseTime,
        attempts: 1,
        userNote: "",
        hintUsed: false
      });
    }
    
    // Update last activity
    userProgress.lastActivity = Date.now();
    
    // Save progress
    saveProgress(userProgress);
    
    return true;
  } catch (error) {
    console.error("Error saving user answer:", error);
    return false;
  }
}

// Function to get answer status for a question
function getQuestionAnswerStatus(userId, questionId) {
  try {
    const userProgress = getUserProgress(userId);
    const existingAnswer = userProgress.completedQuestions.find(
      q => q.questionId === questionId
    );
    
    if (!existingAnswer) {
      return { status: "not_answered", answer: null, isCorrect: null };
    }
    
    return {
      status: existingAnswer.isCorrect ? "correct" : "incorrect",
      answer: existingAnswer.answer,
      isCorrect: existingAnswer.isCorrect,
      attempts: existingAnswer.attempts,
      answeredAt: existingAnswer.answeredAt
    };
  } catch (error) {
    console.error("Error getting question status:", error);
    return { status: "not_answered", answer: null, isCorrect: null };
  }
}

// Function to get user statistics
function getUserStatistics(userId) {
  try {
    const userProgress = getUserProgress(userId);
    const completedQuestions = userProgress.completedQuestions;
    
    const totalAnswered = completedQuestions.length;
    const correctAnswers = completedQuestions.filter(q => q.isCorrect).length;
    const incorrectAnswers = totalAnswered - correctAnswers;
    const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    
    // Statistics by category
    const categoryStats = {};
    completedQuestions.forEach(q => {
      // Find question in the questions array to get category
      const question = questions.find(quest => quest.id === q.questionId);
      if (question && question.topic) {
        if (!categoryStats[question.topic]) {
          categoryStats[question.topic] = { total: 0, correct: 0 };
        }
        categoryStats[question.topic].total++;
        if (q.isCorrect) {
          categoryStats[question.topic].correct++;
        }
      }
    });
    
    return {
      totalAnswered,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      categoryStats,
      lastActivity: userProgress.lastActivity
    };
  } catch (error) {
    console.error("Error getting user statistics:", error);
    return {
      totalAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      accuracy: 0,
      categoryStats: {},
      lastActivity: null
    };
  }
}

function get_user_history(userID){
  if(!userHistories.has(userID)){
    const initialHistory = [];
    userHistories.set(userID, initialHistory);
  }
  return userHistories.get(userID);
}

exports.handleChat = async (req, res) => {
  let selectedQuestions = [];
  console.log("📥 בקשה נכנסת ל־/chat:", req.body);
  let question_numbers = undefined;
  let subject_scope = undefined;

  try {
    const { message, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "חסר מזהה משתמש (userId)" });
    }
    let user_history = get_user_history(userId);
    
    const trimmed = message.trim();
    
    // Check if user is answering a question (א, ב, ג, ד)
    if (detectAnswer(trimmed)) {
      const currentQuestions = userCurrentQuestions.get(userId);
      if (currentQuestions && currentQuestions.length > 0) {
        // Find the most recent unanswered question
        let targetQuestion = null;
        for (let i = currentQuestions.length - 1; i >= 0; i--) {
          const questionStatus = getQuestionAnswerStatus(userId, currentQuestions[i].id);
          if (questionStatus.status === "not_answered") {
            targetQuestion = currentQuestions[i];
            break;
          }
        }
        
        if (targetQuestion) {
          // Check if answer is correct
          const correctAnswer = targetQuestion.correct_answer;
          const isCorrect = trimmed === correctAnswer;
          
          // Save the answer
          saveUserAnswer(userId, targetQuestion.id, trimmed, isCorrect);
          
          // Provide feedback
          let feedback = "";
          if (isCorrect) {
            feedback = "✅ נכון! תשובה מצוינת!";
          } else {
            feedback = `❌ לא נכון. התשובה הנכונה היא ${correctAnswer}.`;
            if (targetQuestion.explanation) {
              feedback += ` הסבר: ${targetQuestion.explanation}`;
            }
          }
          
          return res.json({ 
            response: feedback,
            answerStatus: {
              questionId: targetQuestion.id,
              userAnswer: trimmed,
              correctAnswer: correctAnswer,
              isCorrect: isCorrect
            }
          });
        }
      }
    }
    // user_history.push({ role: "user", content: trimmed });
    if (user_history.length > MAX_MESSAGES) {
      user_history.shift();
      user_history.shift();
      user_history.shift();
    }
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
      - Categories: list of numbers from [1, 2, 3, 4], or "none"
      - Number of questions: integer, or "unspecified"

      Return JSON only
      Example:
      {
        "categories": [1, 3],
        "num_questions": "unspecified",
      }
      `
     
      const messages2 = [
        { role: "system", content: cattegory_prompt },
        { role: "user", content: trimmed }
      ];

      const category_response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages:messages2,
      });
      console.log(category_response.choices[0].message.content);
      question_numbers = (JSON.parse(category_response.choices[0].message.content)).num_questions;
      const categories = (JSON.parse(category_response.choices[0].message.content)).categories;
      if(categories.length < 4 && categories.length > 0 && categories != ["none"]){
        subject_scope = "there is some subjects that is mentioned in the query so the user defined a specific subject";
      }
      else{
        subject_scope = "no subjects mentioned you need to ask the user for a subject";
      }
      console.log(question_numbers, subject_scope, categories);
      if(categories.length < 4 && categories.length > 0 && categories[0] !== "none"){
        let questions_related_to_query = choose_questions_according_to_category(categories);
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
          - If the user just gives a topic without specifying number, choose 10 relevant IDs by default.
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
        
        // בדיקה אם התשובה היא JSON תקין
        let selected_ids;
        try {
          selected_ids = JSON.parse(choosing_questions_response.choices[0].message.content);
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          console.log('Response content:', choosing_questions_response.choices[0].message.content);
          // אם יש שגיאה, נשתמש בכמה שאלות ראשונות
          selected_ids = questions_related_to_query.slice(0, 3).map(q => q.id);
        }
        // console.log("after");
        selectedQuestions = questions_related_to_query.filter(q => selected_ids.includes(q.id));
        console.log("selected questions ", selectedQuestions);
        
        // Store current questions for this user
        userCurrentQuestions.set(userId, selectedQuestions);
      }
    };
    let examPrompt = `
      You are an AI assistant.

      We already analyzed the user query and extracted:
      - question_numbers = ${question_numbers}
      - subject_scope = ${subject_scope}

      Always output the exam in a readable text format for humans, never JSON.

      Formatting rules:
      - Number each question: Q1, Q2, Q3...
      - Write the question clearly.
      - Provide four options labeled a), b), c), d).
      - Group by category if categories exist.

      Your task:

      1. If the query is a QUESTION_REQUEST (the user is asking for practice exam questions or theory questions about road laws, signs, safety, or car knowledge):
        - If the selected questions list is empty:
          - First check if the user specified a category (חוקי התנועה, תמרורים, בטיחות, הכרת הרכב). 
            - If no category was specified → ask the user which category they want to train on.  
          - Then check if the user specified a number of questions. 
            - If no number was given → ask the user to specify how many questions they want.  
        - If the selected questions list is NOT empty:
          - Return the exam following these formatting rules:
            - Each exam item must include:
              - id
              - question
              - category
              - 4 options (a, b, c, d)
            - Shuffle the order of the questions randomly.
            - Do not add explanations or extra text.
          - **If the user answers any of the questions**:
            - Check if the answer is correct.
            - If correct → say: “Correct ✅”.
            - If incorrect → say: “Incorrect ❌. The correct answer is [correct option]. Explanation: [short explanation].”

      2. If the query is NOT a QUESTION_REQUEST:
        - Respond as a normal conversation (ignore exam formatting).

      Selected questions (if any):
      ${selectedQuestions && selectedQuestions.length > 0 
        ? JSON.stringify(selectedQuestions, null, 2) 
        : "none"}

      Answer status for current questions:
      ${selectedQuestions && selectedQuestions.length > 0 
        ? selectedQuestions.map(q => {
            const status = getQuestionAnswerStatus(userId, q.id);
            return {
              questionId: q.id,
              status: status.status,
              userAnswer: status.answer,
              isCorrect: status.isCorrect
            };
          }).map(s => `Question ${s.questionId}: ${s.status}${s.userAnswer ? ` (answered: ${s.userAnswer}, correct: ${s.isCorrect})` : ''}`).join('\n')
        : "none"}

      User Request:
      "${trimmed}"
      `;
        user_history.push({ role: "system", content: examPrompt });
        user_history.push({ role: "user", content: trimmed });
        // const messages4 = [
        //   { role: "system", content: examPrompt },
        //   { role: "user", content: trimmed }
        // ];

        const final_response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: user_history
        });
        const exam = final_response.choices[0].message.content;
        user_history.push({ role: "assistant", content: exam });
        // console.log(user_history);
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
    console.error("❌ שגיאה בצ'אט:", err);
    res.status(500).json({ error: "שגיאה בטיפול בבקשה" });
  }
};

// New endpoint to get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "חסר מזהה משתמש (userId)" });
    }
    
    const stats = getUserStatistics(userId);
    res.json(stats);
    
  } catch (err) {
    console.error("❌ שגיאה בקבלת סטטיסטיקות:", err);
    res.status(500).json({ error: "שגיאה בקבלת סטטיסטיקות" });
  }
};

// New endpoint to get answer status for specific questions
exports.getQuestionStatus = async (req, res) => {
  try {
    const { userId, questionId } = req.params;
    
    if (!userId || !questionId) {
      return res.status(400).json({ error: "חסר מזהה משתמש או מזהה שאלה" });
    }
    
    const status = getQuestionAnswerStatus(userId, questionId);
    res.json(status);
    
  } catch (err) {
    console.error("❌ שגיאה בקבלת סטטוס שאלה:", err);
    res.status(500).json({ error: "שגיאה בקבלת סטטוס שאלה" });
  }
};