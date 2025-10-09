const { getUserProgress, saveProgress } = require('./userProgressFileService');

// פונקציה לקבלת שם אייקון
function getIconName(achievementId) {
  const iconMap = {
    'first_exam': 'first',
    'exam_veteran': 'veteran',
    'exam_master': 'master',
    'perfect_score': 'perfect',
    'high_scorer': 'high-score',
    'consistent': 'consistent',
    'speed_demon': 'speed',
    'time_master': 'time',
    'accuracy_king': 'accuracy',
    'improvement': 'improvement',
    'traffic_expert': 'traffic',
    'sign_expert': 'sign',
    'safety_expert': 'safety',
    'weekend_warrior': 'weekend',
    'night_owl': 'night',
    'early_bird': 'morning'
  };
  
  return iconMap[achievementId] || 'achievements';
}

// הישגים לבחינות
const EXAM_ACHIEVEMENTS = {
  // הישגי כמות
  FIRST_EXAM: {
    id: 'first_exam',
    name: 'מתחיל בדרך',
    description: 'עברת את הבחינה הראשונה שלך!',
    icon: '🎯',
    condition: { type: 'exam_count', value: 1 }
  },
  EXAM_VETERAN: {
    id: 'exam_veteran',
    name: 'מומחה בחינות',
    description: 'עברת 10 בחינות',
    icon: '🏆',
    condition: { type: 'exam_count', value: 10 }
  },
  EXAM_MASTER: {
    id: 'exam_master',
    name: 'אלוף בחינות',
    description: 'עברת 25 בחינות',
    icon: '👑',
    condition: { type: 'exam_count', value: 25 }
  },

  // הישגי ציון
  PERFECT_SCORE: {
    id: 'perfect_score',
    name: 'ציון מושלם',
    description: 'קיבלת 30/30 בבחינה',
    icon: '💯',
    condition: { type: 'perfect_score', value: 30 }
  },
  HIGH_SCORER: {
    id: 'high_scorer',
    name: 'ציון גבוה',
    description: 'קיבלת 28+ בבחינה',
    icon: '⭐',
    condition: { type: 'min_score', value: 28 }
  },
  CONSISTENT: {
    id: 'consistent',
    name: 'עקבי',
    description: 'עברת 5 בחינות ברצף',
    icon: '🔥',
    condition: { type: 'consecutive_passed', value: 5 }
  },

  // הישגי זמן
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'מהיר כברק',
    description: 'סיימת בחינה תוך 20 דקות',
    icon: '⚡',
    condition: { type: 'fast_completion', value: 20 * 60 * 1000 }
  },
  TIME_MASTER: {
    id: 'time_master',
    name: 'מנהל זמן',
    description: 'סיימת 10 בחינות בזמן',
    icon: '⏰',
    condition: { type: 'on_time_completions', value: 10 }
  },

  // הישגי דיוק
  ACCURACY_KING: {
    id: 'accuracy_king',
    name: 'מלך הדיוק',
    description: '95%+ דיוק ב-10 בחינות',
    icon: '🎯',
    condition: { type: 'accuracy_streak', value: { accuracy: 95, count: 10 } }
  },
  IMPROVEMENT: {
    id: 'improvement',
    name: 'משתפר',
    description: 'שיפרת את הציון ב-5 נקודות',
    icon: '📈',
    condition: { type: 'score_improvement', value: 5 }
  },

  // הישגי נושאים
  TRAFFIC_EXPERT: {
    id: 'traffic_expert',
    name: 'מומחה תנועה',
    description: '100% בחוקי התנועה',
    icon: '🚦',
    condition: { type: 'category_mastery', value: { category: 'חוקי התנועה', accuracy: 100 } }
  },
  SIGN_EXPERT: {
    id: 'sign_expert',
    name: 'מומחה תמרורים',
    description: '100% בתמרורים',
    icon: '🛑',
    condition: { type: 'category_mastery', value: { category: 'תמרורים', accuracy: 100 } }
  },
  SAFETY_EXPERT: {
    id: 'safety_expert',
    name: 'מומחה בטיחות',
    description: '100% בבטיחות',
    icon: '🛡️',
    condition: { type: 'category_mastery', value: { category: 'בטיחות', accuracy: 100 } }
  },

  // הישגים מיוחדים
  WEEKEND_WARRIOR: {
    id: 'weekend_warrior',
    name: 'לוחם סוף שבוע',
    description: 'עברת בחינה בסוף שבוע',
    icon: '🏃‍♂️',
    condition: { type: 'weekend_exam', value: true }
  },
  NIGHT_OWL: {
    id: 'night_owl',
    name: 'ינשוף לילה',
    description: 'עברת בחינה אחרי 22:00',
    icon: '🦉',
    condition: { type: 'night_exam', value: true }
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'ציפור בוקר',
    description: 'עברת בחינה לפני 7:00',
    icon: '🐦',
    condition: { type: 'early_exam', value: true }
  }
};

// בדיקת הישגים
function checkAchievements(userId, examResult) {
  const userProgress = getUserProgress(userId);
  
  if (!userProgress.achievements) {
    userProgress.achievements = [];
  }

  if (!userProgress.examStats) {
    userProgress.examStats = {
      totalExams: 0,
      passedExams: 0,
      failedExams: 0,
      averageScore: 0,
      bestScore: 0,
      lastExamDate: null,
      consecutivePassed: 0,
      consecutiveFailed: 0,
      categoryStats: {},
      timeStats: {
        fastCompletions: 0,
        onTimeCompletions: 0
      }
    };
  }

  const newAchievements = [];
  const examDate = new Date(examResult.endTime || examResult.startTime);
  const isWeekend = examDate.getDay() === 0 || examDate.getDay() === 6;
  const isNight = examDate.getHours() >= 22;
  const isEarly = examDate.getHours() <= 7;

  // עדכון סטטיסטיקות
  userProgress.examStats.totalExams += 1;
  if (examResult.passed) {
    userProgress.examStats.passedExams += 1;
    userProgress.examStats.consecutivePassed += 1;
    userProgress.examStats.consecutiveFailed = 0;
  } else {
    userProgress.examStats.failedExams += 1;
    userProgress.examStats.consecutiveFailed += 1;
    userProgress.examStats.consecutivePassed = 0;
  }

  if (examResult.score > userProgress.examStats.bestScore) {
    userProgress.examStats.bestScore = examResult.score;
  }

  // עדכון סטטיסטיקות זמן
  if (examResult.timeSpent) {
    const timeMinutes = examResult.timeSpent / (1000 * 60);
    if (timeMinutes <= 20) {
      userProgress.examStats.timeStats.fastCompletions += 1;
    }
    if (timeMinutes <= 40) {
      userProgress.examStats.timeStats.onTimeCompletions += 1;
    }
  }

  // בדיקת הישגים
  for (const [achievementId, achievement] of Object.entries(EXAM_ACHIEVEMENTS)) {
    // בדיקה אם ההישג כבר קיים
    if (userProgress.achievements.find(a => a.id === achievementId)) {
      continue;
    }

    let shouldUnlock = false;

    switch (achievement.condition.type) {
      case 'exam_count':
        shouldUnlock = userProgress.examStats.totalExams >= achievement.condition.value;
        break;

      case 'perfect_score':
        shouldUnlock = examResult.score === achievement.condition.value;
        break;

      case 'min_score':
        shouldUnlock = examResult.score >= achievement.condition.value;
        break;

      case 'consecutive_passed':
        shouldUnlock = userProgress.examStats.consecutivePassed >= achievement.condition.value;
        break;

      case 'fast_completion':
        shouldUnlock = examResult.timeSpent && examResult.timeSpent <= achievement.condition.value;
        break;

      case 'on_time_completions':
        shouldUnlock = userProgress.examStats.timeStats.onTimeCompletions >= achievement.condition.value;
        break;

      case 'accuracy_streak':
        // דרוש חישוב מורכב יותר
        shouldUnlock = checkAccuracyStreak(userProgress, achievement.condition.value);
        break;

      case 'score_improvement':
        shouldUnlock = checkScoreImprovement(userProgress, achievement.condition.value);
        break;

      case 'category_mastery':
        shouldUnlock = checkCategoryMastery(examResult, achievement.condition.value);
        break;

      case 'weekend_exam':
        shouldUnlock = isWeekend;
        break;

      case 'night_exam':
        shouldUnlock = isNight;
        break;

      case 'early_exam':
        shouldUnlock = isEarly;
        break;
    }

    if (shouldUnlock) {
      const newAchievement = {
        ...achievement,
        iconName: getIconName(achievementId),
        unlockedAt: new Date().toISOString(),
        examId: examResult.examId
      };

      userProgress.achievements.push(newAchievement);
      newAchievements.push(newAchievement);
      
      console.log(`🏆 Achievement unlocked: ${achievement.name} for user ${userId}`);
    }
  }

  // שמירת ההתקדמות
  saveProgress(userProgress);

  return {
    newAchievements,
    totalAchievements: userProgress.achievements.length,
    stats: userProgress.examStats
  };
}

// בדיקת רצף דיוק
function checkAccuracyStreak(userProgress, condition) {
  const { accuracy, count } = condition;
  
  if (!userProgress.exams || userProgress.exams.length < count) {
    return false;
  }

  const recentExams = userProgress.exams
    .filter(e => e.accuracy && e.accuracy >= accuracy)
    .slice(0, count);

  return recentExams.length >= count;
}

// בדיקת שיפור ציון
function checkScoreImprovement(userProgress, improvement) {
  if (!userProgress.exams || userProgress.exams.length < 2) {
    return false;
  }

  const sortedExams = userProgress.exams
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  const firstScore = sortedExams[0].score;
  const latestScore = sortedExams[sortedExams.length - 1].score;

  return latestScore - firstScore >= improvement;
}

// בדיקת שליטה בנושא
function checkCategoryMastery(examResult, condition) {
  if (!examResult.categoryBreakdown) {
    return false;
  }

  const category = examResult.categoryBreakdown[condition.category];
  if (!category) {
    return false;
  }

  const accuracy = (category.correct / category.total) * 100;
  return accuracy >= condition.accuracy;
}

// קבלת כל ההישגים
function getAllAchievements() {
  return Object.values(EXAM_ACHIEVEMENTS);
}

// קבלת הישגי משתמש
function getUserAchievements(userId) {
  const userProgress = getUserProgress(userId);
  return userProgress.achievements || [];
}

// קבלת הישגים לא נפתחו
function getUnlockedAchievements(userId) {
  const allAchievements = getAllAchievements();
  const userAchievements = getUserAchievements(userId);
  const unlockedIds = userAchievements.map(a => a.id);
  
  return allAchievements.filter(a => !unlockedIds.includes(a.id));
}

module.exports = {
  checkAchievements,
  getAllAchievements,
  getUserAchievements,
  getUnlockedAchievements,
  getIconName,
  EXAM_ACHIEVEMENTS
};
