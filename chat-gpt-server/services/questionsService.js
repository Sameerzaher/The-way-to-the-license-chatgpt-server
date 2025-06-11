const fs = require("fs");
const path = require("path");

let cache = null;

function load() {
  if (!cache) {
    const file = path.join(__dirname, "..", "data", "gov_theory_questions_full.json");
    cache = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return cache;
}

function filter({ subject, subSubject }) {
  let data = load();
  if (subject)     data = data.filter(q => q.subject === subject);
  if (subSubject)  data = data.filter(q => q.subSubject === subSubject);
  return data;
}

function getAll(params = {})        { return filter(params); }
function getQuestionById(id)        { return load().find(q => q.id === String(id)); }
function getRandom(params = {}, n = 10) {
  const arr = filter(params);
  return arr.sort(() => 0.5 - Math.random()).slice(0, n);
}

module.exports = { getAll, getQuestionById, getRandom };
exports.getAll = (req, res) => {
  const params = {
    subject: req.query.subject,
    subSubject: req.query.subSubject
  };
  res.json(getAll(params));
}; 
exports.getById = (req, res) => {
  const id = req.params.id;
  const question = getQuestionById(id);
  if (!question) {
    return res.status(404).json({ error: "שאלה לא נמצאה" });
  }
  res.json(question);
};
exports.getRandom = (req, res) => {
  const params = {
    subject: req.query.subject,
    subSubject: req.query.subSubject
  };
  const count = parseInt(req.query.count, 10) || 10;
  res.json(getRandom(params, count));
};
