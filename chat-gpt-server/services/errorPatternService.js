const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class ErrorPatternService {
  constructor() {
    this.errorPatternsPath = path.join(__dirname, '../data/errorPatterns.json');
    this.ensureErrorPatternsFile();
  }

  // יצירת קובץ דפוסי טעויות אם לא קיים
  ensureErrorPatternsFile() {
    if (!fs.existsSync(this.errorPatternsPath)) {
      fs.writeFileSync(this.errorPatternsPath, JSON.stringify({}, null, 2));
    }
  }

  // קריאת כל דפוסי הטעויות
  loadErrorPatterns() {
    try {
      const data = fs.readFileSync(this.errorPatternsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading error patterns:', error);
      return {};
    }
  }

  // שמירת דפוסי טעויות
  saveErrorPatterns(patterns) {
    try {
      fs.writeFileSync(this.errorPatternsPath, JSON.stringify(patterns, null, 2));
    } catch (error) {
      console.error('Error saving error patterns:', error);
    }
  }

  // ניתוח טעויות של משתמש ספציפי
  analyzeUserErrors(userId, userAnswers) {
    const patterns = {
      bySubject: {},           // טעויות לפי נושא
      byCategory: {},          // טעויות לפי קטגוריה
      timeOfDay: {},           // טעויות לפי שעה ביום
      questionTypes: {},       // טעויות לפי סוג שאלה
      repeatedErrors: [],      // שאלות שטעו בהן פעמיים או יותר
      improvementAreas: [],    // תחומים לשיפור
      strengths: [],           // תחומים חזקים
      statistics: {
        totalQuestions: 0,
        totalErrors: 0,
        errorRate: 0,
        averageTimePerQuestion: 0,
        fastErrors: 0,         // טעויות בגלל מהירות מדי
        slowErrors: 0          // טעויות למרות זמן חשיבה ארוך
      }
    };

    const wrongAnswers = userAnswers.filter(a => !a.isCorrect);
    const correctAnswers = userAnswers.filter(a => a.isCorrect);

    patterns.statistics.totalQuestions = userAnswers.length;
    patterns.statistics.totalErrors = wrongAnswers.length;
    patterns.statistics.errorRate = userAnswers.length > 0 
      ? (wrongAnswers.length / userAnswers.length * 100).toFixed(2) 
      : 0;

    // חישוב זמן ממוצע
    const totalTime = userAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    patterns.statistics.averageTimePerQuestion = userAnswers.length > 0
      ? (totalTime / userAnswers.length).toFixed(2)
      : 0;

    // ניתוח לפי נושא
    wrongAnswers.forEach(answer => {
      const subject = answer.subject || 'לא מסווג';
      patterns.bySubject[subject] = (patterns.bySubject[subject] || 0) + 1;
    });

    // ניתוח לפי קטגוריה
    wrongAnswers.forEach(answer => {
      const category = answer.category || 'כללי';
      patterns.byCategory[category] = (patterns.byCategory[category] || 0) + 1;
    });

    // ניתוח לפי שעה ביום
    wrongAnswers.forEach(answer => {
      if (answer.timestamp) {
        const hour = new Date(answer.timestamp).getHours();
        const timeSlot = this.getTimeSlot(hour);
        patterns.timeOfDay[timeSlot] = (patterns.timeOfDay[timeSlot] || 0) + 1;
      }
    });

    // ניתוח זמן תגובה
    wrongAnswers.forEach(answer => {
      if (answer.timeSpent) {
        if (answer.timeSpent < 5) {
          patterns.statistics.fastErrors++;
        } else if (answer.timeSpent > 30) {
          patterns.statistics.slowErrors++;
        }
      }
    });

    // זיהוי טעויות חוזרות
    const errorCount = {};
    wrongAnswers.forEach(answer => {
      const qId = answer.questionId;
      errorCount[qId] = (errorCount[qId] || 0) + 1;
    });

    patterns.repeatedErrors = Object.entries(errorCount)
      .filter(([_, count]) => count >= 2)
      .map(([questionId, count]) => ({
        questionId,
        errorCount: count,
        lastError: wrongAnswers.find(a => a.questionId === questionId)?.timestamp
      }))
      .sort((a, b) => b.errorCount - a.errorCount);

    // זיהוי תחומי חוזק
    const correctBySubject = {};
    correctAnswers.forEach(answer => {
      const subject = answer.subject || 'לא מסווג';
      correctBySubject[subject] = (correctBySubject[subject] || 0) + 1;
    });

    patterns.strengths = Object.entries(correctBySubject)
      .filter(([subject, count]) => {
        const total = (patterns.bySubject[subject] || 0) + count;
        return count / total > 0.8; // 80% הצלחה ומעלה
      })
      .map(([subject, count]) => ({
        subject,
        correctCount: count,
        successRate: ((count / ((patterns.bySubject[subject] || 0) + count)) * 100).toFixed(2)
      }));

    // זיהוי תחומים לשיפור
    patterns.improvementAreas = Object.entries(patterns.bySubject)
      .map(([subject, errorCount]) => {
        const correctCount = correctBySubject[subject] || 0;
        const total = errorCount + correctCount;
        return {
          subject,
          errorCount,
          totalQuestions: total,
          errorRate: ((errorCount / total) * 100).toFixed(2)
        };
      })
      .filter(area => area.errorRate > 30)
      .sort((a, b) => b.errorRate - a.errorRate);

    return patterns;
  }

  // המרת שעה לטווח זמן
  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'בוקר (6-12)';
    if (hour >= 12 && hour < 18) return 'צהריים (12-18)';
    if (hour >= 18 && hour < 22) return 'ערב (18-22)';
    return 'לילה (22-6)';
  }

  // שמירת דפוס טעויות למשתמש
  saveUserErrorPattern(userId, patterns) {
    const allPatterns = this.loadErrorPatterns();
    allPatterns[userId] = {
      ...patterns,
      lastUpdated: new Date().toISOString(),
      analysisCount: (allPatterns[userId]?.analysisCount || 0) + 1
    };
    this.saveErrorPatterns(allPatterns);
  }

  // קבלת דפוס טעויות של משתמש
  getUserErrorPattern(userId) {
    const patterns = this.loadErrorPatterns();
    return patterns[userId] || null;
  }

  // יצירת המלצות AI מותאמות אישית
  async generateAIRecommendations(userId, patterns) {
    try {
      const prompt = this.buildRecommendationPrompt(patterns);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `אתה מורה מנוסה לבחינת תאוריה לרישיון נהיגה. תפקידך לנתח את דפוסי הטעויות של התלמיד ולתת המלצות מותאמות אישית בעברית. היה ספציפי, מעודד ומקצועי.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const aiRecommendations = completion.choices[0].message.content;

      return {
        recommendations: aiRecommendations,
        generatedAt: new Date().toISOString(),
        patterns: patterns
      };
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return {
        recommendations: this.getFallbackRecommendations(patterns),
        generatedAt: new Date().toISOString(),
        patterns: patterns,
        error: 'נוצרו המלצות בסיסיות - שירות AI זמני לא זמין'
      };
    }
  }

  // בניית prompt ל-AI
  buildRecommendationPrompt(patterns) {
    const stats = patterns.statistics;
    let prompt = `נתח את דפוסי הטעויות הבאים של תלמיד לבחינת תאוריה:\n\n`;
    
    prompt += `📊 סטטיסטיקות כלליות:\n`;
    prompt += `- סה״כ שאלות: ${stats.totalQuestions}\n`;
    prompt += `- סה״כ טעויות: ${stats.totalErrors}\n`;
    prompt += `- אחוז טעויות: ${stats.errorRate}%\n`;
    prompt += `- זמן ממוצע לשאלה: ${stats.averageTimePerQuestion} שניות\n`;
    prompt += `- טעויות מהירות מדי: ${stats.fastErrors}\n`;
    prompt += `- טעויות איטיות: ${stats.slowErrors}\n\n`;

    if (Object.keys(patterns.bySubject).length > 0) {
      prompt += `🎯 טעויות לפי נושא:\n`;
      Object.entries(patterns.bySubject)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([subject, count]) => {
          prompt += `- ${subject}: ${count} טעויות\n`;
        });
      prompt += `\n`;
    }

    if (patterns.improvementAreas.length > 0) {
      prompt += `⚠️ תחומים לשיפור:\n`;
      patterns.improvementAreas.slice(0, 3).forEach(area => {
        prompt += `- ${area.subject}: ${area.errorRate}% טעויות (${area.errorCount}/${area.totalQuestions})\n`;
      });
      prompt += `\n`;
    }

    if (patterns.strengths.length > 0) {
      prompt += `💪 תחומי חוזק:\n`;
      patterns.strengths.slice(0, 3).forEach(strength => {
        prompt += `- ${strength.subject}: ${strength.successRate}% הצלחה\n`;
      });
      prompt += `\n`;
    }

    if (patterns.repeatedErrors.length > 0) {
      prompt += `🔄 טעויות חוזרות: ${patterns.repeatedErrors.length} שאלות\n\n`;
    }

    if (Object.keys(patterns.timeOfDay).length > 0) {
      prompt += `🕐 טעויות לפי שעות היום:\n`;
      Object.entries(patterns.timeOfDay)
        .sort((a, b) => b[1] - a[1])
        .forEach(([timeSlot, count]) => {
          prompt += `- ${timeSlot}: ${count} טעויות\n`;
        });
      prompt += `\n`;
    }

    prompt += `\nבהתבסס על הנתונים האלה, תן:\n`;
    prompt += `1. ניתוח קצר של דפוסי הטעויות (2-3 משפטים)\n`;
    prompt += `2. 3-5 המלצות ספציפיות לשיפור\n`;
    prompt += `3. תוכנית לימוד מומלצת\n`;
    prompt += `4. מילות עידוד והמלצות פסיכולוגיות\n`;
    prompt += `\nהשב בעברית בצורה ברורה ומסודרת.`;

    return prompt;
  }

  // המלצות חלופיות במקרה של כשל ב-AI
  getFallbackRecommendations(patterns) {
    let recommendations = `📊 ניתוח דפוסי הטעויות שלך:\n\n`;

    if (patterns.statistics.errorRate > 40) {
      recommendations += `⚠️ אחוז הטעויות שלך גבוה (${patterns.statistics.errorRate}%). מומלץ להאט ולקרוא כל שאלה בעיון.\n\n`;
    } else if (patterns.statistics.errorRate < 20) {
      recommendations += `✅ אחוז הטעויות שלך נמוך (${patterns.statistics.errorRate}%) - אתה בכיוון הנכון!\n\n`;
    }

    if (patterns.statistics.fastErrors > patterns.statistics.totalErrors * 0.3) {
      recommendations += `⏱️ הרבה מהטעויות שלך נובעות ממהירות יתר. נסה להקדיש לפחות 10 שניות לכל שאלה.\n\n`;
    }

    if (patterns.improvementAreas.length > 0) {
      recommendations += `🎯 תחומים לשיפור:\n`;
      patterns.improvementAreas.slice(0, 3).forEach(area => {
        recommendations += `- התמקד ב${area.subject} - ${area.errorCount} טעויות\n`;
      });
      recommendations += `\n`;
    }

    if (patterns.repeatedErrors.length > 0) {
      recommendations += `🔄 יש לך ${patterns.repeatedErrors.length} שאלות שטעית בהן יותר מפעם אחת. חזור עליהן!\n\n`;
    }

    recommendations += `💡 המלצות:\n`;
    recommendations += `1. תרגל 15-20 דקות ביום בזמנים קבועים\n`;
    recommendations += `2. התמקד בנושאים החלשים ביותר\n`;
    recommendations += `3. חזור על שאלות שטעית בהן\n`;
    recommendations += `4. קרא כל שאלה פעמיים לפני המענה\n`;

    return recommendations;
  }

  // קבלת תובנות מתקדמות
  getAdvancedInsights(userId) {
    const patterns = this.getUserErrorPattern(userId);
    if (!patterns) return null;

    const insights = {
      learningStyle: this.determineLearningStyle(patterns),
      riskFactors: this.identifyRiskFactors(patterns),
      readinessScore: this.calculateReadinessScore(patterns),
      nextSteps: this.suggestNextSteps(patterns)
    };

    return insights;
  }

  // זיהוי סגנון למידה
  determineLearningStyle(patterns) {
    const stats = patterns.statistics;
    
    if (stats.fastErrors > stats.totalErrors * 0.4) {
      return {
        type: 'impulsive',
        description: 'נוטה לענות מהר מדי - צריך להאט ולהתרכז',
        recommendation: 'תרגל עם טיימר מינימלי של 10 שניות לשאלה'
      };
    } else if (stats.slowErrors > stats.totalErrors * 0.4) {
      return {
        type: 'overthinking',
        description: 'נוטה לחשוב יתר על המידה',
        recommendation: 'סמוך על האינסטינקט הראשוני שלך'
      };
    } else {
      return {
        type: 'balanced',
        description: 'סגנון למידה מאוזן',
        recommendation: 'המשך כך - קצב טוב!'
      };
    }
  }

  // זיהוי גורמי סיכון
  identifyRiskFactors(patterns) {
    const risks = [];

    if (patterns.statistics.errorRate > 30) {
      risks.push({
        level: 'high',
        factor: 'אחוז טעויות גבוה',
        action: 'דרושה תרגול נוסף לפני הבחינה'
      });
    }

    if (patterns.repeatedErrors.length > 10) {
      risks.push({
        level: 'medium',
        factor: 'טעויות חוזרות',
        action: 'חזור על השאלות הבעייתיות'
      });
    }

    if (patterns.improvementAreas.length > 5) {
      risks.push({
        level: 'medium',
        factor: 'חולשות בנושאים רבים',
        action: 'התמקד בנושא אחד בכל פעם'
      });
    }

    return risks;
  }

  // חישוב ציון מוכנות
  calculateReadinessScore(patterns) {
    let score = 100;

    // קנס על אחוז טעויות
    score -= patterns.statistics.errorRate;

    // קנס על טעויות חוזרות
    score -= patterns.repeatedErrors.length * 2;

    // בונוס על תחומי חוזק
    score += patterns.strengths.length * 5;

    // קנס על תחומים לשיפור
    score -= patterns.improvementAreas.length * 3;

    score = Math.max(0, Math.min(100, score));

    let level;
    if (score >= 80) level = 'excellent';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    else level = 'needs-improvement';

    return {
      score: Math.round(score),
      level,
      message: this.getReadinessMessage(score)
    };
  }

  getReadinessMessage(score) {
    if (score >= 80) return 'אתה מוכן לבחינה! 🎉';
    if (score >= 60) return 'בכיוון הנכון - עוד קצת תרגול';
    if (score >= 40) return 'צריך עוד תרגול משמעותי';
    return 'מומלץ להתמקד בלמידה לפני הבחינה';
  }

  // הצעת צעדים הבאים
  suggestNextSteps(patterns) {
    const steps = [];

    if (patterns.improvementAreas.length > 0) {
      const topWeakness = patterns.improvementAreas[0];
      steps.push({
        priority: 1,
        action: `תרגל ${topWeakness.subject}`,
        duration: '20 דקות ביום',
        goal: `צמצום טעויות ב-50%`
      });
    }

    if (patterns.repeatedErrors.length > 0) {
      steps.push({
        priority: 2,
        action: 'חזרה על שאלות בעייתיות',
        duration: '10 דקות ביום',
        goal: `פתרון ${patterns.repeatedErrors.length} שאלות חוזרות`
      });
    }

    if (patterns.statistics.fastErrors > 5) {
      steps.push({
        priority: 3,
        action: 'תרגול עם הגבלת זמן מינימלי',
        duration: '15 דקות',
        goal: 'שיפור ריכוז וקריאה'
      });
    }

    steps.push({
      priority: 4,
      action: 'בחינה מדומה',
      duration: '40 דקות',
      goal: 'סימולציה של תנאי מבחן אמיתיים'
    });

    return steps;
  }
}

module.exports = new ErrorPatternService();

