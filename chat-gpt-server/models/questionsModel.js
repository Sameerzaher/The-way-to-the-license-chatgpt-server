const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "..", "data");

// טעינה בטוחה של שאלות
let questions_he = [];
let questions_ar = [];

try {
  console.log('📂 Loading Hebrew questions...');
  const hePath = path.join(dataDir, "gov_theory_questions_with_sub_topic_final_v68.json");
  if (fs.existsSync(hePath)) {
    const heData = fs.readFileSync(hePath, 'utf8');
    questions_he = JSON.parse(heData);
    console.log(`✅ Loaded ${questions_he.length} Hebrew questions`);
  } else {
    console.error('❌ Hebrew questions file not found:', hePath);
  }
} catch (error) {
  console.error('❌ Error loading Hebrew questions:', error.message);
}

try {
  console.log('📂 Loading Arabic questions...');
  const arPath = path.join(dataDir, "gov_theory_questions_full_arabic_2.json");
  if (fs.existsSync(arPath)) {
    const arData = fs.readFileSync(arPath, 'utf8');
    questions_ar = JSON.parse(arData);
    console.log(`✅ Loaded ${questions_ar.length} Arabic questions`);
  } else {
    console.error('❌ Arabic questions file not found:', arPath);
  }
} catch (error) {
  console.error('❌ Error loading Arabic questions:', error.message);
}

function getQuestionsByLang(lang) {
  console.log(`🔍 Getting questions for language: ${lang}`);
  const questions = (lang && lang.toLowerCase() === "ar") ? questions_ar : questions_he;
  console.log(`📊 Returning ${questions.length} questions`);
  return questions;
}

module.exports = { getQuestionsByLang }; 