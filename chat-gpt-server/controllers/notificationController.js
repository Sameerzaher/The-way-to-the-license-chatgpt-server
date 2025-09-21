const { getUserProgress } = require('../services/userProgressFileService');
const { getQuestionsByLang } = require('../models/questionsModel');

// פונקציה לחישוב זמן התראה אופטימלי
const calculateOptimalReminderTime = (userProgress) => {
  const completedQuestions = userProgress.completedQuestions || [];
  
  // ניתוח דפוסי פעילות
  const activityTimes = completedQuestions
    .filter(q => q.answeredAt)
    .map(q => new Date(q.answeredAt).getHours())
    .filter(hour => hour >= 6 && hour <= 23); // רק שעות פעילות
  
  if (activityTimes.length === 0) {
    return { hour: 18, minute: 0 }; // ברירת מחדל: 18:00
  }
  
  // חישוב השעה הפופולרית ביותר
  const hourCounts = {};
  activityTimes.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const mostActiveHour = Object.keys(hourCounts).reduce((a, b) => 
    hourCounts[a] > hourCounts[b] ? a : b
  );
  
  return { 
    hour: parseInt(mostActiveHour), 
    minute: Math.floor(Math.random() * 60) // דקה אקראית
  };
};

// פונקציה לחישוב סוג התראה
const getNotificationType = (userProgress, goals) => {
  const completedQuestions = userProgress.completedQuestions || [];
  const today = new Date().toISOString().split('T')[0];
  
  // בדיקה אם כבר ענה על שאלות היום
  const todayQuestions = completedQuestions.filter(q => 
    q.answeredAt && q.answeredAt.startsWith(today)
  );
  
  if (todayQuestions.length === 0) {
    return 'daily_reminder';
  }
  
  // בדיקת מטרות
  const dailyGoal = goals.daily || 20;
  if (todayQuestions.length < dailyGoal) {
    const remaining = dailyGoal - todayQuestions.length;
    if (remaining <= 5) {
      return 'goal_almost_reached';
    } else {
      return 'goal_progress';
    }
  }
  
  // בדיקת רצף
  const streak = calculateStreak(completedQuestions);
  if (streak >= 3) {
    return 'streak_encouragement';
  }
  
  return 'general_encouragement';
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

// פונקציה ליצירת הודעות התראה
const generateNotificationMessage = (type, userProgress, goals, lang = 'he') => {
  const completedQuestions = userProgress.completedQuestions || [];
  const today = new Date().toISOString().split('T')[0];
  const todayQuestions = completedQuestions.filter(q => 
    q.answeredAt && q.answeredAt.startsWith(today)
  );
  
  const messages = {
    he: {
      daily_reminder: [
        "🌅 בוקר טוב! זמן מושלם להתחיל את היום עם תרגול תיאוריה",
        "☀️ יום חדש, הזדמנות חדשה ללמוד! בואו נתחיל עם כמה שאלות",
        "🚗 הבוקר הוא זמן נהדר לחזק את הידע שלך בתיאוריה",
        "📚 בואו נשמור על הרצף! זמן לתרגל כמה שאלות"
      ],
      goal_almost_reached: [
        `🎯 כל כך קרוב! נותרו רק ${goals.daily - todayQuestions.length} שאלות למטרה היומית`,
        `🔥 כמעט שם! עוד ${goals.daily - todayQuestions.length} שאלות ותגיע למטרה`,
        `⚡ עוד קצת! ${goals.daily - todayQuestions.length} שאלות נוספות למטרה היומית`,
        `🏆 כמעט הגעת! נותרו ${goals.daily - todayQuestions.length} שאלות למטרה`
      ],
      goal_progress: [
        `📊 התקדמות מעולה! ${todayQuestions.length}/${goals.daily} שאלות היום`,
        `💪 אתה בדרך הנכונה! ${todayQuestions.length}/${goals.daily} שאלות הושלמו`,
        `🎯 ממשיך להתקדם! ${todayQuestions.length}/${goals.daily} שאלות למטרה היומית`,
        `⭐ ביצועים טובים! ${todayQuestions.length}/${goals.daily} שאלות הושלמו`
      ],
      streak_encouragement: [
        `🔥 רצף מדהים! ${calculateStreak(completedQuestions)} ימים ברצף של תרגול`,
        `🏆 כל הכבוד על הרצף! ${calculateStreak(completedQuestions)} ימים של למידה`,
        `💎 רצף מרשים! ${calculateStreak(completedQuestions)} ימים ברצף של תרגול`,
        `⭐ ביצועים מעולים! ${calculateStreak(completedQuestions)} ימים ברצף`
      ],
      general_encouragement: [
        "🌟 המשך כך! אתה עושה עבודה נהדרת",
        "💪 כל שאלה מקרבת אותך לרישיון",
        "🎯 התמדה היא המפתח להצלחה",
        "🚀 אתה בדרך הנכונה להצלחה"
      ]
    },
    ar: {
      daily_reminder: [
        "🌅 صباح الخير! وقت مثالي لبدء اليوم بالتدريب على النظرية",
        "☀️ يوم جديد، فرصة جديدة للتعلم! دعنا نبدأ ببعض الأسئلة",
        "🚗 الصباح وقت رائع لتقوية معرفتك بالنظرية",
        "📚 دعنا نحافظ على الاستمرارية! وقت للتدريب على بعض الأسئلة"
      ],
      goal_almost_reached: [
        `🎯 قريب جداً! متبقي فقط ${goals.daily - todayQuestions.length} أسئلة للهدف اليومي`,
        `🔥 تقريباً هناك! ${goals.daily - todayQuestions.length} أسئلة أخرى للوصول للهدف`,
        `⚡ قليلاً أكثر! ${goals.daily - todayQuestions.length} أسئلة إضافية للهدف اليومي`,
        `🏆 تقريباً وصلت! متبقي ${goals.daily - todayQuestions.length} أسئلة للهدف`
      ],
      goal_progress: [
        `📊 تقدم ممتاز! ${todayQuestions.length}/${goals.daily} أسئلة اليوم`,
        `💪 أنت في الطريق الصحيح! ${todayQuestions.length}/${goals.daily} أسئلة مكتملة`,
        `🎯 تستمر في التقدم! ${todayQuestions.length}/${goals.daily} أسئلة للهدف اليومي`,
        `⭐ أداء جيد! ${todayQuestions.length}/${goals.daily} أسئلة مكتملة`
      ],
      streak_encouragement: [
        `🔥 سلسلة مذهلة! ${calculateStreak(completedQuestions)} أيام متتالية من التدريب`,
        `🏆 تهانينا على السلسلة! ${calculateStreak(completedQuestions)} أيام من التعلم`,
        `💎 سلسلة مثيرة للإعجاب! ${calculateStreak(completedQuestions)} أيام متتالية من التدريب`,
        `⭐ أداء ممتاز! ${calculateStreak(completedQuestions)} أيام متتالية`
      ],
      general_encouragement: [
        "🌟 استمر هكذا! أنت تقوم بعمل رائع",
        "💪 كل سؤال يقربك من الرخصة",
        "🎯 المثابرة هي مفتاح النجاح",
        "🚀 أنت في الطريق الصحيح للنجاح"
      ]
    }
  };
  
  const typeMessages = messages[lang]?.[type] || messages.he[type] || messages.he.general_encouragement;
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
};

// קבלת התראות למשתמש
exports.getNotifications = (req, res) => {
  const userId = req.params.userId;
  const lang = req.query.lang || 'he';
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const questionsData = getQuestionsByLang(lang);
    
    // חישוב מטרות
    const goals = {
      daily: 20,
      weekly: 100,
      monthly: 400
    };
    
    // חישוב זמן התראה אופטימלי
    const reminderTime = calculateOptimalReminderTime(userProgress);
    
    // קביעת סוג התראה
    const notificationType = getNotificationType(userProgress, goals);
    
    // יצירת הודעת התראה
    const message = generateNotificationMessage(notificationType, userProgress, goals, lang);
    
    // חישוב סטטיסטיקות
    const completedQuestions = userProgress.completedQuestions || [];
    const today = new Date().toISOString().split('T')[0];
    const todayQuestions = completedQuestions.filter(q => 
      q.answeredAt && q.answeredAt.startsWith(today)
    );
    
    const notifications = {
      message,
      type: notificationType,
      reminderTime,
      stats: {
        todayCompleted: todayQuestions.length,
        dailyGoal: goals.daily,
        streak: calculateStreak(completedQuestions),
        totalCompleted: completedQuestions.length
      },
      settings: {
        enabled: true,
        frequency: 'daily',
        time: reminderTime
      }
    };
    
    console.log(`Notifications generated for user ${userId}:`, notificationType);
    res.json(notifications);
    
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

// קבלת הגדרות התראות
exports.getNotificationSettings = (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const reminderTime = calculateOptimalReminderTime(userProgress);
    
    const settings = {
      enabled: true,
      frequency: 'daily',
      time: reminderTime,
      types: {
        dailyReminder: true,
        goalProgress: true,
        streakEncouragement: true,
        generalEncouragement: true
      },
      language: 'he'
    };
    
    res.json(settings);
    
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
};

// עדכון הגדרות התראות
exports.updateNotificationSettings = (req, res) => {
  const userId = req.params.userId;
  const { enabled, frequency, time, types, language } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    // כאן נוכל לשמור את ההגדרות במסד נתונים או בקובץ
    const updatedSettings = {
      enabled: enabled !== undefined ? enabled : true,
      frequency: frequency || 'daily',
      time: time || { hour: 18, minute: 0 },
      types: types || {
        dailyReminder: true,
        goalProgress: true,
        streakEncouragement: true,
        generalEncouragement: true
      },
      language: language || 'he',
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Notification settings updated for user ${userId}:`, updatedSettings);
    res.json({ success: true, settings: updatedSettings });
    
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
};

// שליחת התראה מיידית (לבדיקות)
exports.sendTestNotification = (req, res) => {
  const userId = req.params.userId;
  const lang = req.query.lang || 'he';
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    const userProgress = getUserProgress(userId);
    const goals = { daily: 20, weekly: 100, monthly: 400 };
    
    const notificationType = 'general_encouragement';
    const message = generateNotificationMessage(notificationType, userProgress, goals, lang);
    
    const testNotification = {
      message,
      type: notificationType,
      timestamp: new Date().toISOString(),
      isTest: true
    };
    
    console.log(`Test notification sent to user ${userId}`);
    res.json(testNotification);
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
};

// קבלת היסטוריית התראות
exports.getNotificationHistory = (req, res) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    // כאן נוכל לשמור היסטוריית התראות
    // כרגע נחזיר דוגמה
    const history = [
      {
        id: 1,
        message: "🌅 בוקר טוב! זמן מושלם להתחיל את היום עם תרגול תיאוריה",
        type: "daily_reminder",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true
      },
      {
        id: 2,
        message: "🎯 כל כך קרוב! נותרו רק 3 שאלות למטרה היומית",
        type: "goal_almost_reached",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: true
      },
      {
        id: 3,
        message: "🔥 רצף מדהים! 5 ימים ברצף של תרגול",
        type: "streak_encouragement",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        read: false
      }
    ].slice(0, limit);
    
    res.json(history);
    
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
};
