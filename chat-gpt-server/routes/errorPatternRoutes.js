const express = require('express');
const router = express.Router();
const errorPatternController = require('../controllers/errorPatternController');

/**
 * @route   POST /error-patterns/:userId/analyze
 * @desc    ניתוח דפוסי טעויות של משתמש
 * @access  Public
 */
router.post('/:userId/analyze', errorPatternController.analyzeUserErrors);

/**
 * @route   GET /error-patterns/:userId/recommendations
 * @desc    קבלת המלצות AI מותאמות אישית
 * @access  Public
 */
router.get('/:userId/recommendations', errorPatternController.getAIRecommendations);

/**
 * @route   GET /error-patterns/:userId
 * @desc    קבלת דפוסי טעויות שמורים
 * @access  Public
 */
router.get('/:userId', errorPatternController.getErrorPatterns);

/**
 * @route   GET /error-patterns/:userId/insights
 * @desc    קבלת תובנות מתקדמות
 * @access  Public
 */
router.get('/:userId/insights', errorPatternController.getAdvancedInsights);

/**
 * @route   GET /error-patterns/:userId/report
 * @desc    קבלת דו"ח מקיף
 * @access  Public
 */
router.get('/:userId/report', errorPatternController.getComprehensiveReport);

/**
 * @route   PUT /error-patterns/:userId
 * @desc    עדכון דפוס טעויות ידני
 * @access  Public
 */
router.put('/:userId', errorPatternController.updateErrorPattern);

/**
 * @route   GET /error-patterns/:userId/compare
 * @desc    השוואת התקדמות בין תקופות
 * @access  Public
 * @query   days - מספר ימים להשוואה (ברירת מחדל: 7)
 */
router.get('/:userId/compare', errorPatternController.compareProgress);

module.exports = router;
