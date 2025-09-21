const { getUserProgress } = require('../services/userProgressFileService');
const { getQuestionsByLang } = require('../models/questionsModel');

// פונקציה לזיהוי חולשות
const identifyWeaknesses = (userProgress, questionsData) => {
  const completedQuestions = userProgress.completedQuestions || [];
  
  // ניתוח לפי נושאים
  const subjectAnalysis = {};
  const categories = ['חוקי התנועה', 'תמרורים', 'בטיחות', 'הכרת הרכב'];
  
  categories.forEach(category => {
    const categoryQuestions = questionsData.filter(q => 
      (q.subject || q.topic || '').includes(category)
    );
    
    const completedInCategory = completedQuestions.filter(q => 
      categoryQuestions.some(cq => String(cq.id) === String(q.questionId))
    );
    
    const correctInCategory = completedInCategory.filter(q => q.isCorrect === true);
    const wrongInCategory = completedInCategory.filter(q => q.isCorrect === false);
    
    const accuracy = completedInCategory.length > 0 ? 
      (correctInCategory.length / completedInCategory.length) * 100 : 0;
    
    const totalQuestions = categoryQuestions.length;
    const completionRate = (completedInCategory.length / totalQuestions) * 100;
    
    subjectAnalysis[category] = {
      total: totalQuestions,
      completed: completedInCategory.length,
      correct: correctInCategory.length,
      wrong: wrongInCategory.length,
      accuracy: Math.round(accuracy),
      completionRate: Math.round(completionRate),
      weakness: accuracy < 70 || completionRate < 30
    };
  });
  
  // זיהוי חולשות ספציפיות
  const weaknesses = [];
  Object.entries(subjectAnalysis).forEach(([category, data]) => {
    if (data.weakness) {
      let severity = 'medium';
      if (data.accuracy < 50 || data.completionRate < 20) {
        severity = 'high';
      } else if (data.accuracy < 60 || data.completionRate < 25) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
      
      weaknesses.push({
        category,
        severity,
        accuracy: data.accuracy,
        completionRate: data.completionRate,
        priority: calculatePriority(data, category)
      });
    }
  });
  
  // מיון לפי עדיפות
  weaknesses.sort((a, b) => b.priority - a.priority);
  
  return {
    weaknesses,
    subjectAnalysis,
    overallWeakness: weaknesses.length > 0
  };
};

// פונקציה לחישוב עדיפות
const calculatePriority = (data, category) => {
  let priority = 0;
  
  // עדיפות לפי דיוק
  if (data.accuracy < 50) priority += 30;
  else if (data.accuracy < 60) priority += 20;
  else if (data.accuracy < 70) priority += 10;
  
  // עדיפות לפי אחוז השלמה
  if (data.completionRate < 20) priority += 25;
  else if (data.completionRate < 30) priority += 15;
  else if (data.completionRate < 40) priority += 10;
  
  // עדיפות לפי נושא
  const categoryPriority = {
    'חוקי התנועה': 15,
    'תמרורים': 12,
    'בטיחות': 10,
    'הכרת הרכב': 8
  };
  
  priority += categoryPriority[category] || 5;
  
  return priority;
};

// פונקציה להמלצות שאלות
const getQuestionRecommendations = (userProgress, questionsData, weaknesses) => {
  const completedQuestions = userProgress.completedQuestions || [];
  const completedIds = new Set(completedQuestions.map(q => String(q.questionId)));
  
  // שאלות שלא נענו
  const unansweredQuestions = questionsData.filter(q => 
    !completedIds.has(String(q.id))
  );
  
  // המלצות לפי חולשות
  const recommendations = [];
  
  weaknesses.forEach(weakness => {
    const categoryQuestions = unansweredQuestions.filter(q => 
      (q.subject || q.topic || '').includes(weakness.category)
    );
    
    // בחירת שאלות לפי רמת קושי
    let difficultyLevel = 'medium';
    if (weakness.severity === 'high') {
      difficultyLevel = 'easy';
    } else if (weakness.severity === 'low') {
      difficultyLevel = 'hard';
    }
    
    // סינון לפי רמת קושי (אם יש שדה כזה)
    const filteredQuestions = categoryQuestions.filter(q => {
      if (q.difficulty) {
        return q.difficulty === difficultyLevel;
      }
      // אם אין שדה קושי, נבחר באופן אקראי
      return true;
    });
    
    // בחירת 3-5 שאלות מומלצות
    const selectedQuestions = filteredQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(5, filteredQuestions.length));
    
    recommendations.push({
      category: weakness.category,
      reason: getRecommendationReason(weakness),
      questions: selectedQuestions,
      priority: weakness.priority,
      difficultyLevel
    });
  });
  
  // המלצות כלליות אם אין חולשות
  if (recommendations.length === 0) {
    const generalQuestions = unansweredQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    
    recommendations.push({
      category: 'כללי',
      reason: 'המשך למידה כללית',
      questions: generalQuestions,
      priority: 50,
      difficultyLevel: 'medium'
    });
  }
  
  return recommendations;
};

// פונקציה לסיבת המלצה
const getRecommendationReason = (weakness) => {
  if (weakness.accuracy < 50) {
    return `דיוק נמוך (${weakness.accuracy}%) - צריך תרגול נוסף`;
  } else if (weakness.completionRate < 30) {
    return `השלמה נמוכה (${weakness.completionRate}%) - צריך להתמקד בנושא`;
  } else {
    return `שיפור נדרש - דיוק ${weakness.accuracy}%`;
  }
};

// פונקציה ליצירת מסלול למידה אישי
const createLearningPath = (userProgress, questionsData, weaknesses) => {
  const completedQuestions = userProgress.completedQuestions || [];
  const completedIds = new Set(completedQuestions.map(q => String(q.questionId)));
  
  // יצירת מסלול לפי חולשות
  const learningPath = [];
  
  weaknesses.forEach((weakness, index) => {
    const categoryQuestions = questionsData.filter(q => 
      (q.subject || q.topic || '').includes(weakness.category) &&
      !completedIds.has(String(q.id))
    );
    
    // חלוקה לשלבים
    const stages = [
      { name: 'יסודות', count: Math.min(5, Math.ceil(categoryQuestions.length * 0.3)) },
      { name: 'תרגול', count: Math.min(10, Math.ceil(categoryQuestions.length * 0.5)) },
      { name: 'שיפור', count: Math.min(5, Math.ceil(categoryQuestions.length * 0.2)) }
    ];
    
    let questionIndex = 0;
    const pathStages = stages.map(stage => {
      const stageQuestions = categoryQuestions.slice(questionIndex, questionIndex + stage.count);
      questionIndex += stage.count;
      
      return {
        name: stage.name,
        questions: stageQuestions,
        description: getStageDescription(stage.name, weakness.category)
      };
    });
    
    learningPath.push({
      category: weakness.category,
      priority: weakness.priority,
      stages: pathStages,
      estimatedTime: calculateEstimatedTime(categoryQuestions.length),
      difficulty: weakness.severity
    });
  });
  
  // מיון לפי עדיפות
  learningPath.sort((a, b) => b.priority - a.priority);
  
  return learningPath;
};

// פונקציה לתיאור שלב
const getStageDescription = (stageName, category) => {
  const descriptions = {
    'יסודות': `לימוד יסודות ${category} - שאלות בסיסיות להבנה`,
    'תרגול': `תרגול מתקדם ב${category} - שאלות ברמה בינונית`,
    'שיפור': `שיפור מיומנויות ב${category} - שאלות מאתגרות`
  };
  
  return descriptions[stageName] || `שלב ${stageName} ב${category}`;
};

// פונקציה לחישוב זמן משוער
const calculateEstimatedTime = (questionCount) => {
  const timePerQuestion = 2; // דקות לשאלה
  const totalMinutes = questionCount * timePerQuestion;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours} שעות ו-${minutes} דקות`;
  } else {
    return `${minutes} דקות`;
  }
};

// פונקציה לחישוב התקדמות במסלול
const calculatePathProgress = (userProgress, learningPath) => {
  const completedQuestions = userProgress.completedQuestions || [];
  const completedIds = new Set(completedQuestions.map(q => String(q.questionId)));
  
  return learningPath.map(path => {
    let totalQuestions = 0;
    let completedInPath = 0;
    
    path.stages.forEach(stage => {
      totalQuestions += stage.questions.length;
      completedInPath += stage.questions.filter(q => 
        completedIds.has(String(q.id))
      ).length;
    });
    
    const progress = totalQuestions > 0 ? (completedInPath / totalQuestions) * 100 : 0;
    
    return {
      category: path.category,
      progress: Math.round(progress),
      completed: completedInPath,
      total: totalQuestions,
      nextStage: getNextStage(path.stages, completedIds)
    };
  });
};

// פונקציה לקבלת השלב הבא
const getNextStage = (stages, completedIds) => {
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const completedInStage = stage.questions.filter(q => 
      completedIds.has(String(q.id))
    ).length;
    
    if (completedInStage < stage.questions.length) {
      return {
        name: stage.name,
        remaining: stage.questions.length - completedInStage,
        description: stage.description
      };
    }
  }
  
  return null; // כל השלבים הושלמו
};

// קבלת ניתוח חולשות
exports.getWeaknessAnalysis = (req, res) => {
  const userId = req.params.userId;
  const lang = req.query.lang || 'he';
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang(lang);
    
    const analysis = identifyWeaknesses(userProgress, questionsData);
    
    console.log(`Weakness analysis generated for user ${userId}:`, analysis.weaknesses.length, 'weaknesses found');
    res.json(analysis);
    
  } catch (error) {
    console.error('Error getting weakness analysis:', error);
    res.status(500).json({ error: 'Failed to get weakness analysis' });
  }
};

// קבלת המלצות שאלות
exports.getQuestionRecommendations = (req, res) => {
  const userId = req.params.userId;
  const lang = req.query.lang || 'he';
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang(lang);
    
    // קבלת ניתוח חולשות
    const weaknessAnalysis = identifyWeaknesses(userProgress, questionsData);
    
    // קבלת המלצות
    const recommendations = getQuestionRecommendations(userProgress, questionsData, weaknessAnalysis.weaknesses);
    
    console.log(`Question recommendations generated for user ${userId}:`, recommendations.length, 'recommendations');
    res.json({
      recommendations,
      weaknessAnalysis: weaknessAnalysis.weaknesses
    });
    
  } catch (error) {
    console.error('Error getting question recommendations:', error);
    res.status(500).json({ error: 'Failed to get question recommendations' });
  }
};

// קבלת מסלול למידה אישי
exports.getLearningPath = (req, res) => {
  const userId = req.params.userId;
  const lang = req.query.lang || 'he';
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang(lang);
    
    // קבלת ניתוח חולשות
    const weaknessAnalysis = identifyWeaknesses(userProgress, questionsData);
    
    // יצירת מסלול למידה
    const learningPath = createLearningPath(userProgress, questionsData, weaknessAnalysis.weaknesses);
    
    // חישוב התקדמות
    const progress = calculatePathProgress(userProgress, learningPath);
    
    console.log(`Learning path generated for user ${userId}:`, learningPath.length, 'categories');
    res.json({
      learningPath,
      progress,
      weaknessAnalysis: weaknessAnalysis.weaknesses
    });
    
  } catch (error) {
    console.error('Error getting learning path:', error);
    res.status(500).json({ error: 'Failed to get learning path' });
  }
};

// קבלת ניתוח AI מלא
exports.getAIAnalysis = (req, res) => {
  const userId = req.params.userId;
  const lang = req.query.lang || 'he';
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang(lang);
    
    // ניתוח חולשות
    const weaknessAnalysis = identifyWeaknesses(userProgress, questionsData);
    
    // המלצות שאלות
    const recommendations = getQuestionRecommendations(userProgress, questionsData, weaknessAnalysis.weaknesses);
    
    // מסלול למידה
    const learningPath = createLearningPath(userProgress, questionsData, weaknessAnalysis.weaknesses);
    const progress = calculatePathProgress(userProgress, learningPath);
    
    // ניתוח כללי
    const overallAnalysis = {
      totalQuestions: questionsData.length,
      completedQuestions: userProgress.completedQuestions?.length || 0,
      completionRate: questionsData.length > 0 ? 
        Math.round(((userProgress.completedQuestions?.length || 0) / questionsData.length) * 100) : 0,
      averageAccuracy: calculateAverageAccuracy(userProgress),
      learningLevel: determineLearningLevel(userProgress, questionsData),
      nextSteps: generateNextSteps(weaknessAnalysis.weaknesses, progress)
    };
    
    const aiAnalysis = {
      weaknessAnalysis,
      recommendations,
      learningPath,
      progress,
      overallAnalysis,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Complete AI analysis generated for user ${userId}`);
    res.json(aiAnalysis);
    
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    res.status(500).json({ error: 'Failed to get AI analysis' });
  }
};

// פונקציה לחישוב דיוק ממוצע
const calculateAverageAccuracy = (userProgress) => {
  const completedQuestions = userProgress.completedQuestions || [];
  if (completedQuestions.length === 0) return 0;
  
  const correctAnswers = completedQuestions.filter(q => q.isCorrect === true).length;
  return Math.round((correctAnswers / completedQuestions.length) * 100);
};

// פונקציה לקביעת רמת למידה
const determineLearningLevel = (userProgress, questionsData) => {
  const completedQuestions = userProgress.completedQuestions || [];
  const completionRate = (completedQuestions.length / questionsData.length) * 100;
  const accuracy = calculateAverageAccuracy(userProgress);
  
  if (completionRate < 20) return 'מתחיל';
  if (completionRate < 50) return 'מתקדם';
  if (completionRate < 80) return 'מנוסה';
  if (accuracy >= 85) return 'מומחה';
  return 'מתקדם';
};

// פונקציה ליצירת הצעדים הבאים
const generateNextSteps = (weaknesses, progress) => {
  const nextSteps = [];
  
  if (weaknesses.length > 0) {
    const topWeakness = weaknesses[0];
    nextSteps.push({
      action: 'focus_on_weakness',
      category: topWeakness.category,
      description: `התמקד ב${topWeakness.category} - דיוק ${topWeakness.accuracy}%`,
      priority: 'high'
    });
  }
  
  progress.forEach(path => {
    if (path.progress < 100 && path.nextStage) {
      nextSteps.push({
        action: 'continue_path',
        category: path.category,
        description: `המשך ${path.nextStage.name} ב${path.category}`,
        priority: 'medium'
      });
    }
  });
  
  return nextSteps.slice(0, 3); // מקסימום 3 צעדים
};
