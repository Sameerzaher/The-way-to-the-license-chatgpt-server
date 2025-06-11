

const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

const questions_he = require(path.join(dataDir, "gov_theory_questions_full.json"));
const questions_ar = require(path.join(dataDir, "gov_theory_questions_full_arabic.json"));

function getPoolByLang(lang) {
  return (lang && lang.toLowerCase() === "ar") ? questions_ar : questions_he;
}

exports.list = (req, res) => {
  const lang = req.query.lang || "he";
  const subject = req.query.subject || null;
  const subSubject = req.query.subSubject || null;

  let pool = getPoolByLang(lang);
  if (subject)    pool = pool.filter(q => q.subject === subject);
  if (subSubject) pool = pool.filter(q => q.subSubject === subSubject);

  return res.json(pool);
};

exports.random = (req, res) => {
  const lang = req.query.lang || "he";
  const count = parseInt(req.query.count, 10) || 1;
  const subject = req.query.subject || null;
  const subSubject = req.query.subSubject || null;

  let pool = getPoolByLang(lang);
  if (subject)    pool = pool.filter(q => q.subject === subject);
  if (subSubject) pool = pool.filter(q => q.subSubject === subSubject);

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

  return res.json(result);
};

exports.byId = (req, res) => {
  const lang = req.query.lang || "he";
  const id = req.params.id;

  const pool = getPoolByLang(lang);
  const found = pool.find(q => q.id === id);

  if (!found) {
    return res.status(404).json({
      message: (lang === "ar") ? "السؤال غير موجود" : "שאלה לא נמצאה",
    });
  }

  return res.json(found);
};
