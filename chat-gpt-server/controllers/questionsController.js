const path = require("path");
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');
const { getQuestionsByLang } = require("../models/questionsModel");

// פונקציית ניקוי אחידה
const clean = s => s.replace(/[«»"׳״]/g, '').trim().toLowerCase();

// פונקציית עזר לבניית HTML דינמי
function buildHtml(questions, licenseType) {
  let html = `
  <html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <title>שאלות לרישיון ${licenseType}</title>
    <style>
      @page {
        size: A4;
        margin: 20mm;
      }
      body { 
        font-family: Arial, sans-serif; 
        direction: rtl; 
        margin: 0;
        padding: 20px;
        font-size: 14px;
        line-height: 1.6;
        text-align: right;
      }
      h1 { 
        text-align: center; 
        font-size: 24px; 
        margin-bottom: 30px;
        color: #333;
        font-weight: bold;
      }
      .question { 
        margin-bottom: 25px; 
        page-break-inside: avoid;
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
      }
      .question-text { 
        font-weight: bold; 
        font-size: 16px; 
        margin-bottom: 10px;
        color: #2c3e50;
      }
      .answers { 
        margin-right: 20px; 
        margin-top: 10px;
      }
      .answer { 
        margin-bottom: 8px; 
        padding: 5px 0;
        font-size: 14px;
      }
      .answer-letter {
        font-weight: bold;
        color: #e74c3c;
        margin-left: 8px;
      }
    </style>
  </head>
  <body>
    <h1>שאלות לרישיון ${licenseType}</h1>
  `;
  
  questions.forEach((q, idx) => {
    html += `<div class="question">
      <div class="question-text">${idx + 1}. ${q.question}</div>
      <div class="answers">`;
    q.answers.forEach((ans, i) => {
      const letter = String.fromCharCode(0x05D0 + i); // א, ב, ג, ד
      html += `<div class="answer">
        <span class="answer-letter">${letter}.</span> ${ans}
      </div>`;
    });
    html += `</div></div>`;
  });
  
  html += `</body></html>`;
  return html;
}

// פונקציית מיפוי מיוחדת לרשיונות
function mapLicenseType(type) {
  const cleaned = clean(type);
  if (cleaned === 'b') return ['b', 'в'];
  if (cleaned === 'c') return ['c', 'с'];
  // אפשר להוסיף כאן עוד מיפויים אם צריך
  return [cleaned];
}

// סינון subject משופר (case-insensitive, ללא רווחים, תווים מיוחדים)
function cleanSubject(s) {
  return s ? s.replace(/[«»"׳״]/g, '').trim().toLowerCase() : '';
}

// סינון subSubject משופר (case-insensitive, ללא רווחים, תווים מיוחדים)
function cleanSubSubject(s) {
  return s ? s.replace(/[«»"׳״]/g, '').trim().toLowerCase() : '';
}

// פונקציית ניקוי חזקה לעברית
function normalizeHebrew(str) {
  if (!str) return '';
  // המרה לאותיות רגילות (סופיות)
  const finals = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
  let s = str.replace(/[«»"׳״'.,\s\-]/g, '').toLowerCase();
  s = s.replace(/[ךםןףץ]/g, c => finals[c] || c);
  return s.normalize('NFKD').replace(/[\u0591-\u05C7]/g, ''); // מסיר ניקוד
}

// פונקציית ניקוי חזקה לסינון נושאים ותתי-נושאים
function normalizeFilter(str) {
  return (str || '').replace(/[«»"׳״'.,\s\-]/g, '').trim().toLowerCase();
}

// Endpoint שמחזיר שאלות מסוננות לפי נושא, תת-נושא, ורישיון (אפשר לשלב)
exports.list = (req, res) => {
  const lang = req.query.lang || "he";
  const subject = req.query.subject || null;
  const subSubject = req.query.subSubject || null;
  const licenseType = req.query.licenseType || null;

  let pool = getQuestionsByLang(lang);
  // סינון לפי נושא (topic) עם ניקוי חכם
  if (subject) {
    const subjectCleaned = normalizeFilter(subject);
    pool = pool.filter(q => q.topic && normalizeFilter(q.topic) === subjectCleaned);
  }
  // סינון לפי תת-נושא (sub_topic) עם ניקוי חכם
  if (subSubject) {
    const subSubjectCleaned = normalizeFilter(subSubject);
    pool = pool.filter(q => q.sub_topic && normalizeFilter(q.sub_topic) === subSubjectCleaned);
  }
  // סינון לפי סוג רישיון עם לוגים וניקוי חזק
  if (licenseType) {
    const licenseTypeCleaned = clean(licenseType);
    const licenseTypeVariants = mapLicenseType(licenseTypeCleaned);
    console.log('licenseType מה-Frontend:', licenseType);
    console.log('licenseTypeCleaned:', licenseTypeCleaned);
    console.log('licenseTypeVariants:', licenseTypeVariants);
    // לוג סוגי רישיון קיימים
    const allLicenseTypes = new Set();
    pool.forEach(q => {
      if (q.licenseTypes) {
        q.licenseTypes.forEach(type => allLicenseTypes.add(clean(type)));
      }
    });
    console.log('סוגי רישיון קיימים (אחרי clean):', Array.from(allLicenseTypes));
    pool = pool.filter(q =>
      q.licenseTypes &&
      q.licenseTypes.some(type => licenseTypeVariants.includes(clean(type)))
    );
  }

  const result = pool.map(q => ({
    ...q,
    licenseTypes: q.licenseTypes || [],
    subSubject: q.sub_topic || ""
  }));

  return res.json(result);
};

exports.random = (req, res) => {
  const lang = req.query.lang || "he";
  const count = parseInt(req.query.count, 10) || 1;
  const subject = req.query.subject || null;
  const subSubject = req.query.subSubject || null;
  const licenseType = req.query.licenseType || null;

  let pool = getQuestionsByLang(lang);
  if (subject) {
    const subjectCleaned = cleanSubject(subject);
    pool = pool.filter(q => q.subject && cleanSubject(q.subject) === subjectCleaned);
  }
  if (subSubject) {
    const subSubjectCleaned = cleanSubSubject(subSubject);
    pool = pool.filter(q => q.subSubject && cleanSubSubject(q.subSubject) === subSubjectCleaned);
  }
  if (licenseType) {
    const licenseTypeCleaned = clean(licenseType);
    const licenseTypeVariants = mapLicenseType(licenseTypeCleaned);
    console.log('licenseType מה-Frontend:', licenseType);
    console.log('licenseTypeCleaned:', licenseTypeCleaned);
    console.log('licenseTypeVariants:', licenseTypeVariants);
    pool = pool.filter(q =>
      q.licenseTypes &&
      q.licenseTypes.some(type => licenseTypeVariants.includes(clean(type)))
    );
    // לוג סוגי רישיון קיימים
    const allLicenseTypes = new Set();
    pool.forEach(q => {
      if (q.licenseTypes) {
        q.licenseTypes.forEach(type => allLicenseTypes.add(clean(type)));
      }
    });
    console.log('סוגי רישיון קיימים (אחרי clean):', Array.from(allLicenseTypes));
  }

  if (!Array.isArray(pool) || pool.length === 0) {
    return res.json([]);
  }

  const maxPick = Math.min(count, pool.length);
  const result = [];
  const used = new Set();

  while (result.length < maxPick) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(pool[idx]);
    }
  }

  const mappedResult = result.map(q => ({
    ...q,
    licenseTypes: q.licenseTypes || [],
    subSubject: q.sub_topic || ""
  }));

  return res.json(mappedResult);
};

exports.byId = (req, res) => {
  const lang = req.query.lang || "he";
  const id = req.params.id;

  const pool = getQuestionsByLang(lang); 
  const found = pool.find(q => q.id === id);

  if (!found) {
    return res.status(404).json({
      message: (lang === "ar") ? "السؤال غير موجود" : "שאלה לא נמצאה",
    });
  }

  const result = {
    ...found,
    licenseTypes: found.licenseTypes || [],
    subSubject: found.sub_topic || ""
  };

  return res.json(result);
};


exports.downloadPdfByLicenseType = async (req, res) => {
  const lang = req.query.lang || "he";
  const licenseType = req.query.licenseType;
  const subject = req.query.subject || null;
  const subSubject = req.query.subSubject || null;
  if (!licenseType) {
    return res.status(400).json({ error: "licenseType is required" });
  }

  const pool = getQuestionsByLang(lang);
  if (subject) {
    const subjectCleaned = cleanSubject(subject);
    pool = pool.filter(q => q.subject && cleanSubject(q.subject) === subjectCleaned);
  }
  if (subSubject) {
    const subSubjectCleaned = cleanSubSubject(subSubject);
    pool = pool.filter(q => q.subSubject && cleanSubSubject(q.subSubject) === subSubjectCleaned);
  }
  const licenseTypeCleaned = licenseType ? clean(licenseType) : null;
  const licenseTypeVariants = licenseTypeCleaned ? mapLicenseType(licenseTypeCleaned) : [];
  console.log('licenseType מה-Frontend:', licenseType);
  console.log('licenseTypeCleaned:', licenseTypeCleaned);
  console.log('licenseTypeVariants:', licenseTypeVariants);

  // בדיקה איזה סוגי רישיון יש בשאלות
  const allLicenseTypes = new Set();
  pool.forEach(q => {
    if (q.licenseTypes) {
      q.licenseTypes.forEach(type => allLicenseTypes.add(clean(type)));
    }
  });
  console.log('סוגי רישיון קיימים (אחרי clean):', Array.from(allLicenseTypes));

  pool = pool.filter(q =>
    q.licenseTypes &&
    q.licenseTypes.some(type => licenseTypeVariants.includes(clean(type)))
  );

  console.log('שאלות אחרי סינון:', pool.length);

  if (pool.length === 0) {
    return res.status(404).json({ 
      error: `לא נמצאו שאלות לסוג רישיון: ${licenseType}`,
      availableTypes: Array.from(allLicenseTypes)
    });
  }

  try {
    // יצירת HTML עם תמיכה מלאה בעברית
    const html = buildHtml(pool, licenseType);
    
    // הפעלת Puppeteer ליצירת PDF
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    // הגדרת timeout ארוך יותר
    page.setDefaultTimeout(30000);
    
    // הגדרת תוכן HTML
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // יצירת PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    
    // שליחת PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=questions_${licenseType}.pdf`);
    res.send(pdf);
    
  } catch (error) {
    console.error('שגיאה ביצירת PDF:', error);
    res.status(500).json({ error: 'שגיאה ביצירת PDF' });
  }
};

// Endpoint שמחזיר את כל הנושאים הייחודיים
exports.subjects = (req, res) => {
  const lang = req.query.lang || "he";
  const pool = getQuestionsByLang(lang);
  const subjects = Array.from(new Set(pool.map(q => q.subject).filter(Boolean)));
  res.json(subjects);
};

// Endpoint שמחזיר את כל ה-topics הייחודיים
exports.topics = (req, res) => {
  const lang = req.query.lang || "he";
  const pool = getQuestionsByLang(lang);
  const topics = Array.from(new Set(pool.map(q => q.topic).filter(Boolean)));
  res.json(topics);
};
// Endpoint שמחזיר את כל תתי הנושאים הייחודיים
exports.subSubjects = (req, res) => {
  const { subject, lang = 'he' } = req.query;
  const allQuestions = getQuestionsByLang(lang);
  const norm = s => (s || '').replace(/[«»"׳״'.,\s\-]/g, '').toLowerCase();

  let filteredQuestions = allQuestions;
  if (subject) {
    const subjectCleaned = norm(subject);
    filteredQuestions = allQuestions.filter(q =>
      (q.topic && norm(q.topic) === subjectCleaned) ||
      (q.subject && norm(q.subject) === subjectCleaned)
    );
  }
  const allSubSubjects = Array.from(new Set(
    filteredQuestions.map(q => q.sub_topic || q.subSubject).filter(Boolean)
  ));
  return res.json(allSubSubjects);
};

// Endpoint שמחזיר את מספר השאלות לכל topic (עמיד)
exports.topicCounts = (req, res) => {
  const lang = req.query.lang || "he";
  const pool = getQuestionsByLang(lang);
  const counts = {};
  const displayNames = {};
  const norm = s => (s || '').replace(/[«»"׳״'.,\s\-]/g, '').trim().toLowerCase();
  pool.forEach(q => {
    const topic = q.topic || q.subject;
    if (!topic) return;
    const key = norm(topic);
    counts[key] = (counts[key] || 0) + 1;
    displayNames[key] = topic; // שמור את השם המקורי להצגה
  });
  // החזר אובייקט: key = שם מוצג, value = כמות
  const result = {};
  Object.keys(counts).forEach(key => {
    result[displayNames[key]] = counts[key];
  });
  res.json(result);
};


