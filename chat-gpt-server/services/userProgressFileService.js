const fs = require('fs');
const path = require('path');
const progressPath = path.join(__dirname, '../data/userProgress.json');

function getUserProgress(userId) {
  try {
    if (!fs.existsSync(progressPath)) {
      return {
        userId: userId,
        completedQuestions: [],
        completedPractices: [],
        totalScore: 0,
        lastActivity: Date.now(),
        progressByCategory: {}
      };
    }
    const data = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    
    // Handle old array format
    if (Array.isArray(data)) {
      const userProgress = data.find(user => user.userId === userId);
      if (userProgress) {
        return userProgress;
      }
      return {
        userId: userId,
        completedQuestions: [],
        completedPractices: [],
        totalScore: 0,
        lastActivity: Date.now(),
        progressByCategory: {}
      };
    }
    
    // Handle new object format
    if (typeof data === 'object' && data !== null) {
      // Handle legacy format (array of question IDs)
      if (Array.isArray(data[userId])) {
        return {
          userId: userId,
          completedQuestions: data[userId],
          completedPractices: [],
          totalScore: 0,
          lastActivity: Date.now(),
          progressByCategory: {}
        };
      }
      
      // Return existing object or create new one
      return data[userId] || {
        userId: userId,
        completedQuestions: [],
        completedPractices: [],
        totalScore: 0,
        lastActivity: Date.now(),
        progressByCategory: {}
      };
    }
    
    // Fallback
    return {
      userId: userId,
      completedQuestions: [],
      completedPractices: [],
      totalScore: 0,
      lastActivity: Date.now(),
      progressByCategory: {}
    };
  } catch (e) {
    console.error('Error reading user progress:', e);
    return {
      userId: userId,
      completedQuestions: [],
      completedPractices: [],
      totalScore: 0,
      lastActivity: Date.now(),
      progressByCategory: {}
    };
  }
}

function addUserSolvedQuestion(userId, questionId) {
  let data = {};
  try {
    if (fs.existsSync(progressPath)) {
      data = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading user progress for write:', e);
    data = {};
  }
  
  // Get or create user progress object
  let userProgress = getUserProgress(userId);
  
  // Add question to completed questions if not already there
  if (!userProgress.completedQuestions.includes(questionId)) {
    userProgress.completedQuestions.push(questionId);
    userProgress.lastActivity = Date.now();
  }
  
  // Save back to file
  data[userId] = userProgress;
  
  try {
    fs.writeFileSync(progressPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing user progress:', e);
  }
}

function saveProgress(progress) {
  let data = {};
  try {
    if (fs.existsSync(progressPath)) {
      const fileData = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
      
      // Handle old array format - convert to new object format
      if (Array.isArray(fileData)) {
        data = {};
        fileData.forEach(user => {
          data[user.userId] = user;
        });
      } else {
        data = fileData;
      }
    }
  } catch (e) {
    console.error('Error reading user progress for save:', e);
    data = {};
  }
  
  data[progress.userId] = progress;
  
  try {
    fs.writeFileSync(progressPath, JSON.stringify(data, null, 2));
    console.log('✅ userProgress.json written successfully!');
  } catch (e) {
    console.error('❌ Error writing user progress:', e);
  }
}

module.exports = { getUserProgress, addUserSolvedQuestion, saveProgress }; 