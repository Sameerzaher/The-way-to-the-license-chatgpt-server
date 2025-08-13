const { getUserProgress, saveProgress } = require('./services/userProgressFileService');

// Test the current user progress
const userId = 'user_tp8btbue';
console.log('Testing user progress for:', userId);

// Get current progress
const currentProgress = getUserProgress(userId);
console.log('Current progress:', JSON.stringify(currentProgress, null, 2));

// Test saving new progress
const newProgress = {
  ...currentProgress,
  lastActivity: Date.now()
};

// Add a test question
if (!newProgress.completedQuestions.find(q => q.questionId === 'TEST001')) {
  newProgress.completedQuestions.push({
    questionId: 'TEST001',
    isCorrect: true,
    answeredAt: new Date().toISOString()
  });
}

console.log('Saving new progress...');
saveProgress(newProgress);

// Verify it was saved
const savedProgress = getUserProgress(userId);
console.log('Saved progress:', JSON.stringify(savedProgress, null, 2)); 