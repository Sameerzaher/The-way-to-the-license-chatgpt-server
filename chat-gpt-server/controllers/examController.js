const { getUserProgress, saveProgress } = require('../services/userProgressFileService');
const { getQuestionsByLang } = require('../models/questionsModel');
const {
  generateExamId,
  selectExamQuestions,
  calculateExamScore,
  validateExamAnswers,
  getExamStatistics,
  saveExam,
  getUserExams,
  getExamById
} = require('../services/examService');

// יצירת בחינה חדשה
exports.createExam = (req, res) => {
  try {
    console.log('📝 Creating exam with data:', req.body);
    const { userId, examType, lang = 'he', difficulty = 'all' } = req.body;

    if (!userId) {
      console.error('❌ Missing userId');
      return res.status(400).json({ error: 'userId is required' });
    }

    // הגדרות בחינה
    const EXAM_CONFIG = {
      theory: {
        questionCount: 30,
        duration: 40 * 60 * 1000, // 40 דקות במילישניות
        passingScore: 26, // 26 מתוך 30
        categories: {
          'חוקי התנועה': 10,
          'תמרורים': 8,
          'בטיחות': 7,
          'הכרת הרכב': 5
        }
      },
      psychology: {
        questionCount: 30,
        duration: 40 * 60 * 1000,
        passingScore: 26,
        categories: null // כל הקטגוריות
      },
      quick: {
        questionCount: 15,
        duration: 20 * 60 * 1000, // 20 דקות
        passingScore: 13, // 13 מתוך 15
        categories: null
      },
      practice: {
        questionCount: 10,
        duration: 15 * 60 * 1000, // 15 דקות
        passingScore: 7, // 7 מתוך 10
        categories: null
      }
    };

    const config = EXAM_CONFIG[examType] || EXAM_CONFIG.theory;
    
    // בחירת שאלות לבחינה
    console.log(`🔍 Selecting questions for exam type: ${examType}, lang: ${lang}, difficulty: ${difficulty}`);
    const questions = selectExamQuestions(lang, config, difficulty);
    
    console.log(`📊 Questions selected: ${questions ? questions.length : 0}`);

    if (!questions || questions.length < config.questionCount) {
      console.error(`❌ Not enough questions: ${questions ? questions.length : 0}/${config.questionCount}`);
      return res.status(500).json({ 
        error: 'Not enough questions available',
        available: questions ? questions.length : 0,
        required: config.questionCount,
        examType,
        lang,
        difficulty
      });
    }

    // יצירת אובייקט בחינה
    const exam = {
      examId: generateExamId(),
      userId,
      examType,
      lang,
      difficulty,
      questionCount: config.questionCount,
      questions: questions.map(q => ({
        questionId: q.id,
        question: q.question,
        answers: q.answers,
        image: q.image || null,
        subject: q.subject || q.topic,
        correctAnswerIndex: q.correctAnswerIndex // נשמור לבדיקה בשרת
      })),
      startTime: new Date().toISOString(),
      duration: config.duration,
      passingScore: config.passingScore,
      status: 'in_progress', // in_progress, completed, abandoned
      answers: [], // תשובות המשתמש
      endTime: null,
      score: null,
      passed: null,
      createdAt: new Date().toISOString()
    };

    // שמירת הבחינה
    saveExam(exam);

    // החזרת הבחינה ללא התשובות הנכונות (למניעת רמאות)
    const examForClient = {
      ...exam,
      questions: exam.questions.map(q => ({
        questionId: q.questionId,
        question: q.question,
        answers: q.answers,
        image: q.image,
        subject: q.subject
        // לא שולחים correctAnswerIndex ללקוח
      }))
    };

    console.log(`✅ Exam created: ${exam.examId} for user ${userId}`);
    res.status(201).json(examForClient);

  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

// שמירת תשובה לשאלה בבחינה
exports.submitAnswer = (req, res) => {
  try {
    const { examId } = req.params;
    const { questionId, answerIndex, timeSpent } = req.body;

    if (!examId || questionId === undefined || answerIndex === undefined) {
      return res.status(400).json({ 
        error: 'examId, questionId, and answerIndex are required' 
      });
    }

    // טעינת הבחינה
    const exam = getExamById(examId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.status === 'completed') {
      return res.status(400).json({ error: 'Exam already completed' });
    }

    // בדיקה שהבחינה לא פגה
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const elapsed = now - startTime;

    if (elapsed > exam.duration) {
      exam.status = 'abandoned';
      exam.endTime = new Date(startTime.getTime() + exam.duration).toISOString();
      saveExam(exam);
      return res.status(400).json({ 
        error: 'Exam time expired',
        timeExpired: true 
      });
    }

    // הסרת תשובה קיימת אם יש
    exam.answers = exam.answers.filter(a => a.questionId !== questionId);

    // הוספת התשובה
    exam.answers.push({
      questionId,
      answerIndex,
      timeSpent: timeSpent || 0,
      answeredAt: new Date().toISOString()
    });

    saveExam(exam);

    res.json({ 
      success: true, 
      answersCount: exam.answers.length,
      totalQuestions: exam.questionCount
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// סיום בחינה וחישוב ציון
exports.completeExam = (req, res) => {
  try {
    const { examId } = req.params;

    const exam = getExamById(examId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.status === 'completed') {
      return res.status(400).json({ error: 'Exam already completed' });
    }

    // סימון הבחינה כהושלמה
    exam.status = 'completed';
    exam.endTime = new Date().toISOString();

    // חישוב ציון
    const results = calculateExamScore(exam);
    
    exam.score = results.score;
    exam.passed = results.passed;
    exam.correctAnswers = results.correctAnswers;
    exam.wrongAnswers = results.wrongAnswers;
    exam.unanswered = results.unanswered;
    exam.accuracy = results.accuracy;
    exam.timeSpent = new Date(exam.endTime) - new Date(exam.startTime);

    // שמירת הבחינה
    saveExam(exam);

    // עדכון התקדמות המשתמש
    const userProgress = getUserProgress(exam.userId);
    
    if (!userProgress.exams) {
      userProgress.exams = [];
    }

    userProgress.exams.push({
      examId: exam.examId,
      examType: exam.examType,
      score: exam.score,
      passed: exam.passed,
      completedAt: exam.endTime,
      accuracy: exam.accuracy
    });

    // עדכון סטטיסטיקות כלליות
    if (!userProgress.examStats) {
      userProgress.examStats = {
        totalExams: 0,
        passedExams: 0,
        failedExams: 0,
        averageScore: 0,
        bestScore: 0,
        lastExamDate: null
      };
    }

    userProgress.examStats.totalExams += 1;
    if (exam.passed) {
      userProgress.examStats.passedExams += 1;
    } else {
      userProgress.examStats.failedExams += 1;
    }

    // חישוב ממוצע
    const allScores = userProgress.exams.map(e => e.score);
    userProgress.examStats.averageScore = Math.round(
      allScores.reduce((a, b) => a + b, 0) / allScores.length
    );
    userProgress.examStats.bestScore = Math.max(...allScores);
    userProgress.examStats.lastExamDate = exam.endTime;

    saveProgress(userProgress);

    // החזרת תוצאות מפורטות
    const detailedResults = {
      examId: exam.examId,
      examType: exam.examType,
      passed: exam.passed,
      score: exam.score,
      totalQuestions: exam.questionCount,
      correctAnswers: exam.correctAnswers,
      wrongAnswers: exam.wrongAnswers,
      unanswered: exam.unanswered,
      accuracy: exam.accuracy,
      passingScore: exam.passingScore,
      timeSpent: exam.timeSpent,
      questions: exam.questions.map((q, index) => {
        const userAnswer = exam.answers.find(a => a.questionId === q.questionId);
        const isCorrect = userAnswer ? userAnswer.answerIndex === q.correctAnswerIndex : false;
        
        return {
          questionId: q.questionId,
          question: q.question,
          answers: q.answers,
          image: q.image,
          subject: q.subject,
          correctAnswerIndex: q.correctAnswerIndex,
          userAnswerIndex: userAnswer ? userAnswer.answerIndex : null,
          isCorrect,
          wasAnswered: !!userAnswer,
          timeSpent: userAnswer ? userAnswer.timeSpent : 0
        };
      }),
      categoryBreakdown: results.categoryBreakdown
    };

    console.log(`✅ Exam completed: ${exam.examId}, Score: ${exam.score}/${exam.questionCount}, Passed: ${exam.passed}`);
    
    res.json(detailedResults);

  } catch (error) {
    console.error('Error completing exam:', error);
    res.status(500).json({ error: 'Failed to complete exam' });
  }
};

// קבלת כל הבחינות של משתמש
exports.getUserExams = (req, res) => {
  try {
    const { userId } = req.params;
    const { status, examType, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let exams = getUserExams(userId);

    // סינון לפי סטטוס
    if (status) {
      exams = exams.filter(e => e.status === status);
    }

    // סינון לפי סוג בחינה
    if (examType) {
      exams = exams.filter(e => e.examType === examType);
    }

    // הגבלת כמות
    exams = exams.slice(0, parseInt(limit));

    // הסרת התשובות הנכונות מבחינות שטרם הושלמו
    const sanitizedExams = exams.map(exam => {
      if (exam.status !== 'completed') {
        return {
          ...exam,
          questions: exam.questions.map(q => ({
            questionId: q.questionId,
            question: q.question,
            answers: q.answers,
            image: q.image,
            subject: q.subject
          }))
        };
      }
      return exam;
    });

    res.json(sanitizedExams);

  } catch (error) {
    console.error('Error getting user exams:', error);
    res.status(500).json({ error: 'Failed to get exams' });
  }
};

// קבלת בחינה ספציפית
exports.getExam = (req, res) => {
  try {
    const { examId } = req.params;

    const exam = getExamById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // אם הבחינה לא הושלמה, לא מחזירים את התשובות הנכונות
    if (exam.status !== 'completed') {
      const sanitizedExam = {
        ...exam,
        questions: exam.questions.map(q => ({
          questionId: q.questionId,
          question: q.question,
          answers: q.answers,
          image: q.image,
          subject: q.subject
        }))
      };
      return res.json(sanitizedExam);
    }

    res.json(exam);

  } catch (error) {
    console.error('Error getting exam:', error);
    res.status(500).json({ error: 'Failed to get exam' });
  }
};

// קבלת סטטיסטיקות בחינות
exports.getExamStatistics = (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const statistics = getExamStatistics(userId);

    res.json(statistics);

  } catch (error) {
    console.error('Error getting exam statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

// מחיקת בחינה (רק בחינות שלא הושלמו)
exports.deleteExam = (req, res) => {
  try {
    const { examId } = req.params;

    const exam = getExamById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.status === 'completed') {
      return res.status(400).json({ 
        error: 'Cannot delete completed exam',
        message: 'ניתן למחוק רק בחינות שלא הושלמו'
      });
    }

    // מחיקת הבחינה מהקובץ
    const fs = require('fs');
    const path = require('path');
    const examsPath = path.join(__dirname, '../data/exams.json');
    
    let examsData = {};
    if (fs.existsSync(examsPath)) {
      examsData = JSON.parse(fs.readFileSync(examsPath, 'utf8'));
    }

    if (examsData[examId]) {
      delete examsData[examId];
      fs.writeFileSync(examsPath, JSON.stringify(examsData, null, 2));
    }

    res.json({ success: true, message: 'Exam deleted successfully' });

  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
};

// קבלת התקדמות בבחינה (כמה שאלות נענו)
exports.getExamProgress = (req, res) => {
  try {
    const { examId } = req.params;

    const exam = getExamById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const now = new Date();
    const startTime = new Date(exam.startTime);
    const elapsed = now - startTime;
    const remaining = Math.max(0, exam.duration - elapsed);

    const progress = {
      examId: exam.examId,
      status: exam.status,
      answeredQuestions: exam.answers.length,
      totalQuestions: exam.questionCount,
      remainingTime: remaining,
      timeElapsed: elapsed,
      duration: exam.duration,
      percentComplete: Math.round((exam.answers.length / exam.questionCount) * 100)
    };

    res.json(progress);

  } catch (error) {
    console.error('Error getting exam progress:', error);
    res.status(500).json({ error: 'Failed to get exam progress' });
  }
};

