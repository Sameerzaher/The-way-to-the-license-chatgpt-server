const { getUserProgress } = require('../services/userProgressFileService');
const { getQuestionsByLang } = require('../models/questionsModel');

// פונקציה לחישוב סטטיסטיקות מפורטות
const calculateDetailedStatistics = (userProgress, questionsData) => {
  const completedQuestions = userProgress.completedQuestions || [];
  
  const totalQuestions = completedQuestions.length;
  const correctAnswers = completedQuestions.filter(q => q.isCorrect === true).length;
  const wrongAnswers = completedQuestions.filter(q => q.isCorrect === false).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  // חישוב זמן ממוצע
  const totalTime = completedQuestions.reduce((sum, q) => sum + (q.responseTime || 0), 0);
  const averageTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;
  
  // חישוב רצף ימים
  const streak = calculateStreak(completedQuestions);
  
  // חישוב התקדמות לפי קטגוריות
  const progressByCategory = calculateProgressByCategory(completedQuestions, questionsData);
  
  // חישוב פעילות אחרונה
  const recentActivity = getRecentActivity(completedQuestions);
  
  // חישוב מטרות
  const goals = calculateGoals(completedQuestions);
  
  return {
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    accuracy,
    averageTime,
    streak,
    progressByCategory,
    recentActivity,
    goals
  };
};

// פונקציה לחישוב רצף ימים
const calculateStreak = (completedQuestions) => {
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const hasActivity = completedQuestions.some(q => 
      q.answeredAt && q.answeredAt.startsWith(dateStr)
    );
    
    if (hasActivity) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

// פונקציה לחישוב התקדמות לפי קטגוריות
const calculateProgressByCategory = (completedQuestions, questionsData) => {
  const categories = ['חוקי התנועה', 'תמרורים', 'בטיחות', 'הכרת הרכב'];
  
  return categories.map(category => {
    const categoryQuestions = questionsData.filter(q => 
      (q.subject || q.topic || '').includes(category)
    );
    
    const completedInCategory = completedQuestions.filter(q => 
      categoryQuestions.some(cq => String(cq.id) === String(q.questionId))
    );
    
    const correctInCategory = completedInCategory.filter(q => q.isCorrect === true);
    
    return {
      name: category,
      total: categoryQuestions.length,
      completed: completedInCategory.length,
      correct: correctInCategory.length,
      wrong: completedInCategory.length - correctInCategory.length,
      progress: categoryQuestions.length > 0 ? 
        Math.round((completedInCategory.length / categoryQuestions.length) * 100) : 0,
      accuracy: completedInCategory.length > 0 ? 
        Math.round((correctInCategory.length / completedInCategory.length) * 100) : 0
    };
  });
};

// פונקציה לחישוב פעילות אחרונה
const getRecentActivity = (completedQuestions) => {
  return completedQuestions
    .sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt))
    .slice(0, 10)
    .map(activity => ({
      questionId: activity.questionId,
      isCorrect: activity.isCorrect,
      answeredAt: activity.answeredAt,
      responseTime: activity.responseTime || 0,
      attempts: activity.attempts || 1
    }));
};

// פונקציה לחישוב מטרות
const calculateGoals = (completedQuestions) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // מטרות יומיות
  const todayStr = today.toISOString().split('T')[0];
  const dailyCompleted = completedQuestions.filter(q => 
    q.answeredAt && q.answeredAt.startsWith(todayStr)
  ).length;
  
  // מטרות שבועיות
  const weeklyCompleted = completedQuestions.filter(q => 
    q.answeredAt && new Date(q.answeredAt) >= startOfWeek
  ).length;
  
  // מטרות חודשיות
  const monthlyCompleted = completedQuestions.filter(q => 
    q.answeredAt && new Date(q.answeredAt) >= startOfMonth
  ).length;
  
  return {
    daily: {
      target: 20,
      completed: dailyCompleted,
      progress: Math.round((dailyCompleted / 20) * 100)
    },
    weekly: {
      target: 100,
      completed: weeklyCompleted,
      progress: Math.round((weeklyCompleted / 100) * 100)
    },
    monthly: {
      target: 400,
      completed: monthlyCompleted,
      progress: Math.round((monthlyCompleted / 400) * 100)
    }
  };
};

// פונקציה לחישוב טרנדים
const calculateTrends = (completedQuestions) => {
  const last7Days = [];
  const last30Days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayQuestions = completedQuestions.filter(q => 
      q.answeredAt && q.answeredAt.startsWith(dateStr)
    );
    
    last7Days.push({
      date: dateStr,
      total: dayQuestions.length,
      correct: dayQuestions.filter(q => q.isCorrect).length,
      wrong: dayQuestions.filter(q => !q.isCorrect).length
    });
  }
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayQuestions = completedQuestions.filter(q => 
      q.answeredAt && q.answeredAt.startsWith(dateStr)
    );
    
    last30Days.push({
      date: dateStr,
      total: dayQuestions.length,
      correct: dayQuestions.filter(q => q.isCorrect).length,
      wrong: dayQuestions.filter(q => !q.isCorrect).length
    });
  }
  
  return {
    last7Days: last7Days.reverse(),
    last30Days: last30Days.reverse()
  };
};

// פונקציה לחישוב הישגים
const calculateAchievements = (userProgress, questionsData) => {
  const completedQuestions = userProgress.completedQuestions || [];
  const achievements = [];
  
  // הישגים בסיסיים
  if (completedQuestions.length >= 10) {
    achievements.push({
      id: 'first_10',
      name: 'מתחיל',
      description: 'ענית על 10 שאלות',
      icon: '🎯',
      unlocked: true,
      unlockedAt: new Date().toISOString()
    });
  }
  
  if (completedQuestions.length >= 50) {
    achievements.push({
      id: 'first_50',
      name: 'מתקדם',
      description: 'ענית על 50 שאלות',
      icon: '🏆',
      unlocked: true,
      unlockedAt: new Date().toISOString()
    });
  }
  
  if (completedQuestions.length >= 100) {
    achievements.push({
      id: 'first_100',
      name: 'מומחה',
      description: 'ענית על 100 שאלות',
      icon: '👑',
      unlocked: true,
      unlockedAt: new Date().toISOString()
    });
  }
  
  // הישגי דיוק
  const accuracy = completedQuestions.length > 0 ? 
    (completedQuestions.filter(q => q.isCorrect).length / completedQuestions.length) * 100 : 0;
  
  if (accuracy >= 80 && completedQuestions.length >= 20) {
    achievements.push({
      id: 'accuracy_80',
      name: 'דיוק גבוה',
      description: '80% דיוק על 20+ שאלות',
      icon: '🎯',
      unlocked: true,
      unlockedAt: new Date().toISOString()
    });
  }
  
  // הישג רצף
  const streak = calculateStreak(completedQuestions);
  if (streak >= 7) {
    achievements.push({
      id: 'streak_7',
      name: 'רצף שבועי',
      description: '7 ימים ברצף של תרגול',
      icon: '🔥',
      unlocked: true,
      unlockedAt: new Date().toISOString()
    });
  }
  
  return achievements;
};

// קבלת נתוני דשבורד מלאים
exports.getDashboardData = (req, res) => {
  const userId = req.params.userId;
  const period = req.query.period || 'all'; // week, month, all
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang('he'); // או לפי שפה
    
    const statistics = calculateDetailedStatistics(userProgress, questionsData);
    const trends = calculateTrends(userProgress.completedQuestions || []);
    const achievements = calculateAchievements(userProgress, questionsData);
    
    const dashboardData = {
      statistics,
      trends,
      achievements,
      period,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Dashboard data generated for user ${userId}`);
    res.json(dashboardData);
    
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

// קבלת סטטיסטיקות מפורטות
exports.getStatistics = (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang('he');
    
    const statistics = calculateDetailedStatistics(userProgress, questionsData);
    
    res.json(statistics);
    
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

// קבלת התקדמות לפי קטגוריות
exports.getProgressByCategory = (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang('he');
    
    const progressByCategory = calculateProgressByCategory(
      userProgress.completedQuestions || [], 
      questionsData
    );
    
    res.json(progressByCategory);
    
  } catch (error) {
    console.error('Error getting progress by category:', error);
    res.status(500).json({ error: 'Failed to get progress by category' });
  }
};

// קבלת פעילות אחרונה
exports.getRecentActivity = (req, res) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const recentActivity = getRecentActivity(userProgress.completedQuestions || [])
      .slice(0, limit);
    
    res.json(recentActivity);
    
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({ error: 'Failed to get recent activity' });
  }
};

// קבלת מטרות
exports.getGoals = (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const goals = calculateGoals(userProgress.completedQuestions || []);
    
    res.json(goals);
    
  } catch (error) {
    console.error('Error getting goals:', error);
    res.status(500).json({ error: 'Failed to get goals' });
  }
};

// קבלת טרנדים
exports.getTrends = (req, res) => {
  const userId = req.params.userId;
  const period = req.query.period || 'week'; // week, month
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const trends = calculateTrends(userProgress.completedQuestions || []);
    
    const result = period === 'week' ? 
      { trends: trends.last7Days } : 
      { trends: trends.last30Days };
    
    res.json(result);
    
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
};

// קבלת הישגים
exports.getAchievements = (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang('he');
    
    const achievements = calculateAchievements(userProgress, questionsData);
    
    res.json(achievements);
    
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
};

// עדכון מטרות
exports.updateGoals = (req, res) => {
  const userId = req.params.userId;
  const { daily, weekly, monthly } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    // כאן נוכל לשמור את המטרות במסד נתונים או בקובץ
    // כרגע נחזיר הצלחה
    const updatedGoals = {
      daily: daily || 20,
      weekly: weekly || 100,
      monthly: monthly || 400,
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Goals updated for user ${userId}:`, updatedGoals);
    res.json({ success: true, goals: updatedGoals });
    
  } catch (error) {
    console.error('Error updating goals:', error);
    res.status(500).json({ error: 'Failed to update goals' });
  }
};
