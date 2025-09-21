const { getUserProgress } = require('../services/userProgressFileService');
const { getQuestionsByLang } = require('../models/questionsModel');

// תוכניות לימוד מובנות
const STUDY_PLANS = {
  quick: {
    id: 'quick',
    name: 'תוכנית מהירה',
    duration: 14, // ימים
    description: 'תוכנית אינטנסיבית למבחן תיאוריה תוך שבועיים',
    dailyGoal: 50, // שאלות ביום
    weeklyGoal: 350,
    totalQuestions: 700,
    difficulty: 'high',
    schedule: {
      week1: {
        days: [
          { day: 1, subjects: ['חוקי התנועה'], questions: 50, focus: 'foundations' },
          { day: 2, subjects: ['תמרורים'], questions: 50, focus: 'recognition' },
          { day: 3, subjects: ['בטיחות'], questions: 50, focus: 'safety' },
          { day: 4, subjects: ['הכרת הרכב'], questions: 50, focus: 'mechanics' },
          { day: 5, subjects: ['חוקי התנועה', 'תמרורים'], questions: 50, focus: 'mixed' },
          { day: 6, subjects: ['בטיחות', 'הכרת הרכב'], questions: 50, focus: 'mixed' },
          { day: 7, subjects: ['כל הנושאים'], questions: 50, focus: 'review' }
        ]
      },
      week2: {
        days: [
          { day: 8, subjects: ['כל הנושאים'], questions: 50, focus: 'practice' },
          { day: 9, subjects: ['כל הנושאים'], questions: 50, focus: 'practice' },
          { day: 10, subjects: ['כל הנושאים'], questions: 50, focus: 'practice' },
          { day: 11, subjects: ['כל הנושאים'], questions: 50, focus: 'practice' },
          { day: 12, subjects: ['כל הנושאים'], questions: 50, focus: 'practice' },
          { day: 13, subjects: ['כל הנושאים'], questions: 50, focus: 'final_review' },
          { day: 14, subjects: ['כל הנושאים'], questions: 50, focus: 'exam_prep' }
        ]
      }
    }
  },
  standard: {
    id: 'standard',
    name: 'תוכנית סטנדרטית',
    duration: 28, // ימים
    description: 'תוכנית מאוזנת למבחן תיאוריה תוך חודש',
    dailyGoal: 30, // שאלות ביום
    weeklyGoal: 210,
    totalQuestions: 840,
    difficulty: 'medium',
    schedule: {
      week1: {
        days: [
          { day: 1, subjects: ['חוקי התנועה'], questions: 30, focus: 'foundations' },
          { day: 2, subjects: ['חוקי התנועה'], questions: 30, focus: 'foundations' },
          { day: 3, subjects: ['תמרורים'], questions: 30, focus: 'recognition' },
          { day: 4, subjects: ['תמרורים'], questions: 30, focus: 'recognition' },
          { day: 5, subjects: ['בטיחות'], questions: 30, focus: 'safety' },
          { day: 6, subjects: ['בטיחות'], questions: 30, focus: 'safety' },
          { day: 7, subjects: ['הכרת הרכב'], questions: 30, focus: 'mechanics' }
        ]
      },
      week2: {
        days: [
          { day: 8, subjects: ['הכרת הרכב'], questions: 30, focus: 'mechanics' },
          { day: 9, subjects: ['חוקי התנועה', 'תמרורים'], questions: 30, focus: 'mixed' },
          { day: 10, subjects: ['בטיחות', 'הכרת הרכב'], questions: 30, focus: 'mixed' },
          { day: 11, subjects: ['כל הנושאים'], questions: 30, focus: 'review' },
          { day: 12, subjects: ['כל הנושאים'], questions: 30, focus: 'review' },
          { day: 13, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 14, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' }
        ]
      },
      week3: {
        days: [
          { day: 15, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 16, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 17, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 18, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 19, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 20, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 21, subjects: ['כל הנושאים'], questions: 30, focus: 'review' }
        ]
      },
      week4: {
        days: [
          { day: 22, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 23, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 24, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 25, subjects: ['כל הנושאים'], questions: 30, focus: 'practice' },
          { day: 26, subjects: ['כל הנושאים'], questions: 30, focus: 'final_review' },
          { day: 27, subjects: ['כל הנושאים'], questions: 30, focus: 'exam_prep' },
          { day: 28, subjects: ['כל הנושאים'], questions: 30, focus: 'exam_prep' }
        ]
      }
    }
  },
  comprehensive: {
    id: 'comprehensive',
    name: 'תוכנית מקיפה',
    duration: 56, // ימים
    description: 'תוכנית מקיפה למבחן תיאוריה תוך חודשיים',
    dailyGoal: 20, // שאלות ביום
    weeklyGoal: 140,
    totalQuestions: 1120,
    difficulty: 'low',
    schedule: {
      week1: {
        days: [
          { day: 1, subjects: ['חוקי התנועה'], questions: 20, focus: 'foundations' },
          { day: 2, subjects: ['חוקי התנועה'], questions: 20, focus: 'foundations' },
          { day: 3, subjects: ['חוקי התנועה'], questions: 20, focus: 'foundations' },
          { day: 4, subjects: ['תמרורים'], questions: 20, focus: 'recognition' },
          { day: 5, subjects: ['תמרורים'], questions: 20, focus: 'recognition' },
          { day: 6, subjects: ['תמרורים'], questions: 20, focus: 'recognition' },
          { day: 7, subjects: ['בטיחות'], questions: 20, focus: 'safety' }
        ]
      }
      // ... ניתן להוסיף עוד שבועות
    }
  },
  relaxed: {
    id: 'relaxed',
    name: 'תוכנית מקיפה',
    duration: 56, // ימים
    description: 'תוכנית מקיפה למבחן תיאוריה תוך חודשיים',
    dailyGoal: 20, // שאלות ביום
    weeklyGoal: 140,
    totalQuestions: 1120,
    difficulty: 'low',
    schedule: {
      week1: {
        days: [
          { day: 1, subjects: ['חוקי תנועה'], questions: 20, focus: 'foundations' },
          { day: 2, subjects: ['חוקי תנועה'], questions: 20, focus: 'foundations' },
          { day: 3, subjects: ['חוקי תנועה'], questions: 20, focus: 'foundations' },
          { day: 4, subjects: ['תמרורים'], questions: 20, focus: 'recognition' },
          { day: 5, subjects: ['תמרורים'], questions: 20, focus: 'recognition' },
          { day: 6, subjects: ['תמרורים'], questions: 20, focus: 'recognition' },
          { day: 7, subjects: ['חוקי תנועה', 'תמרורים'], questions: 20, focus: 'mixed' }
        ]
      }
      // ... ניתן להוסיף עוד שבועות
    }
  },
  crash: {
    id: 'crash',
    name: 'תוכנית אינטנסיבית',
    duration: 7, // ימים
    description: 'תוכנית אינטנסיבית למבחן תיאוריה תוך שבוע',
    dailyGoal: 100, // שאלות ביום
    weeklyGoal: 700,
    totalQuestions: 700,
    difficulty: 'high',
    schedule: {
      week1: {
        days: [
          { day: 1, subjects: ['חוקי תנועה', 'תמרורים'], questions: 100, focus: 'foundations' },
          { day: 2, subjects: ['חנייה', 'אותות תנועה'], questions: 100, focus: 'recognition' },
          { day: 3, subjects: ['כללי בטיחות'], questions: 100, focus: 'safety' },
          { day: 4, subjects: ['כל הנושאים'], questions: 100, focus: 'mixed' },
          { day: 5, subjects: ['כל הנושאים'], questions: 100, focus: 'practice' },
          { day: 6, subjects: ['כל הנושאים'], questions: 100, focus: 'review' },
          { day: 7, subjects: ['כל הנושאים'], questions: 100, focus: 'exam_prep' }
        ]
      }
    }
  },
  daily: {
    id: 'daily',
    name: 'תוכנית יומית',
    duration: 365, // ימים
    description: 'תרגול יומי קבוע לשמירה על רמה',
    dailyGoal: 15, // שאלות ביום
    weeklyGoal: 105,
    totalQuestions: 5475,
    difficulty: 'low',
    schedule: {
      week1: {
        days: [
          { day: 1, subjects: ['כל הנושאים'], questions: 15, focus: 'mixed' },
          { day: 2, subjects: ['כל הנושאים'], questions: 15, focus: 'mixed' },
          { day: 3, subjects: ['כל הנושאים'], questions: 15, focus: 'mixed' },
          { day: 4, subjects: ['כל הנושאים'], questions: 15, focus: 'mixed' },
          { day: 5, subjects: ['כל הנושאים'], questions: 15, focus: 'mixed' },
          { day: 6, subjects: ['כל הנושאים'], questions: 15, focus: 'mixed' },
          { day: 7, subjects: ['כל הנושאים'], questions: 15, focus: 'mixed' }
        ]
      }
    }
  }
};

// קבלת כל התוכניות הזמינות
exports.getAvailablePlans = (req, res) => {
  try {
    const plans = Object.values(STUDY_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      duration: plan.duration,
      description: plan.description,
      dailyGoal: plan.dailyGoal,
      weeklyGoal: plan.weeklyGoal,
      totalQuestions: plan.totalQuestions,
      difficulty: plan.difficulty
    }));

    res.json(plans);
  } catch (error) {
    console.error('Error getting study plans:', error);
    res.status(500).json({ error: 'Failed to get study plans' });
  }
};

// קבלת תוכנית ספציפית
exports.getStudyPlan = (req, res) => {
  try {
    const { planId } = req.params;
    const plan = STUDY_PLANS[planId];

    if (!plan) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error getting study plan:', error);
    res.status(500).json({ error: 'Failed to get study plan' });
  }
};

// יצירת תוכנית לימוד אישית למשתמש
exports.createUserStudyPlan = (req, res) => {
  try {
    const { userId } = req.params;
    const { planId, startDate, examDate } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'userId and planId are required' });
    }

    const plan = STUDY_PLANS[planId];
    if (!plan) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    // יצירת תוכנית אישית
    const userPlan = {
      userId,
      planId,
      planName: plan.name,
      startDate: startDate || new Date().toISOString(),
      examDate: examDate || null,
      currentDay: 1,
      totalDays: plan.duration,
      dailyGoal: plan.dailyGoal,
      weeklyGoal: plan.weeklyGoal,
      totalQuestions: plan.totalQuestions,
      difficulty: plan.difficulty,
      progress: {
        completedDays: 0,
        completedQuestions: 0,
        streak: 0,
        lastActivity: null
      },
      schedule: plan.schedule,
      status: 'active', // active, paused, completed
      createdAt: new Date().toISOString()
    };

    // שמירת התוכנית (כאן צריך להוסיף שמירה לקובץ או DB)
    // saveUserStudyPlan(userId, userPlan);

    res.json(userPlan);
  } catch (error) {
    console.error('Error creating user study plan:', error);
    res.status(500).json({ error: 'Failed to create study plan' });
  }
};

// קבלת תוכנית הלימוד של משתמש
exports.getUserStudyPlan = (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // כאן צריך לטעון את התוכנית מהקובץ או DB
    // const userPlan = getUserStudyPlan(userId);
    
    // דוגמה לתוכנית
    const userPlan = {
      userId,
      planId: 'standard',
      planName: 'תוכנית סטנדרטית',
      startDate: new Date().toISOString(),
      examDate: null,
      currentDay: 5,
      totalDays: 28,
      dailyGoal: 30,
      weeklyGoal: 210,
      totalQuestions: 840,
      difficulty: 'medium',
      progress: {
        completedDays: 4,
        completedQuestions: 120,
        streak: 3,
        lastActivity: new Date().toISOString()
      },
      status: 'active',
      createdAt: new Date().toISOString()
    };

    res.json(userPlan);
  } catch (error) {
    console.error('Error getting user study plan:', error);
    res.status(500).json({ error: 'Failed to get user study plan' });
  }
};

// עדכון תוכנית לימוד קיימת
exports.updateUserStudyPlan = (req, res) => {
  try {
    const { userId } = req.params;
    const { planId, startDate, examDate, currentDay, progress } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'userId and planId are required' });
    }

    const plan = STUDY_PLANS[planId];
    if (!plan) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    // עדכון התוכנית הקיימת
    const updatedPlan = {
      userId,
      planId,
      planName: plan.name,
      startDate: startDate || new Date().toISOString(),
      examDate: examDate || null,
      currentDay: currentDay || 1,
      totalDays: plan.duration,
      dailyGoal: plan.dailyGoal,
      weeklyGoal: plan.weeklyGoal,
      totalQuestions: plan.totalQuestions,
      difficulty: plan.difficulty,
      progress: progress || {
        completedDays: 0,
        completedQuestions: 0,
        streak: 0,
        lastActivity: null
      },
      schedule: plan.schedule,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // שמירת התוכנית המעודכנת (כאן צריך להוסיף שמירה לקובץ או DB)
    // updateUserStudyPlan(userId, updatedPlan);

    console.log(`Study plan updated for user ${userId}:`, updatedPlan);
    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating user study plan:', error);
    res.status(500).json({ error: 'Failed to update study plan' });
  }
};

// עדכון התקדמות בתוכנית הלימוד
exports.updateStudyPlanProgress = (req, res) => {
  try {
    const { userId } = req.params;
    const { questionsCompleted, accuracy, timeSpent, dayCompleted } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // כאן צריך לעדכן את ההתקדמות
    // updateUserStudyPlanProgress(userId, { questionsCompleted, accuracy, timeSpent });

    const updatedProgress = {
      questionsCompleted: questionsCompleted || 0,
      accuracy: accuracy || 0,
      timeSpent: timeSpent || 0,
      dayCompleted: dayCompleted || false,
      lastActivity: new Date().toISOString(),
      streak: 1 // צריך לחשב לפי הנתונים
    };

    console.log(`Updated study plan progress for user ${userId}:`, updatedProgress);
    res.json(updatedProgress);
  } catch (error) {
    console.error('Error updating study plan progress:', error);
    res.status(500).json({ error: 'Failed to update study plan progress' });
  }
};

// עדכון התקדמות המשימה היומית
exports.updateDailyTaskProgress = (req, res) => {
  try {
    const { userId } = req.params;
    const { day, questionsCompleted, accuracy, timeSpent, topicsCompleted } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // כאן צריך לעדכן את ההתקדמות של המשימה היומית
    // updateDailyTaskProgress(userId, day, { questionsCompleted, accuracy, timeSpent, topicsCompleted });

    const updatedTaskProgress = {
      day: parseInt(day) || 1,
      questionsCompleted: questionsCompleted || 0,
      accuracy: accuracy || 0,
      timeSpent: timeSpent || 0,
      topicsCompleted: topicsCompleted || [],
      completedAt: new Date().toISOString(),
      status: 'completed'
    };

    console.log(`Updated daily task progress for user ${userId}, day ${day}:`, updatedTaskProgress);
    res.json(updatedTaskProgress);
  } catch (error) {
    console.error('Error updating daily task progress:', error);
    res.status(500).json({ error: 'Failed to update daily task progress' });
  }
};

// קבלת המשימה היומית
exports.getDailyTask = (req, res) => {
  try {
    const { userId } = req.params;
    const { day } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const currentDay = parseInt(day) || 1;
    
    // Helper functions for generating dynamic daily tasks
    const getSubjectsForPlan = (planId) => {
      const planSubjects = {
        'intensive': ['חוקי תנועה', 'תמרורים', 'חנייה', 'אותות תנועה'],
        'standard': ['חוקי תנועה', 'תמרורים', 'חנייה'],
        'relaxed': ['חוקי תנועה', 'תמרורים'],
        'crash': ['חוקי תנועה', 'תמרורים', 'חנייה', 'אותות תנועה', 'כללי בטיחות'],
        'quick': ['חוקי תנועה', 'תמרורים'],
        'daily': ['כל הנושאים']
      };
      return planSubjects[planId] || ['חוקי תנועה', 'תמרורים'];
    };

    const getDifficultyForDay = (day, planId) => {
      if (planId === 'intensive' || planId === 'crash') {
        return day <= 7 ? 'low' : day <= 14 ? 'medium' : 'high';
      } else if (planId === 'standard') {
        return day <= 10 ? 'low' : day <= 20 ? 'medium' : 'high';
      } else if (planId === 'quick') {
        return day <= 5 ? 'low' : 'medium';
      } else {
        return day <= 14 ? 'low' : 'medium';
      }
    };

    const getTipsForDay = (day, planId) => {
      if (day <= 7) {
        return [
          'התחל עם החוקים הבסיסיים',
          'התמקד בהבנת התמרורים הפשוטים',
          'אל תדאג מהזמן - למידה חשובה יותר'
        ];
      } else if (day <= 14) {
        return [
          'התמקד בהבנת החוקים הבסיסיים',
          'שימו לב להבדלים בין סוגי תמרורים',
          'תרגלו זיהוי מהיר של תמרורים'
        ];
      } else {
        return [
          'התמקד בשאלות הקשות יותר',
          'תרגל סימולציות מלאות',
          'הכן את עצמך למבחן האמיתי'
        ];
      }
    };

    const getFocusForDay = (day, planId) => {
      if (day <= 7) {
        return 'foundations';
      } else if (day <= 14) {
        return 'mixed';
      } else {
        return 'advanced';
      }
    };

    // כאן צריך לטעון את התוכנית האמיתית של המשתמש
    // const userPlan = getUserStudyPlan(userId);
    
    // דוגמה למשימה יומית דינמית
    const planId = 'standard'; // צריך לקבל מהתוכנית האמיתית
    const dailyGoal = 30; // צריך לקבל מהתוכנית האמיתית
    
    const dailyTask = {
      day: currentDay,
      subjects: getSubjectsForPlan(planId),
      questions: dailyGoal,
      focus: getFocusForDay(currentDay, planId),
      description: `יום ${currentDay} - תרגול יומי`,
      estimatedTime: `${Math.ceil(dailyGoal * 1.5)}-${Math.ceil(dailyGoal * 2)} דקות`,
      difficulty: getDifficultyForDay(currentDay, planId),
      tips: getTipsForDay(currentDay, planId),
      topics: getSubjectsForPlan(planId).map(subject => ({
        name: subject,
        count: Math.ceil(dailyGoal / getSubjectsForPlan(planId).length),
        completed: 0
      }))
    };

    console.log(`Generated daily task for user ${userId}, day ${currentDay}:`, dailyTask);
    res.json(dailyTask);
  } catch (error) {
    console.error('Error getting daily task:', error);
    res.status(500).json({ error: 'Failed to get daily task' });
  }
};

// יצירת תוכנית מותאמת אישית
exports.createCustomStudyPlan = (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      duration, 
      dailyGoal, 
      subjects, 
      examDate, 
      currentLevel,
      availableTime 
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // יצירת תוכנית מותאמת אישית
    const customPlan = {
      userId,
      planId: 'custom',
      planName: 'תוכנית מותאמת אישית',
      duration: duration || 21,
      dailyGoal: dailyGoal || 25,
      subjects: subjects || ['כל הנושאים'],
      examDate: examDate || null,
      currentLevel: currentLevel || 'beginner',
      availableTime: availableTime || 'medium',
      startDate: new Date().toISOString(),
      currentDay: 1,
      progress: {
        completedDays: 0,
        completedQuestions: 0,
        streak: 0,
        lastActivity: null
      },
      status: 'active',
      createdAt: new Date().toISOString()
    };

    res.json(customPlan);
  } catch (error) {
    console.error('Error creating custom study plan:', error);
    res.status(500).json({ error: 'Failed to create custom study plan' });
  }
};

// קבלת סטטיסטיקות תוכנית הלימוד
exports.getStudyPlanStats = (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // כאן צריך לחשב סטטיסטיקות מהנתונים
    const stats = {
      totalDays: 28,
      completedDays: 5,
      remainingDays: 23,
      completionPercentage: 17.9,
      totalQuestions: 840,
      completedQuestions: 150,
      remainingQuestions: 690,
      averageAccuracy: 78.5,
      currentStreak: 3,
      longestStreak: 7,
      weeklyProgress: [
        { week: 1, completed: 210, goal: 210, percentage: 100 },
        { week: 2, completed: 120, goal: 210, percentage: 57.1 },
        { week: 3, completed: 0, goal: 210, percentage: 0 },
        { week: 4, completed: 0, goal: 210, percentage: 0 }
      ],
      subjectProgress: {
        'חוקי התנועה': { completed: 45, total: 200, percentage: 22.5 },
        'תמרורים': { completed: 38, total: 180, percentage: 21.1 },
        'בטיחות': { completed: 32, total: 160, percentage: 20.0 },
        'הכרת הרכב': { completed: 35, total: 140, percentage: 25.0 }
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting study plan stats:', error);
    res.status(500).json({ error: 'Failed to get study plan stats' });
  }
};
