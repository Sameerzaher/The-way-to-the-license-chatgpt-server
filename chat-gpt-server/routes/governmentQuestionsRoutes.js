const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// טעינת מאגר השאלות של משרד התחבורה
let governmentQuestions = [];
const questionsFilePath = path.join(__dirname, '../data/gov_theory_questions_with_sub_topic_final_v68.json');

// טעינת השאלות בהפעלת השרת
const loadGovernmentQuestions = () => {
  try {
    if (fs.existsSync(questionsFilePath)) {
      const data = fs.readFileSync(questionsFilePath, 'utf8');
      governmentQuestions = JSON.parse(data);
      console.log(`✅ נטענו ${governmentQuestions.length} שאלות ממאגר משרד התחבורה`);
      
      // יצירת אינדקס לחיפוש מהיר
      governmentQuestions.forEach(question => {
        question.searchId = question.id.toString().padStart(4, '0');
      });
    } else {
      console.error('❌ קובץ השאלות של משרד התחבורה לא נמצא:', questionsFilePath);
    }
  } catch (error) {
    console.error('❌ שגיאה בטעינת שאלות משרד התחבורה:', error);
  }
};

// טעינה ראשונית
loadGovernmentQuestions();

/**
 * GET /questions/government/:questionId
 * שליפת שאלה ספציפית ממאגר משרד התחבורה
 */
router.get('/questions/government/:questionId', (req, res) => {
  try {
    const { questionId } = req.params;
    
    // וידוא שהמזהה תקין
    if (!questionId || questionId.length === 0) {
      return res.status(400).json({
        error: 'מזהה שאלה לא תקין',
        message: 'יש לספק מזהה שאלה תקין'
      });
    }

    // המרה לפורמט של 4 ספרות
    const formattedId = questionId.toString().padStart(4, '0');
    
    // חיפוש השאלה
    const question = governmentQuestions.find(q => 
      q.id === formattedId || 
      q.id === questionId || 
      q.searchId === formattedId
    );

    if (!question) {
      return res.status(404).json({
        error: 'שאלה לא נמצאה',
        message: `שאלה מספר ${questionId} לא נמצאה במאגר משרד התחבורה`,
        searchedId: formattedId,
        totalQuestions: governmentQuestions.length
      });
    }

    // החזרת השאלה עם מידע נוסף
    const responseData = {
      ...question,
      metadata: {
        source: 'משרד התחבורה',
        database: 'gov_theory_questions_with_sub_topic_final_v68',
        searchedId: formattedId,
        foundById: question.id,
        totalAnswers: question.answers ? question.answers.length : 0,
        hasImage: !!question.image || !!question.image_local,
        licenseTypesCount: question.licenseTypes ? question.licenseTypes.length : 0
      }
    };

    console.log(`✅ נמצאה שאלה ${questionId} (${formattedId}): ${question.question.substring(0, 50)}...`);
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ שגיאה בשליפת שאלה:', error);
    res.status(500).json({
      error: 'שגיאת שרת',
      message: 'שגיאה בשליפת השאלה מהמאגר',
      details: error.message
    });
  }
});

/**
 * POST /questions/government/batch
 * שליפת מספר שאלות בבת אחת
 */
router.post('/questions/government/batch', (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        error: 'רשימת מזהי שאלות לא תקינה',
        message: 'יש לספק מערך של מזהי שאלות'
      });
    }

    if (questionIds.length > 100) {
      return res.status(400).json({
        error: 'יותר מדי שאלות',
        message: 'ניתן לבקש עד 100 שאלות בבת אחת'
      });
    }

    const results = [];
    const notFound = [];

    questionIds.forEach(questionId => {
      const formattedId = questionId.toString().padStart(4, '0');
      const question = governmentQuestions.find(q => 
        q.id === formattedId || 
        q.id === questionId || 
        q.searchId === formattedId
      );

      if (question) {
        results.push({
          ...question,
          requestedId: questionId,
          formattedId: formattedId
        });
      } else {
        notFound.push({
          requestedId: questionId,
          formattedId: formattedId
        });
      }
    });

    const response = {
      success: true,
      found: results.length,
      notFound: notFound.length,
      total: questionIds.length,
      questions: results,
      notFoundIds: notFound,
      metadata: {
        source: 'משרד התחבורה',
        database: 'gov_theory_questions_with_sub_topic_final_v68',
        totalQuestionsInDatabase: governmentQuestions.length
      }
    };

    console.log(`✅ שליפת batch: ${results.length}/${questionIds.length} שאלות נמצאו`);
    
    res.json(response);

  } catch (error) {
    console.error('❌ שגיאה בשליפת batch שאלות:', error);
    res.status(500).json({
      error: 'שגיאת שרת',
      message: 'שגיאה בשליפת השאלות מהמאגר',
      details: error.message
    });
  }
});

/**
 * GET /questions/government/search
 * חיפוש שאלות לפי קריטריונים
 */
router.get('/questions/government/search', (req, res) => {
  try {
    const { 
      topic, 
      subTopic, 
      licenseType, 
      hasImage, 
      lang = 'he',
      limit = 50,
      offset = 0 
    } = req.query;

    let filteredQuestions = [...governmentQuestions];

    // סינון לפי נושא
    if (topic) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.topic && q.topic.includes(topic)
      );
    }

    // סינון לפי תת-נושא
    if (subTopic) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.sub_topic && q.sub_topic.includes(subTopic)
      );
    }

    // סינון לפי סוג רישיון
    if (licenseType) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.licenseTypes && q.licenseTypes.some(license => 
          license.includes(licenseType)
        )
      );
    }

    // סינון לפי קיום תמונה
    if (hasImage !== undefined) {
      const shouldHaveImage = hasImage === 'true';
      filteredQuestions = filteredQuestions.filter(q => 
        shouldHaveImage ? (q.image || q.image_local) : !(q.image || q.image_local)
      );
    }

    // סינון לפי שפה
    if (lang) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.lang === lang
      );
    }

    // פגינציה
    const startIndex = parseInt(offset) || 0;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + limitNum);

    const response = {
      success: true,
      total: filteredQuestions.length,
      returned: paginatedQuestions.length,
      offset: startIndex,
      limit: limitNum,
      hasMore: startIndex + limitNum < filteredQuestions.length,
      filters: {
        topic,
        subTopic,
        licenseType,
        hasImage,
        lang
      },
      questions: paginatedQuestions,
      metadata: {
        source: 'משרד התחבורה',
        database: 'gov_theory_questions_with_sub_topic_final_v68',
        totalQuestionsInDatabase: governmentQuestions.length
      }
    };

    console.log(`🔍 חיפוש: ${paginatedQuestions.length}/${filteredQuestions.length} שאלות`);
    
    res.json(response);

  } catch (error) {
    console.error('❌ שגיאה בחיפוש שאלות:', error);
    res.status(500).json({
      error: 'שגיאת שרת',
      message: 'שגיאה בחיפוש השאלות',
      details: error.message
    });
  }
});

/**
 * GET /questions/government/stats
 * סטטיסטיקות על מאגר השאלות
 */
router.get('/questions/government/stats', (req, res) => {
  try {
    const stats = {
      totalQuestions: governmentQuestions.length,
      byTopic: {},
      bySubTopic: {},
      byLicenseType: {},
      withImages: 0,
      withoutImages: 0,
      byLanguage: {},
      averageAnswersPerQuestion: 0
    };

    let totalAnswers = 0;

    governmentQuestions.forEach(question => {
      // סטטיסטיקות לפי נושא
      const topic = question.topic || 'לא מוגדר';
      stats.byTopic[topic] = (stats.byTopic[topic] || 0) + 1;

      // סטטיסטיקות לפי תת-נושא
      const subTopic = question.sub_topic || 'לא מוגדר';
      stats.bySubTopic[subTopic] = (stats.bySubTopic[subTopic] || 0) + 1;

      // סטטיסטיקות לפי סוגי רישיון
      if (question.licenseTypes) {
        question.licenseTypes.forEach(license => {
          const cleanLicense = license.replace(/[«»]/g, '');
          stats.byLicenseType[cleanLicense] = (stats.byLicenseType[cleanLicense] || 0) + 1;
        });
      }

      // סטטיסטיקות תמונות
      if (question.image || question.image_local) {
        stats.withImages++;
      } else {
        stats.withoutImages++;
      }

      // סטטיסטיקות שפה
      const lang = question.lang || 'לא מוגדר';
      stats.byLanguage[lang] = (stats.byLanguage[lang] || 0) + 1;

      // ספירת תשובות
      if (question.answers) {
        totalAnswers += question.answers.length;
      }
    });

    stats.averageAnswersPerQuestion = governmentQuestions.length > 0 
      ? (totalAnswers / governmentQuestions.length).toFixed(2) 
      : 0;

    const response = {
      success: true,
      statistics: stats,
      metadata: {
        source: 'משרד התחבורה',
        database: 'gov_theory_questions_with_sub_topic_final_v68',
        generatedAt: new Date().toISOString()
      }
    };

    console.log(`📊 סטטיסטיקות: ${stats.totalQuestions} שאלות, ${stats.withImages} עם תמונות`);
    
    res.json(response);

  } catch (error) {
    console.error('❌ שגיאה בהפקת סטטיסטיקות:', error);
    res.status(500).json({
      error: 'שגיאת שרת',
      message: 'שגיאה בהפקת סטטיסטיקות',
      details: error.message
    });
  }
});

/**
 * POST /questions/government/reload
 * טעינה מחדש של מאגר השאלות
 */
router.post('/questions/government/reload', (req, res) => {
  try {
    const previousCount = governmentQuestions.length;
    loadGovernmentQuestions();
    const newCount = governmentQuestions.length;

    const response = {
      success: true,
      message: 'מאגר השאלות נטען מחדש בהצלחה',
      previousCount,
      newCount,
      difference: newCount - previousCount,
      reloadedAt: new Date().toISOString()
    };

    console.log(`🔄 טעינה מחדש: ${previousCount} → ${newCount} שאלות`);
    
    res.json(response);

  } catch (error) {
    console.error('❌ שגיאה בטעינה מחדש:', error);
    res.status(500).json({
      error: 'שגיאת שרת',
      message: 'שגיאה בטעינה מחדש של מאגר השאלות',
      details: error.message
    });
  }
});

module.exports = router;
