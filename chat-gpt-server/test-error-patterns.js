/**
 * 🧪 בדיקת מערכת זיהוי דפוסי טעויות
 * 
 * סקריפט זה יוצר נתוני בדיקה ובודק שהמערכת עובדת כראוי
 */

const fs = require('fs');
const path = require('path');

// נתוני בדיקה - משתמש דמו עם תשובות
const DEMO_USER_ID = 'demo_user_test_123';

// יצירת תשובות לדוגמה
function createDemoAnswers() {
  const subjects = [
    'תמרורי אזהרה',
    'תמרורי חובה',
    'חוקי זכות קדימה',
    'חניה ועצירה',
    'מהירות והתנהגות',
    'תאורה ואיתות',
    'כללי תעבורה',
    'פסיכולוגיה'
  ];

  const categories = ['תמרורים', 'חוקי תעבורה', 'כללי', 'פסיכולוגיה'];

  const answers = [];
  const now = Date.now();

  // יצירת 100 תשובות
  for (let i = 0; i < 100; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // הטייה - יותר טעויות בנושאים מסוימים
    let isCorrect;
    if (subject === 'תמרורי אזהרה') {
      isCorrect = Math.random() > 0.6; // 60% טעויות
    } else if (subject === 'חוקי זכות קדימה') {
      isCorrect = Math.random() > 0.4; // 40% טעויות
    } else {
      isCorrect = Math.random() > 0.2; // 20% טעויות
    }

    // זמן תגובה - מהיר יותר = יותר סיכוי לטעות
    let timeSpent;
    if (!isCorrect && Math.random() > 0.5) {
      timeSpent = Math.floor(Math.random() * 5) + 1; // טעויות מהירות (1-5 שניות)
    } else {
      timeSpent = Math.floor(Math.random() * 20) + 8; // רגיל (8-28 שניות)
    }

    // זמן יצירה - פיזור על פני השבוע האחרון
    const timestamp = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

    answers.push({
      questionId: `q_${i + 1}`,
      subject,
      category,
      isCorrect,
      timeSpent,
      timestamp,
      userAnswer: isCorrect ? 'A' : 'B',
      correctAnswer: 'A'
    });
  }

  // הוסף כמה טעויות חוזרות (אותן שאלות)
  const repeatedQuestionIds = ['q_5', 'q_12', 'q_23', 'q_45', 'q_67'];
  repeatedQuestionIds.forEach((qId, index) => {
    const originalAnswer = answers.find(a => a.questionId === qId);
    if (originalAnswer) {
      // הוסף 2-3 טעויות נוספות על אותה שאלה
      for (let i = 0; i < 2; i++) {
        answers.push({
          ...originalAnswer,
          isCorrect: false,
          timestamp: new Date(now - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
  });

  return answers;
}

// שמירת נתוני בדיקה
function saveDemoData() {
  console.log('🔧 יוצר נתוני בדיקה...\n');

  const userProgressPath = path.join(__dirname, 'data', 'userProgress.json');
  
  let userProgress = {};
  if (fs.existsSync(userProgressPath)) {
    try {
      const data = fs.readFileSync(userProgressPath, 'utf-8');
      userProgress = JSON.parse(data);
    } catch (error) {
      console.warn('⚠️  שגיאה בקריאת userProgress.json, יוצר קובץ חדש');
    }
  }

  // הוסף משתמש דמו
  userProgress[DEMO_USER_ID] = {
    userId: DEMO_USER_ID,
    name: 'משתמש דמו',
    email: 'demo@example.com',
    answers: createDemoAnswers(),
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  // שמור
  fs.writeFileSync(userProgressPath, JSON.stringify(userProgress, null, 2));
  
  console.log(`✅ נתוני בדיקה נוצרו עבור משתמש: ${DEMO_USER_ID}`);
  console.log(`📊 סה"כ תשובות: ${userProgress[DEMO_USER_ID].answers.length}\n`);

  return DEMO_USER_ID;
}

// בדיקת ה-API
async function testAPI() {
  console.log('🧪 מתחיל בדיקות API...\n');
  console.log('═'.repeat(60));

  const baseURL = 'http://localhost:3000';
  const userId = DEMO_USER_ID;

  // בדיקה 1: ניתוח דפוסים
  console.log('\n📊 בדיקה 1: ניתוח דפוסי טעויות');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ ניתוח הצליח!');
      console.log(`   • סה"כ שאלות: ${data.patterns.statistics.totalQuestions}`);
      console.log(`   • סה"כ טעויות: ${data.patterns.statistics.totalErrors}`);
      console.log(`   • אחוז טעויות: ${data.patterns.statistics.errorRate}%`);
      console.log(`   • טעויות חוזרות: ${data.patterns.repeatedErrors.length}`);
      console.log(`   • תחומי שיפור: ${data.patterns.improvementAreas.length}`);
      console.log(`   • תחומי חוזק: ${data.patterns.strengths.length}`);
    } else {
      console.log('❌ ניתוח נכשל:', data.error);
    }
  } catch (error) {
    console.log('❌ שגיאה:', error.message);
  }

  // המתן קצת
  await new Promise(resolve => setTimeout(resolve, 1000));

  // בדיקה 2: תובנות מתקדמות
  console.log('\n🔍 בדיקה 2: תובנות מתקדמות');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/insights`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ תובנות התקבלו!');
      console.log(`   • ציון מוכנות: ${data.insights.readinessScore.score}/100`);
      console.log(`   • רמת מוכנות: ${data.insights.readinessScore.level}`);
      console.log(`   • סגנון למידה: ${data.insights.learningStyle.type}`);
      console.log(`   • גורמי סיכון: ${data.insights.riskFactors.length}`);
      console.log(`   • צעדים הבאים: ${data.insights.nextSteps.length}`);
    } else {
      console.log('❌ קבלת תובנות נכשלה:', data.error);
    }
  } catch (error) {
    console.log('❌ שגיאה:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // בדיקה 3: המלצות AI (אופציונלי - דורש OpenAI API)
  console.log('\n🤖 בדיקה 3: המלצות AI');
  console.log('─'.repeat(60));
  console.log('⚠️  בדיקה זו דורשת OpenAI API Key ועלולה לקחת כמה שניות...');
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/recommendations`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ המלצות AI התקבלו!');
      console.log(`   • אורך תוכן: ${data.recommendations.length} תווים`);
      console.log(`   • נוצר בתאריך: ${data.generatedAt}`);
      
      // הצג קצת מההמלצות
      const preview = data.recommendations.substring(0, 150);
      console.log(`\n   📝 תצוגה מקדימה:\n   ${preview}...`);
    } else {
      if (data.error && data.error.includes('API')) {
        console.log('⚠️  OpenAI API לא זמין - זה OK, המערכת תחזיר המלצות בסיסיות');
      } else {
        console.log('❌ קבלת המלצות נכשלה:', data.error);
      }
    }
  } catch (error) {
    console.log('⚠️  שגיאה:', error.message);
    console.log('   זה תקין אם אין OpenAI API Key');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // בדיקה 4: דו"ח מקיף
  console.log('\n📄 בדיקה 4: דו"ח מקיף');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}/report`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ דו"ח מקיף נוצר!');
      console.log(`   • כולל ניתוח: ${!!data.report.patterns}`);
      console.log(`   • כולל תובנות: ${!!data.report.insights}`);
      console.log(`   • כולל המלצות AI: ${!!data.report.aiRecommendations}`);
      console.log(`   • כולל תוכנית פעולה: ${data.report.actionPlan?.length || 0} שלבים`);
    } else {
      console.log('❌ יצירת דו"ח נכשלה:', data.error);
    }
  } catch (error) {
    console.log('❌ שגיאה:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // בדיקה 5: עדכון ידני
  console.log('\n✏️  בדיקה 5: עדכון ידני של דפוסים');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${baseURL}/error-patterns/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manualNotes: 'בדיקה אוטומטית - עובד מצוין!',
        customGoals: ['מטרה 1', 'מטרה 2']
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ עדכון ידני הצליח!');
      console.log(`   • הערות נשמרו: ${!!data.patterns.manualNotes}`);
      console.log(`   • מטרות נשמרו: ${data.patterns.customGoals?.length || 0}`);
    } else {
      console.log('❌ עדכון נכשל:', data.error);
    }
  } catch (error) {
    console.log('❌ שגיאה:', error.message);
  }

  console.log('\n═'.repeat(60));
  console.log('✅ כל הבדיקות הסתיימו!');
  console.log('═'.repeat(60));
}

// בדיקת בריאות השרת
async function checkServerHealth() {
  console.log('🏥 בודק בריאות השרת...\n');
  
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log('✅ השרת פועל תקין!');
      console.log(`   • הודעה: ${data.message}\n`);
      return true;
    } else {
      console.log('⚠️  השרת מגיב אבל לא תקין');
      return false;
    }
  } catch (error) {
    console.log('❌ השרת לא מגיב!');
    console.log(`   • שגיאה: ${error.message}`);
    console.log('\n💡 ודא שהשרת רץ: node index.js\n');
    return false;
  }
}

// פונקציה ראשית
async function main() {
  console.log('\n🚀 בדיקת מערכת זיהוי דפוסי טעויות');
  console.log('═'.repeat(60));
  console.log('');

  // 1. בדיקת בריאות השרת
  const serverOK = await checkServerHealth();
  
  if (!serverOK) {
    console.log('❌ לא ניתן להמשיך ללא שרת פעיל');
    process.exit(1);
  }

  // 2. יצירת נתוני בדיקה
  saveDemoData();

  // 3. בדיקות API
  await testAPI();

  console.log('\n📝 סיכום:');
  console.log('─'.repeat(60));
  console.log(`✅ נתוני בדיקה נוצרו עבור משתמש: ${DEMO_USER_ID}`);
  console.log('✅ כל הבדיקות הסתיימו');
  console.log('\n💡 טיפים:');
  console.log('   • בדוק את הקבצים: data/errorPatterns.json');
  console.log('   • בדוק את הקבצים: data/userProgress.json');
  console.log('   • השתמש ב-example-error-pattern-usage.js לדוגמאות נוספות');
  console.log('   • קרא את QUICK_START_ERROR_PATTERNS.md להתחלה מהירה');
  console.log('═'.repeat(60));
}

// הרצה
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ שגיאה כללית:', error);
    process.exit(1);
  });
}

module.exports = {
  createDemoAnswers,
  saveDemoData,
  testAPI,
  checkServerHealth
};

