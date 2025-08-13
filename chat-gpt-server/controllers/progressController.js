const userProgressFileService = require('../services/userProgressFileService');
const path = require("path");
const { getQuestionsByLang } = require("../models/questionsModel");
const { getUserProgress, addUserSolvedQuestion, saveProgress } = require('../services/userProgressFileService');
const fs = require('fs');

const dataDir = path.join(__dirname, "..", "data");
const questions_he = require(path.join(dataDir, "gov_theory_questions_with_sub_topic_final_v68.json"));
const questions_ar = require(path.join(dataDir, "gov_theory_questions_full_arabic_2.json"));

function getPoolByLang(lang) {
  return (lang && lang.toLowerCase() === "ar") ? questions_ar : questions_he;
}

exports.getProgress = (req, res) => {
  // Support userId from query string for flexibility (API or direct call)
  const userId = req.query.userId || (req.user && req.user.id);
  if (!userId) return res.status(400).json({ error: 'userId required' });
  let progress = getUserProgress(userId);
  res.json(progress);
};

exports.getStats = (req, res) => {
  let progress = getUserProgress(req.user.id);
  const stats = {
    totalQuestionsCompleted: progress.completedQuestions.length,
    totalPracticesCompleted: progress.completedPractices.length,
    totalScore: progress.totalScore,
    lastActivity: progress.lastActivity
  };
  res.json(stats);
};

exports.getCategories = (req, res) => {
  const userId = req.user.id;
  const userProgress = getUserProgress(userId);

  // Get language from query parameter, default to Hebrew
  const lang = req.query.lang || "he";
  const pool = getQuestionsByLang(lang);

  // Build categories progress dynamically
  const categories = {};
  for (const q of pool) {
    if (!categories[q.subject]) categories[q.subject] = { completed: 0, total: 0 };
    categories[q.subject].total += 1;
    if (userProgress.completedQuestions.includes(q.id)) {
      categories[q.subject].completed += 1;
    }
  }

  res.json(categories);
};

exports.updateProgress = (req, res) => {
  const { questionId, practiceId, score } = req.body;
  let progress = getUserProgress(req.user.id);
  
  if (questionId && !progress.completedQuestions.includes(questionId)) {
    progress.completedQuestions.push(questionId);
  }
  if (practiceId && !progress.completedPractices.includes(practiceId)) {
    progress.completedPractices.push(practiceId);
  }
  if (score) {
    progress.totalScore += score;
  }
  progress.lastActivity = Date.now();
  saveProgress(progress);
  res.json(progress);
};

exports.updateCategory = (req, res) => {
  const { category, completed, total } = req.body;
  if (!category) return res.status(400).json({ message: 'Category is required' });
  let progress = getUserProgress(req.user.id);
  
  progress.progressByCategory[category] = {
    completed: completed ?? (progress.progressByCategory[category]?.completed || 0),
    total: total ?? (progress.progressByCategory[category]?.total || 0)
  };
  progress.lastActivity = Date.now();
  saveProgress(progress);
  res.json(progress.progressByCategory);
};

exports.answerQuestion = (req, res) => {
  const { userId, questionId } = req.body;
  if (!userId || !questionId) return res.status(400).json({ error: 'userId and questionId required' });
  addUserSolvedQuestion(userId, questionId);
  res.json({ success: true });
};

exports.answerPractice = (req, res) => {
  const { practiceId, answer, isCorrect } = req.body;
  if (!practiceId) return res.status(400).json({ message: 'practiceId is required' });
  let progress = getUserProgress(req.user.id);
  
  const existing = progress.completedPractices.find(p => p.practiceId === practiceId);
  if (existing) {
    existing.answer = answer;
    existing.isCorrect = isCorrect;
    existing.answeredAt = new Date();
  } else {
    progress.completedPractices.push({ practiceId, answer, isCorrect, answeredAt: new Date() });
  }
  saveProgress(progress);
  res.json(progress.completedPractices);
};

// Endpoint to mark a question as solved for a user
exports.markQuestionSolved = (req, res) => {
  const { userId, questionId } = req.body;
  if (!userId || !questionId) return res.status(400).json({ error: 'userId and questionId required' });
  addUserSolvedQuestion(userId, questionId);
  res.json({ success: true });
};

// Endpoint to get user progress (solved questions)
exports.getUserProgress = (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const userProgress = getUserProgress(userId);
  res.json({ solved: userProgress.completedQuestions });
};

// Endpoint שמחזיר לכל topic כמה שאלות היוזר פתר וכמה יש סה"כ
exports.topicProgress = (req, res) => {
  const { userId, lang = 'he' } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const userProgress = getUserProgress(userId);
  const pool = getQuestionsByLang(lang);
  const topics = {};
  pool.forEach(q => {
    const topic = q.topic || q.subject;
    if (!topic) return;
    if (!topics[topic]) topics[topic] = { solved: 0, total: 0 };
    topics[topic].total += 1;
    // Compare IDs as strings to avoid type mismatch
    if (
      Array.isArray(userProgress.completedQuestions) &&
      userProgress.completedQuestions.find(cq => String(cq.questionId) === String(q.id))
    ) {
      topics[topic].solved += 1;
    }
  });
  res.json(topics);
}; 

// Save answer and update progress in one call
exports.saveAnswerAndProgress = (req, res) => {
  console.log('--- saveAnswerAndProgress called ---');
  console.log('Request body:', req.body);
  const { userId, questionId, answer, isCorrect, answeredAt, responseTime, attempts, userNote, hintUsed } = req.body;
  if (!userId || !questionId || !answer) {
    console.log('Missing required fields:', { userId, questionId, answer });
    return res.status(400).json({ error: 'userId, questionId, and answer are required' });
  }

  let progress = getUserProgress(userId);
  console.log('Loaded progress for user:', userId, progress);

  // מחק תשובות קודמות לאותה שאלה
  progress.completedQuestions = progress.completedQuestions.filter(
    q => String(q.questionId) !== String(questionId)
  );

  // Always add a new answer object (only one per question)
  progress.completedQuestions.push({
    questionId,
    answer,
    isCorrect,
    answeredAt,
    responseTime,
    attempts,
    userNote,
    hintUsed
  });

  // --- Calculate progressByCategory ---
  const lang = req.body.lang || "he";
  const pool = getQuestionsByLang(lang);
  const categoryMap = {};
  for (const q of pool) {
    const subject = q.subject || q.topic;
    if (!subject) continue;
    if (!categoryMap[subject]) categoryMap[subject] = { completed: 0, total: 0 };
    categoryMap[subject].total += 1;
  }
  for (const cq of progress.completedQuestions) {
    const q = pool.find(q => String(q.id) === String(cq.questionId));
    const subject = q && (q.subject || q.topic);
    if (q && subject && categoryMap[subject]) {
      categoryMap[subject].completed += 1;
    }
  }
  progress.progressByCategory = categoryMap;
  // --- End calculation ---

  progress.lastActivity = Date.now();
  console.log('Progress before save:', progress);
  saveProgress(progress);
  console.log('Progress saved for user:', userId);

  res.json({ success: true, progress });
}; 

exports.getTopicProgress = (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const dataPath = path.join(__dirname, '../data/userProgress.json');
  let userProgress = {};

  try {
    userProgress = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (e) {
    return res.status(500).json({ error: 'Failed to read userProgress.json' });
  }

  // לוגים
  console.log('Looking for userId:', userId, 'in userProgress:', Object.keys(userProgress));

  if (userProgress[userId]) {
    return res.json({ [userId]: userProgress[userId] });
  } else {
    // תמיד להחזיר אובייקט ריק עקבי
    return res.json({
      [userId]: {
        userId,
        completedQuestions: [],
        completedPractices: [],
        totalScore: 0,
        lastActivity: null,
        progressByCategory: {}
      }
    });
  }
}; 