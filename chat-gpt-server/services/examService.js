const fs = require('fs');
const path = require('path');
const { getQuestionsByLang } = require('../models/questionsModel');

const examsPath = path.join(__dirname, '../data/exams.json');

// ייצור ID ייחודי לבחינה
function generateExamId() {
  return `exam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// בחירת שאלות לבחינה
function selectExamQuestions(lang, config, difficulty = 'all') {
  console.log(`🔍 Getting questions for lang: ${lang}`);
  
  try {
    const allQuestions = getQuestionsByLang(lang);
    console.log(`📊 Total questions available: ${allQuestions ? allQuestions.length : 0}`);
    
    if (!allQuestions || allQuestions.length === 0) {
      console.error('❌ No questions available for language:', lang);
      return [];
    }

    // בדיקה שהשאלות תקינות
    const validQuestions = allQuestions.filter(q => 
      q && q.id && q.question && q.answers && Array.isArray(q.answers) && q.answers.length >= 4
    );
    
    console.log(`✅ Valid questions: ${validQuestions.length}/${allQuestions.length}`);
    
    if (validQuestions.length === 0) {
      console.error('❌ No valid questions found');
      return [];
    }

    let selectedQuestions = [];

    // אם יש חלוקה לפי קטגוריות
    if (config.categories) {
      for (const [category, count] of Object.entries(config.categories)) {
        // נרמול שם הקטגוריה
        const categoryCleaned = category.replace(/[«»"׳״'.,\s\-]/g, '').trim().toLowerCase();
        
        // סינון שאלות לפי קטגוריה
        const categoryQuestions = validQuestions.filter(q => {
        const qSubject = (q.subject || q.topic || '').replace(/[«»"׳״'.,\s\-]/g, '').trim().toLowerCase();
        return qSubject.includes(categoryCleaned) || categoryCleaned.includes(qSubject);
      });

      // סינון לפי רמת קושי אם נדרש
      let filteredQuestions = categoryQuestions;
      if (difficulty !== 'all' && difficulty) {
        filteredQuestions = categoryQuestions.filter(q => 
          (q.difficulty || 'medium') === difficulty
        );
        
        // אם אין מספיק שאלות ברמת הקושי המבוקשת, נשתמש בכולן
        if (filteredQuestions.length < count) {
          filteredQuestions = categoryQuestions;
        }
      }

      // בחירה אקראית
      const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);
      
      selectedQuestions.push(...selected);

      console.log(`📊 Category: ${category}, Available: ${categoryQuestions.length}, Selected: ${selected.length}/${count}`);
    }
    } else {
      // בחירה אקראית כללית
      let questionsPool = [...validQuestions];
    
      if (difficulty !== 'all' && difficulty) {
        const filteredByDifficulty = validQuestions.filter(q => 
          (q.difficulty || 'medium') === difficulty
        );
        
        if (filteredByDifficulty.length >= config.questionCount) {
          questionsPool = filteredByDifficulty;
        }
      }

      const shuffled = questionsPool.sort(() => Math.random() - 0.5);
      selectedQuestions = shuffled.slice(0, config.questionCount);
    }

    console.log(`✅ Selected ${selectedQuestions.length} questions for exam`);
    
    return selectedQuestions;
    
  } catch (error) {
    console.error('❌ Error in selectExamQuestions:', error);
    return [];
  }
}

// חישוב ציון בחינה
function calculateExamScore(exam) {
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let unanswered = 0;
  const categoryBreakdown = {};

  exam.questions.forEach((question, index) => {
    const userAnswer = exam.answers.find(a => a.questionId === question.questionId);
    const subject = question.subject || 'אחר';

    // אתחול קטגוריה
    if (!categoryBreakdown[subject]) {
      categoryBreakdown[subject] = {
        total: 0,
        correct: 0,
        wrong: 0,
        unanswered: 0
      };
    }

    categoryBreakdown[subject].total += 1;

    if (!userAnswer) {
      unanswered += 1;
      categoryBreakdown[subject].unanswered += 1;
    } else if (userAnswer.answerIndex === question.correctAnswerIndex) {
      correctAnswers += 1;
      categoryBreakdown[subject].correct += 1;
    } else {
      wrongAnswers += 1;
      categoryBreakdown[subject].wrong += 1;
    }
  });

  const score = correctAnswers;
  const passed = score >= exam.passingScore;
  const accuracy = exam.questionCount > 0 ? 
    Math.round((correctAnswers / exam.questionCount) * 100) : 0;

  return {
    score,
    correctAnswers,
    wrongAnswers,
    unanswered,
    passed,
    accuracy,
    categoryBreakdown
  };
}

// ולידציה של תשובות
function validateExamAnswers(exam) {
  const errors = [];

  if (!exam.answers || exam.answers.length === 0) {
    errors.push('No answers submitted');
  }

  exam.answers.forEach((answer, index) => {
    if (answer.answerIndex < 0 || answer.answerIndex > 3) {
      errors.push(`Invalid answer index at position ${index}`);
    }
    
    const question = exam.questions.find(q => q.questionId === answer.questionId);
    if (!question) {
      errors.push(`Question ${answer.questionId} not found in exam`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// שמירת בחינה לקובץ
function saveExam(exam) {
  try {
    let examsData = {};

    // טעינת בחינות קיימות
    if (fs.existsSync(examsPath)) {
      const fileContent = fs.readFileSync(examsPath, 'utf8');
      examsData = JSON.parse(fileContent);
    }

    // שמירת/עדכון הבחינה
    examsData[exam.examId] = exam;

    // שמירה לקובץ
    fs.writeFileSync(examsPath, JSON.stringify(examsData, null, 2));

    console.log(`💾 Exam saved: ${exam.examId}`);
    return true;

  } catch (error) {
    console.error('Error saving exam:', error);
    return false;
  }
}

// קבלת כל הבחינות של משתמש
function getUserExams(userId) {
  try {
    if (!fs.existsSync(examsPath)) {
      return [];
    }

    const fileContent = fs.readFileSync(examsPath, 'utf8');
    const examsData = JSON.parse(fileContent);

    // סינון בחינות לפי משתמש ומיון לפי תאריך
    const userExams = Object.values(examsData)
      .filter(exam => exam.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return userExams;

  } catch (error) {
    console.error('Error getting user exams:', error);
    return [];
  }
}

// קבלת בחינה לפי ID
function getExamById(examId) {
  try {
    if (!fs.existsSync(examsPath)) {
      return null;
    }

    const fileContent = fs.readFileSync(examsPath, 'utf8');
    const examsData = JSON.parse(fileContent);

    return examsData[examId] || null;

  } catch (error) {
    console.error('Error getting exam by ID:', error);
    return null;
  }
}

// קבלת סטטיסטיקות בחינות למשתמש
function getExamStatistics(userId) {
  const exams = getUserExams(userId);
  const completedExams = exams.filter(e => e.status === 'completed');

  if (completedExams.length === 0) {
    return {
      totalExams: 0,
      passedExams: 0,
      failedExams: 0,
      averageScore: 0,
      averageAccuracy: 0,
      bestScore: 0,
      worstScore: 0,
      totalTimeSpent: 0,
      averageTimeSpent: 0,
      lastExamDate: null,
      examsByType: {},
      recentExams: [],
      progressTrend: []
    };
  }

  const passedExams = completedExams.filter(e => e.passed).length;
  const failedExams = completedExams.filter(e => !e.passed).length;

  const scores = completedExams.map(e => e.score);
  const accuracies = completedExams.map(e => e.accuracy || 0);
  const times = completedExams.map(e => e.timeSpent || 0);

  const averageScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  const averageAccuracy = Math.round(
    accuracies.reduce((a, b) => a + b, 0) / accuracies.length
  );

  const totalTimeSpent = times.reduce((a, b) => a + b, 0);
  const averageTimeSpent = Math.round(totalTimeSpent / times.length);

  // סטטיסטיקות לפי סוג בחינה
  const examsByType = {};
  completedExams.forEach(exam => {
    if (!examsByType[exam.examType]) {
      examsByType[exam.examType] = {
        total: 0,
        passed: 0,
        failed: 0,
        averageScore: 0,
        scores: []
      };
    }
    examsByType[exam.examType].total += 1;
    if (exam.passed) {
      examsByType[exam.examType].passed += 1;
    } else {
      examsByType[exam.examType].failed += 1;
    }
    examsByType[exam.examType].scores.push(exam.score);
  });

  // חישוב ממוצע לכל סוג
  Object.keys(examsByType).forEach(type => {
    const scores = examsByType[type].scores;
    examsByType[type].averageScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
    delete examsByType[type].scores; // לא צריך להחזיר את כל הציונים
  });

  // בחינות אחרונות
  const recentExams = completedExams.slice(0, 10).map(e => ({
    examId: e.examId,
    examType: e.examType,
    score: e.score,
    passed: e.passed,
    accuracy: e.accuracy,
    completedAt: e.endTime
  }));

  // טרנד התקדמות (10 הבחינות האחרונות)
  const progressTrend = completedExams.slice(0, 10).reverse().map((e, index) => ({
    examNumber: index + 1,
    score: e.score,
    passed: e.passed,
    date: e.endTime
  }));

  return {
    totalExams: completedExams.length,
    passedExams,
    failedExams,
    passRate: Math.round((passedExams / completedExams.length) * 100),
    averageScore,
    averageAccuracy,
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    totalTimeSpent,
    averageTimeSpent,
    lastExamDate: completedExams[0].endTime,
    examsByType,
    recentExams,
    progressTrend
  };
}

// קבלת שאלות שגויות מבחינות קודמות (לתרגול ממוקד)
function getWrongQuestionsFromExams(userId, limit = 50) {
  const exams = getUserExams(userId);
  const completedExams = exams.filter(e => e.status === 'completed');

  const wrongQuestions = [];
  const wrongQuestionIds = new Set();

  completedExams.forEach(exam => {
    exam.questions.forEach(question => {
      const userAnswer = exam.answers.find(a => a.questionId === question.questionId);
      
      // אם התשובה שגויה או לא נענתה
      if (!userAnswer || userAnswer.answerIndex !== question.correctAnswerIndex) {
        // מניעת כפילויות
        if (!wrongQuestionIds.has(question.questionId)) {
          wrongQuestionIds.add(question.questionId);
          wrongQuestions.push({
            ...question,
            examType: exam.examType,
            attemptedAt: exam.endTime,
            userAnswer: userAnswer ? userAnswer.answerIndex : null
          });
        }
      }
    });
  });

  return wrongQuestions.slice(0, limit);
}

module.exports = {
  generateExamId,
  selectExamQuestions,
  calculateExamScore,
  validateExamAnswers,
  saveExam,
  getUserExams,
  getExamById,
  getExamStatistics,
  getWrongQuestionsFromExams
};

