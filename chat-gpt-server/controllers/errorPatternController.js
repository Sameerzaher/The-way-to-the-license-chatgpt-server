const errorPatternService = require('../services/errorPatternService');
const userProgressFileService = require('../services/userProgressFileService');

/**
 * ניתוח דפוסי טעויות של משתמש
 */
const analyzeUserErrors = async (req, res) => {
  try {
    const { userId } = req.params;

    // קבלת היסטוריית תשובות המשתמש
    const userProgress = userProgressFileService.getUserProgress(userId);
    
    if (!userProgress || !userProgress.answers || userProgress.answers.length === 0) {
      return res.status(404).json({
        error: 'לא נמצאו נתוני תשובות למשתמש',
        message: 'יש לענות על שאלות לפני ניתוח דפוסים'
      });
    }

    // ניתוח הדפוסים
    const patterns = errorPatternService.analyzeUserErrors(userId, userProgress.answers);

    // שמירת הדפוסים
    errorPatternService.saveUserErrorPattern(userId, patterns);

    res.json({
      success: true,
      userId,
      patterns,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing user errors:', error);
    res.status(500).json({
      error: 'שגיאה בניתוח דפוסי טעויות',
      details: error.message
    });
  }
};

/**
 * קבלת המלצות AI מותאמות אישית
 */
const getAIRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    // קבלת דפוסי הטעויות (או ניתוח מחדש)
    let patterns = errorPatternService.getUserErrorPattern(userId);

    if (!patterns) {
      // אם אין דפוסים שמורים, נתח מחדש
      const userProgress = userProgressFileService.getUserProgress(userId);
      
      if (!userProgress || !userProgress.answers || userProgress.answers.length === 0) {
        return res.status(404).json({
          error: 'לא נמצאו נתונים למשתמש',
          message: 'יש לענות על שאלות לפני קבלת המלצות'
        });
      }

      patterns = errorPatternService.analyzeUserErrors(userId, userProgress.answers);
      errorPatternService.saveUserErrorPattern(userId, patterns);
    }

    // יצירת המלצות AI
    const recommendations = await errorPatternService.generateAIRecommendations(userId, patterns);

    res.json({
      success: true,
      userId,
      ...recommendations
    });

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({
      error: 'שגיאה ביצירת המלצות',
      details: error.message
    });
  }
};

/**
 * קבלת דפוסי טעויות שמורים
 */
const getErrorPatterns = async (req, res) => {
  try {
    const { userId } = req.params;

    const patterns = errorPatternService.getUserErrorPattern(userId);

    if (!patterns) {
      return res.status(404).json({
        error: 'לא נמצאו דפוסי טעויות למשתמש',
        message: 'בצע ניתוח דפוסים תחילה'
      });
    }

    res.json({
      success: true,
      userId,
      patterns
    });

  } catch (error) {
    console.error('Error getting error patterns:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת דפוסי טעויות',
      details: error.message
    });
  }
};

/**
 * קבלת תובנות מתקדמות
 */
const getAdvancedInsights = async (req, res) => {
  try {
    const { userId } = req.params;

    const insights = errorPatternService.getAdvancedInsights(userId);

    if (!insights) {
      return res.status(404).json({
        error: 'לא נמצאו תובנות למשתמש',
        message: 'בצע ניתוח דפוסים תחילה'
      });
    }

    res.json({
      success: true,
      userId,
      insights
    });

  } catch (error) {
    console.error('Error getting advanced insights:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת תובנות',
      details: error.message
    });
  }
};

/**
 * קבלת דו"ח מקיף
 */
const getComprehensiveReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // ניתוח דפוסים
    const userProgress = userProgressFileService.getUserProgress(userId);
    
    if (!userProgress || !userProgress.answers || userProgress.answers.length === 0) {
      return res.status(404).json({
        error: 'לא נמצאו נתונים למשתמש'
      });
    }

    const patterns = errorPatternService.analyzeUserErrors(userId, userProgress.answers);
    errorPatternService.saveUserErrorPattern(userId, patterns);

    // תובנות מתקדמות
    const insights = errorPatternService.getAdvancedInsights(userId);

    // המלצות AI
    const aiRecommendations = await errorPatternService.generateAIRecommendations(userId, patterns);

    // דו"ח מקיף
    const report = {
      userId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalQuestions: patterns.statistics.totalQuestions,
        totalErrors: patterns.statistics.totalErrors,
        errorRate: patterns.statistics.errorRate,
        readinessScore: insights.readinessScore.score,
        readinessLevel: insights.readinessScore.level
      },
      patterns,
      insights,
      aiRecommendations: aiRecommendations.recommendations,
      actionPlan: insights.nextSteps
    };

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({
      error: 'שגיאה ביצירת דו"ח מקיף',
      details: error.message
    });
  }
};

/**
 * עדכון דפוס טעויות ידני
 */
const updateErrorPattern = async (req, res) => {
  try {
    const { userId } = req.params;
    const { manualNotes, customGoals } = req.body;

    let patterns = errorPatternService.getUserErrorPattern(userId);

    if (!patterns) {
      return res.status(404).json({
        error: 'לא נמצאו דפוסים למשתמש'
      });
    }

    // הוספת הערות ומטרות מותאמות אישית
    patterns.manualNotes = manualNotes || patterns.manualNotes;
    patterns.customGoals = customGoals || patterns.customGoals;
    patterns.lastManualUpdate = new Date().toISOString();

    errorPatternService.saveUserErrorPattern(userId, patterns);

    res.json({
      success: true,
      message: 'דפוסי הטעויות עודכנו בהצלחה',
      patterns
    });

  } catch (error) {
    console.error('Error updating error pattern:', error);
    res.status(500).json({
      error: 'שגיאה בעדכון דפוסי טעויות',
      details: error.message
    });
  }
};

/**
 * השוואה בין תקופות
 */
const compareProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const userProgress = userProgressFileService.getUserProgress(userId);
    
    if (!userProgress || !userProgress.answers || userProgress.answers.length === 0) {
      return res.status(404).json({
        error: 'לא נמצאו נתונים למשתמש'
      });
    }

    const now = new Date();
    const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);

    // חלוקה לתקופות
    const recentAnswers = userProgress.answers.filter(a => 
      new Date(a.timestamp) >= cutoffDate
    );
    const olderAnswers = userProgress.answers.filter(a => 
      new Date(a.timestamp) < cutoffDate
    );

    if (recentAnswers.length === 0 || olderAnswers.length === 0) {
      return res.status(400).json({
        error: 'אין מספיק נתונים להשוואה',
        message: 'נדרשים נתונים משתי תקופות שונות'
      });
    }

    // ניתוח כל תקופה
    const recentPatterns = errorPatternService.analyzeUserErrors(userId, recentAnswers);
    const olderPatterns = errorPatternService.analyzeUserErrors(userId, olderAnswers);

    // חישוב שיפור
    const improvement = {
      errorRateChange: (olderPatterns.statistics.errorRate - recentPatterns.statistics.errorRate).toFixed(2),
      answersImprovement: recentAnswers.length - olderAnswers.length,
      subjectsImproved: [],
      subjectsDeclined: []
    };

    // השוואה לפי נושאים
    const allSubjects = new Set([
      ...Object.keys(recentPatterns.bySubject),
      ...Object.keys(olderPatterns.bySubject)
    ]);

    allSubjects.forEach(subject => {
      const recentErrors = recentPatterns.bySubject[subject] || 0;
      const olderErrors = olderPatterns.bySubject[subject] || 0;
      
      if (recentErrors < olderErrors) {
        improvement.subjectsImproved.push({
          subject,
          improvement: olderErrors - recentErrors
        });
      } else if (recentErrors > olderErrors) {
        improvement.subjectsDeclined.push({
          subject,
          decline: recentErrors - olderErrors
        });
      }
    });

    res.json({
      success: true,
      userId,
      comparisonPeriod: `${days} ימים`,
      recentPeriod: {
        patterns: recentPatterns,
        questionsCount: recentAnswers.length
      },
      olderPeriod: {
        patterns: olderPatterns,
        questionsCount: olderAnswers.length
      },
      improvement
    });

  } catch (error) {
    console.error('Error comparing progress:', error);
    res.status(500).json({
      error: 'שגיאה בהשוואת התקדמות',
      details: error.message
    });
  }
};

module.exports = {
  analyzeUserErrors,
  getAIRecommendations,
  getErrorPatterns,
  getAdvancedInsights,
  getComprehensiveReport,
  updateErrorPattern,
  compareProgress
};

