// סקריפט בדיקה מהיר למערכת הבחינות
const { getQuestionsByLang } = require('./models/questionsModel');
const { selectExamQuestions } = require('./services/examService');

console.log('🧪 Testing exam system...\n');

// בדיקה 1: טעינת שאלות
console.log('1️⃣ Testing question loading...');
try {
  const heQuestions = getQuestionsByLang('he');
  console.log(`✅ Hebrew questions loaded: ${heQuestions.length}`);
  
  if (heQuestions.length > 0) {
    console.log('📋 Sample question:', {
      id: heQuestions[0].id,
      question: heQuestions[0].question?.substring(0, 50) + '...',
      answersCount: heQuestions[0].answers?.length,
      hasCorrectAnswer: typeof heQuestions[0].correctAnswerIndex === 'number'
    });
  }
} catch (error) {
  console.error('❌ Error loading Hebrew questions:', error.message);
}

// בדיקה 2: בחירת שאלות
console.log('\n2️⃣ Testing question selection...');
try {
  const config = {
    questionCount: 10,
    duration: 15 * 60 * 1000,
    passingScore: 7,
    categories: null
  };
  
  const selectedQuestions = selectExamQuestions('he', config, 'all');
  console.log(`✅ Selected ${selectedQuestions.length} questions`);
  
  if (selectedQuestions.length > 0) {
    console.log('📋 Sample selected question:', {
      id: selectedQuestions[0].id,
      question: selectedQuestions[0].question?.substring(0, 50) + '...',
      answersCount: selectedQuestions[0].answers?.length
    });
  }
} catch (error) {
  console.error('❌ Error selecting questions:', error.message);
}

// בדיקה 3: יצירת בחינה מלאה
console.log('\n3️⃣ Testing full exam creation...');
try {
  const examConfig = {
    theory: {
      questionCount: 30,
      duration: 40 * 60 * 1000,
      passingScore: 26,
      categories: {
        'חוקי התנועה': 10,
        'תמרורים': 8,
        'בטיחות': 7,
        'הכרת הרכב': 5
      }
    }
  };
  
  const config = examConfig.theory;
  const selectedQuestions = selectExamQuestions('he', config, 'all');
  console.log(`✅ Theory exam: ${selectedQuestions.length}/${config.questionCount} questions`);
  
  // בדיקת קטגוריות
  const categories = {};
  selectedQuestions.forEach(q => {
    const subject = q.subject || q.topic;
    categories[subject] = (categories[subject] || 0) + 1;
  });
  
  console.log('📊 Questions by category:', categories);
  
} catch (error) {
  console.error('❌ Error creating full exam:', error.message);
}

console.log('\n🎯 Test completed!');
