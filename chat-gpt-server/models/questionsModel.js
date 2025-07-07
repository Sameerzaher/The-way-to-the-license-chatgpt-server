const path = require("path");
const dataDir = path.join(__dirname, "..", "data");
const questions_he = require(path.join(dataDir, "gov_theory_questions_with_sub_topic_final_v68.json"));
const questions_ar = require(path.join(dataDir, "gov_theory_questions_full_arabic_2.json"));

function getQuestionsByLang(lang) {
  return (lang && lang.toLowerCase() === "ar") ? questions_ar : questions_he;
}

module.exports = { getQuestionsByLang }; 