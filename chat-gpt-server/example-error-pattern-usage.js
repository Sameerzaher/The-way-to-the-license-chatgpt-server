/**
 * 📚 דוגמאות שימוש במערכת זיהוי דפוסי טעויות
 * 
 * קובץ זה מכיל דוגמאות מעשיות לשימוש ב-API
 */

const baseURL = 'http://localhost:3000';

// ===============================================
// דוגמה 1: ניתוח דפוסי טעויות בסיסי
// ===============================================

async function example1_analyzeErrors() {
  console.log('📊 דוגמה 1: ניתוח דפוסי טעויות\n');
  
  const userId = 'demo_user_123';
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ ניתוח הצליח!');
      console.log(`📈 סטטיסטיקות:`);
      console.log(`   - סה"כ שאלות: ${data.patterns.statistics.totalQuestions}`);
      console.log(`   - סה"כ טעויות: ${data.patterns.statistics.totalErrors}`);
      console.log(`   - אחוז טעויות: ${data.patterns.statistics.errorRate}%`);
      console.log(`   - זמן ממוצע: ${data.patterns.statistics.averageTimePerQuestion} שניות\n`);
      
      // הצגת נושאים לשיפור
      if (data.patterns.improvementAreas.length > 0) {
        console.log('⚠️  תחומים לשיפור:');
        data.patterns.improvementAreas.slice(0, 3).forEach((area, index) => {
          console.log(`   ${index + 1}. ${area.subject}: ${area.errorRate}% טעויות`);
        });
      }
      
      // הצגת תחומי חוזק
      if (data.patterns.strengths.length > 0) {
        console.log('\n💪 תחומי חוזק:');
        data.patterns.strengths.slice(0, 3).forEach((strength, index) => {
          console.log(`   ${index + 1}. ${strength.subject}: ${strength.successRate}% הצלחה`);
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  }
}

// ===============================================
// דוגמה 2: קבלת המלצות AI
// ===============================================

async function example2_getAIRecommendations() {
  console.log('\n🤖 דוגמה 2: קבלת המלצות AI\n');
  
  const userId = 'demo_user_123';
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/recommendations`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ המלצות התקבלו!\n');
      console.log('💡 המלצות AI:');
      console.log('─'.repeat(60));
      console.log(data.recommendations);
      console.log('─'.repeat(60));
    }
    
    return data;
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  }
}

// ===============================================
// דוגמה 3: קבלת תובנות מתקדמות
// ===============================================

async function example3_getInsights() {
  console.log('\n🔍 דוגמה 3: תובנות מתקדמות\n');
  
  const userId = 'demo_user_123';
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/insights`);
    const data = await response.json();
    
    if (data.success) {
      const { insights } = data;
      
      console.log('✅ תובנות התקבלו!\n');
      
      // ציון מוכנות
      console.log(`🎯 ציון מוכנות: ${insights.readinessScore.score}/100`);
      console.log(`   רמה: ${insights.readinessScore.level}`);
      console.log(`   הודעה: ${insights.readinessScore.message}\n`);
      
      // סגנון למידה
      console.log(`📚 סגנון למידה: ${insights.learningStyle.type}`);
      console.log(`   תיאור: ${insights.learningStyle.description}`);
      console.log(`   המלצה: ${insights.learningStyle.recommendation}\n`);
      
      // גורמי סיכון
      if (insights.riskFactors.length > 0) {
        console.log('⚠️  גורמי סיכון:');
        insights.riskFactors.forEach((risk, index) => {
          console.log(`   ${index + 1}. [${risk.level}] ${risk.factor}`);
          console.log(`      פעולה: ${risk.action}`);
        });
      }
      
      // צעדים הבאים
      console.log('\n📋 צעדים הבאים:');
      insights.nextSteps.forEach((step) => {
        console.log(`   ${step.priority}. ${step.action}`);
        console.log(`      משך: ${step.duration} | מטרה: ${step.goal}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  }
}

// ===============================================
// דוגמה 4: קבלת דו"ח מקיף
// ===============================================

async function example4_getComprehensiveReport() {
  console.log('\n📊 דוגמה 4: דו"ח מקיף\n');
  
  const userId = 'demo_user_123';
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/report`);
    const data = await response.json();
    
    if (data.success) {
      const { report } = data;
      
      console.log('✅ דו"ח נוצר בהצלחה!\n');
      console.log('═'.repeat(60));
      console.log('                    📄 דו"ח מקיף');
      console.log('═'.repeat(60));
      
      // סיכום
      console.log('\n📊 סיכום:');
      console.log(`   • סה"כ שאלות: ${report.summary.totalQuestions}`);
      console.log(`   • סה"כ טעויות: ${report.summary.totalErrors}`);
      console.log(`   • אחוז טעויות: ${report.summary.errorRate}%`);
      console.log(`   • ציון מוכנות: ${report.summary.readinessScore}/100`);
      console.log(`   • רמת מוכנות: ${report.summary.readinessLevel}`);
      
      // תוכנית פעולה
      console.log('\n📋 תוכנית פעולה:');
      report.actionPlan.forEach((step) => {
        console.log(`\n   שלב ${step.priority}: ${step.action}`);
        console.log(`   ├─ משך: ${step.duration}`);
        console.log(`   └─ מטרה: ${step.goal}`);
      });
      
      console.log('\n' + '═'.repeat(60));
    }
    
    return data;
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  }
}

// ===============================================
// דוגמה 5: השוואת התקדמות
// ===============================================

async function example5_compareProgress() {
  console.log('\n📈 דוגמה 5: השוואת התקדמות\n');
  
  const userId = 'demo_user_123';
  const days = 7; // השוואה ל-7 ימים אחורה
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/compare?days=${days}`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ השוואה ל-${data.comparisonPeriod}!\n`);
      
      console.log('📊 תקופה אחרונה:');
      console.log(`   • שאלות: ${data.recentPeriod.questionsCount}`);
      console.log(`   • אחוז טעויות: ${data.recentPeriod.patterns.statistics.errorRate}%\n`);
      
      console.log('📊 תקופה קודמת:');
      console.log(`   • שאלות: ${data.olderPeriod.questionsCount}`);
      console.log(`   • אחוז טעויות: ${data.olderPeriod.patterns.statistics.errorRate}%\n`);
      
      // שיפור
      const improvement = parseFloat(data.improvement.errorRateChange);
      if (improvement < 0) {
        console.log(`📉 הידרדרות באחוז הטעויות: ${Math.abs(improvement)}%`);
      } else if (improvement > 0) {
        console.log(`📈 שיפור באחוז הטעויות: ${improvement}%`);
      } else {
        console.log(`➡️  אין שינוי באחוז הטעויות`);
      }
      
      // נושאים שהשתפרו
      if (data.improvement.subjectsImproved.length > 0) {
        console.log('\n✅ נושאים שהשתפרו:');
        data.improvement.subjectsImproved.forEach((subject) => {
          console.log(`   • ${subject.subject}: ${subject.improvement} טעויות פחות`);
        });
      }
      
      // נושאים שהידרדרו
      if (data.improvement.subjectsDeclined.length > 0) {
        console.log('\n⚠️  נושאים שהידרדרו:');
        data.improvement.subjectsDeclined.forEach((subject) => {
          console.log(`   • ${subject.subject}: ${subject.decline} טעויות יותר`);
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  }
}

// ===============================================
// דוגמה 6: עדכון ידני של דפוסים
// ===============================================

async function example6_updatePattern() {
  console.log('\n✏️  דוגמה 6: עדכון דפוסים ידני\n');
  
  const userId = 'demo_user_123';
  
  const updateData = {
    manualNotes: 'התמקדתי השבוע בתמרורי אזהרה ובחוקי זכות קדימה',
    customGoals: [
      'לשפר ב-50% את הביצועים בתמרורי אזהרה',
      'לפתור 100 שאלות השבוע',
      'להגיע לציון מוכנות של 85+'
    ]
  };
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ הדפוסים עודכנו בהצלחה!');
      console.log(`\n📝 הערות: ${data.patterns.manualNotes}`);
      console.log('\n🎯 מטרות מותאמות אישית:');
      data.patterns.customGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  }
}

// ===============================================
// הרצת כל הדוגמאות
// ===============================================

async function runAllExamples() {
  console.log('\n🚀 מריץ את כל הדוגמאות...\n');
  console.log('═'.repeat(60));
  
  try {
    await example1_analyzeErrors();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await example2_getAIRecommendations();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await example3_getInsights();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await example4_getComprehensiveReport();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await example5_compareProgress();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await example6_updatePattern();
    
    console.log('\n═'.repeat(60));
    console.log('✅ כל הדוגמאות הסתיימו בהצלחה!');
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('❌ שגיאה בהרצת הדוגמאות:', error);
  }
}

// ===============================================
// ייצוא הפונקציות
// ===============================================

module.exports = {
  example1_analyzeErrors,
  example2_getAIRecommendations,
  example3_getInsights,
  example4_getComprehensiveReport,
  example5_compareProgress,
  example6_updatePattern,
  runAllExamples
};

// הרצה ישירה אם הקובץ מופעל
if (require.main === module) {
  console.log('💡 טיפ: ודא שהשרת רץ על http://localhost:3000');
  console.log('💡 טיפ: יש למשתמש demo_user_123 נתונים קיימים\n');
  
  // הרץ את כל הדוגמאות
  runAllExamples().catch(console.error);
}

/**
 * 📖 הוראות שימוש:
 * 
 * 1. הפעל את השרת:
 *    cd chat-gpt-server && node index.js
 * 
 * 2. הרץ את הדוגמאות:
 *    node example-error-pattern-usage.js
 * 
 * 3. או השתמש בפונקציות בודדות:
 *    const examples = require('./example-error-pattern-usage');
 *    examples.example1_analyzeErrors();
 */

