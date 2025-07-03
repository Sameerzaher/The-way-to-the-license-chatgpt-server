const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    answer: String,
    isCorrect: Boolean,
    answeredAt: {
      type: Date,
      default: Date.now
    },
    responseTime: Number, // milliseconds
    attempts: {
      type: Number,
      default: 1
    },
    userNote: String,
    hintUsed: {
      type: Boolean,
      default: false
    }
  }],
  completedPractices: [{
    practiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Practice',
      required: true
    },
    answer: String,
    isCorrect: Boolean,
    answeredAt: {
      type: Date,
      default: Date.now
    },
    responseTime: Number, // milliseconds
    attempts: {
      type: Number,
      default: 1
    },
    userNote: String,
    hintUsed: {
      type: Boolean,
      default: false
    }
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  progressByCategory: {
    type: Map,
    of: {
      completed: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProgress', userProgressSchema); 