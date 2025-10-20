// בדיקה מהירה של מאגר השאלות של משרד התחבורה
const fs = require('fs');
const path = require('path');

console.log('🔍 בודק מאגר שאלות משרד התחבורה...\n');

const questionsFilePath = path.join(__dirname, 'data/gov_theory_questions_with_sub_topic_final_v68.json');

try {
  // בדיקה שהקובץ קיים
  if (!fs.existsSync(questionsFilePath)) {
    console.error('❌ קובץ המאגר לא נמצא:', questionsFilePath);
    process.exit(1);
  }

  console.log('✅ קובץ המאגר נמצא');
  
  // קריאת הקובץ
  console.log('📖 קורא את קובץ המאגר...');
  const data = fs.readFileSync(questionsFilePath, 'utf8');
  
  // פרסור JSON
  console.log('🔄 מפרסר JSON...');
  const questions = JSON.parse(data);
  
  console.log(`✅ נטענו ${questions.length} שאלות בהצלחה!\n`);
  
  // ניתוח המאגר
  console.log('📊 ניתוח המאגר:');
  console.log('================');
  
  // ספירת נושאים
  const topicCounts = {};
  const subTopicCounts = {};
  const licenseTypeCounts = {};
  let questionsWithImages = 0;
  let questionsWithoutImages = 0;
  
  questions.forEach(question => {
    // נושאים
    const topic = question.topic || 'לא מוגדר';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    
    // תת-נושאים
    const subTopic = question.sub_topic || 'לא מוגדר';
    subTopicCounts[subTopic] = (subTopicCounts[subTopic] || 0) + 1;
    
    // סוגי רישיון
    if (question.licenseTypes) {
      question.licenseTypes.forEach(license => {
        const cleanLicense = license.replace(/[«»]/g, '');
        licenseTypeCounts[cleanLicense] = (licenseTypeCounts[cleanLicense] || 0) + 1;
      });
    }
    
    // תמונות
    if (question.image || question.image_local) {
      questionsWithImages++;
    } else {
      questionsWithoutImages++;
    }
  });
  
  console.log(`📝 סה"כ שאלות: ${questions.length}`);
  console.log(`🖼️  שאלות עם תמונות: ${questionsWithImages}`);
  console.log(`📄 שאלות ללא תמונות: ${questionsWithoutImages}\n`);
  
  console.log('📚 נושאים עיקריים:');
  Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([topic, count]) => {
      console.log(`   ${topic}: ${count} שאלות`);
    });
  
  console.log('\n🎫 סוגי רישיון:');
  Object.entries(licenseTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([license, count]) => {
      console.log(`   ${license}: ${count} שאלות`);
    });
  
  console.log('\n🏷️  תת-נושאים פופולריים (10 הראשונים):');
  Object.entries(subTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([subTopic, count]) => {
      console.log(`   ${subTopic}: ${count} שאלות`);
    });
  
  // דוגמאות שאלות
  console.log('\n🎯 דוגמאות שאלות:');
  console.log('==================');
  
  // שאלה ראשונה
  const firstQuestion = questions[0];
  console.log(`\n📝 שאלה ${firstQuestion.id}:`);
  console.log(`   נושא: ${firstQuestion.topic}`);
  console.log(`   תת-נושא: ${firstQuestion.sub_topic}`);
  console.log(`   שאלה: ${firstQuestion.question.substring(0, 80)}...`);
  console.log(`   תשובות: ${firstQuestion.answers.length}`);
  console.log(`   תשובה נכונה: ${firstQuestion.answers[firstQuestion.correctAnswerIndex]?.substring(0, 50)}...`);
  console.log(`   תמונה: ${firstQuestion.image ? 'כן' : 'לא'}`);
  
  // שאלה עם תמונה
  const questionWithImage = questions.find(q => q.image || q.image_local);
  if (questionWithImage) {
    console.log(`\n🖼️  שאלה עם תמונה ${questionWithImage.id}:`);
    console.log(`   נושא: ${questionWithImage.topic}`);
    console.log(`   שאלה: ${questionWithImage.question.substring(0, 80)}...`);
    console.log(`   תמונה: ${questionWithImage.image || questionWithImage.image_local}`);
  }
  
  console.log('\n✅ בדיקת המאגר הושלמה בהצלחה!');
  console.log('🚀 המאגר מוכן לשימוש בתכונת "טעויות נפוצות"');
  
} catch (error) {
  console.error('❌ שגיאה בבדיקת המאגר:', error.message);
  process.exit(1);
}
