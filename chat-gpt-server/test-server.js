// בדיקה מהירה של השרת ומאגר השאלות
const express = require('express');
const fs = require('fs');
const path = require('path');

console.log('🔍 בודק הגדרות השרת...\n');

// בדיקת קובץ המאגר
const questionsFilePath = path.join(__dirname, 'data/gov_theory_questions_with_sub_topic_final_v68.json');
console.log('📁 נתיב קובץ המאגר:', questionsFilePath);

if (fs.existsSync(questionsFilePath)) {
  console.log('✅ קובץ המאגר קיים');
  
  try {
    const data = fs.readFileSync(questionsFilePath, 'utf8');
    const questions = JSON.parse(data);
    console.log(`✅ נטענו ${questions.length} שאלות מהמאגר`);
    
    // בדיקת שאלה 12
    const question12 = questions.find(q => q.id === '0012' || q.id === '12');
    if (question12) {
      console.log('✅ שאלה 12 נמצאה:', question12.question.substring(0, 50) + '...');
    } else {
      console.log('❌ שאלה 12 לא נמצאה');
      // הצגת כמה שאלות ראשונות
      console.log('🔍 שאלות ראשונות במאגר:');
      questions.slice(0, 5).forEach(q => {
        console.log(`   ${q.id}: ${q.question.substring(0, 30)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ שגיאה בפרסור המאגר:', error.message);
  }
} else {
  console.error('❌ קובץ המאגר לא נמצא!');
}

// בדיקת פורט
const PORT = process.env.PORT || 3000;
console.log(`\n🌐 השרת אמור לרוץ על פורט: ${PORT}`);

// בדיקת משתני סביבה
console.log('\n🔧 משתני סביבה:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'לא מוגדר');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'לא מוגדר');

console.log('\n📋 סיכום:');
console.log('================');
console.log('1. ודא שהשרת רץ: npm start');
console.log('2. בדוק שהפרונטאנד מחובר ל: http://localhost:3000');
console.log('3. נסה לגשת ל: http://localhost:3000/api/questions/government/0012');
console.log('4. אם יש שגיאות CORS, בדוק את הגדרות ה-CORS בשרת');

console.log('\n🚀 מוכן לבדיקה!');
