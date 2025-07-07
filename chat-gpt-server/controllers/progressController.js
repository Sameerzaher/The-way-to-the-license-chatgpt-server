const userProgressFileService = require('../services/userProgressFileService');
const path = require("path");
const { getQuestionsByLang } = require("../models/questionsModel");

const dataDir = path.join(__dirname, "..", "data");
const questions_he = require(path.join(dataDir, "gov_theory_questions_with_sub_topic_final_v68.json"));
const questions_ar = require(path.join(dataDir, "gov_theory_questions_full_arabic_2.json"));

function getPoolByLang(lang) {
  return (lang && lang.toLowerCase() === "ar") ? questions_ar : questions_he;
}

exports.getProgress = (req, res) => {
  let progress = userProgressFileService.findByUserId(req.user.id);
  if (!progress) {
    progress = {
      userId: req.user.id,
      completedQuestions: [],
      completedPractices: [],
      totalScore: 0,
      lastActivity: Date.now(),
      progressByCategory: {},
    };
    userProgressFileService.saveProgress(progress);
  }
  res.json(progress);
};

exports.getStats = (req, res) => {
  let progress = userProgressFileService.findByUserId(req.user.id);
  if (!progress) {
    progress = {
      userId: req.user.id,
      completedQuestions: [],
      completedPractices: [],
      totalScore: 0,
      lastActivity: Date.now(),
      progressByCategory: {},
    };
    userProgressFileService.saveProgress(progress);
  }
  const stats = {
    totalQuestionsCompleted: progress.completedQuestions.length,
    totalPracticesCompleted: progress.completedPractices.length,
    totalScore: progress.totalScore,
    lastActivity: progress.lastActivity
  };
  res.json(stats);
};

exports.getCategories = (req, res) => {
    let progress = userProgressFileService.findByUserId(req.user.id);
    if (!progress) {
      progress = {
        userId: req.user.id,
        completedQuestions: [],
        completedPractices: [],
        totalScore: 0,
        lastActivity: Date.now(),
        progressByCategory: {},
      };
      userProgressFileService.saveProgress(progress);
    }
  
    // Get language from query parameter, default to Hebrew
    const lang = req.query.lang || "he";
    const pool = getQuestionsByLang(lang);
  
    // Build categories progress dynamically
    const categories = {};
    for (const q of pool) {
      if (!categories[q.subject]) categories[q.subject] = { completed: 0, total: 0 };
      categories[q.subject].total += 1;
      if (progress.completedQuestions.find(cq => cq.questionId === q.id && cq.isCorrect)) {
        categories[q.subject].completed += 1;
      }
    }
  
    res.json(categories);
  };
  
exports.updateProgress = (req, res) => {
  const { questionId, practiceId, score } = req.body;
  let progress = userProgressFileService.findByUserId(req.user.id) || {
    userId: req.user.id,
    completedQuestions: [],
    completedPractices: [],
    totalScore: 0,
    lastActivity: Date.now(),
    progressByCategory: {},
  };
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
  userProgressFileService.saveProgress(progress);
  res.json(progress);
};

exports.updateCategory = (req, res) => {
  const { category, completed, total } = req.body;
  if (!category) return res.status(400).json({ message: 'Category is required' });
  let progress = userProgressFileService.findByUserId(req.user.id) || {
    userId: req.user.id,
    completedQuestions: [],
    completedPractices: [],
    totalScore: 0,
    lastActivity: Date.now(),
    progressByCategory: {},
  };
  progress.progressByCategory[category] = {
    completed: completed ?? (progress.progressByCategory[category]?.completed || 0),
    total: total ?? (progress.progressByCategory[category]?.total || 0)
  };
  progress.lastActivity = Date.now();
  userProgressFileService.saveProgress(progress);
  res.json(progress.progressByCategory);
};

exports.answerQuestion = (req, res) => {
  const { questionId, answer, isCorrect } = req.body;
  if (!questionId) return res.status(400).json({ message: 'questionId is required' });
  let progress = userProgressFileService.findByUserId(req.user.id);
  if (!progress) progress = { userId: req.user.id, completedQuestions: [] };
  const existing = progress.completedQuestions.find(q => q.questionId === questionId);
  if (existing) {
    existing.answer = answer;
    existing.isCorrect = isCorrect;
    existing.answeredAt = new Date();
  } else {
    progress.completedQuestions.push({ questionId, answer, isCorrect, answeredAt: new Date() });
  }
  userProgressFileService.saveProgress(progress);
  res.json(progress.completedQuestions);
};

exports.answerPractice = (req, res) => {
  const { practiceId, answer, isCorrect } = req.body;
  if (!practiceId) return res.status(400).json({ message: 'practiceId is required' });
  let progress = userProgressFileService.findByUserId(req.user.id);
  if (!progress) progress = { userId: req.user.id, completedPractices: [] };
  const existing = progress.completedPractices.find(p => p.practiceId === practiceId);
  if (existing) {
    existing.answer = answer;
    existing.isCorrect = isCorrect;
    existing.answeredAt = new Date();
  } else {
    progress.completedPractices.push({ practiceId, answer, isCorrect, answeredAt: new Date() });
  }
  userProgressFileService.saveProgress(progress);
  res.json(progress.completedPractices);
}; 