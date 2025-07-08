const express = require("express");
const router = express.Router();
const qc = require("../controllers/questionsController");
const { downloadPdfByLicenseType } = require('../controllers/questionsController');

router.get("/", qc.list);               // GET /questions
router.get("/random", qc.random);      // GET /questions/random?count=...
router.get("/pdf", downloadPdfByLicenseType);
router.get("/list", qc.list);
router.get('/subjects', qc.subjects);
router.get('/topics', qc.topics);
router.get('/sub-subjects', qc.subSubjects);
router.get('/:id', qc.byId);           // GET /questions/:id


module.exports = router;
// Compare this snippet from chat-gpt-server/routes/questionsRoutes.js: