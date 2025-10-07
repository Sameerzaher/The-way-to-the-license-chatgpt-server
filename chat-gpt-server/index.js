const path = require("path");
const fs = require("fs");


const questionsFilePath = path.join(__dirname, "data", "gov_theory_questions_full_hebrew_2.json");
let questions = [];
try {
  const data = fs.readFileSync(questionsFilePath, "utf-8");
  questions = JSON.parse(data);
  console.log(typeof questions);
  console.log(`Loaded ${questions.length} questions`);
  module.exports = {
    questions
  };
} catch (err) {
  console.error("Error reading questions file:", err);
}

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const allowedOrigin = "http://localhost:3001";
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());

// Rate limiting middleware
const rateLimitMap = new Map();
app.use((req, res, next) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 30; // 30 requests per minute
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientId);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + windowMs;
    return next();
  }
  
  if (clientData.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  
  clientData.count++;
  next();
});

// Middleware to log only important requests (not all)
app.use((req, res, next) => {
  // Log only POST requests and important GET requests
  if (req.method === 'POST' || req.originalUrl.includes('/dashboard') || req.originalUrl.includes('/progress')) {
    console.log('Request:', req.method, req.originalUrl);
  }
  next();
});

const chatRoutes     = require("./routes/chatRoutes");
const questionRoutes = require("./routes/questionsRoutes");
const answerRoutes   = require("./routes/answerRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const userRoutes = require("./routes/userRoutes");
const progressRoutes = require("./routes/progressRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const aiLearningRoutes = require("./routes/aiLearningRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");
console.log("📦 Routers Loading..");
app.use("/chat", chatRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);
app.use("/practice", practiceRoutes);
app.use("/user", userRoutes);
app.use("/progress", progressRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/notifications", notificationRoutes);
app.use("/ai-learning", aiLearningRoutes);
app.use("/study-plans", studyPlanRoutes);

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

console.log("✅ Routers Loaded Successfully");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");

// const app = express();

// // 🔐 CORS – אפשר רק מה-Frontend שלך ב-Render
// const allowedOrigin = "https://the-way-to-the-license-chatgpt-front.onrender.com";
// app.use(cors({
//   origin: allowedOrigin,
//   credentials: true,
// }));

// app.use(express.json());

// // 📦 Routes
// const chatRoutes     = require("./routes/chatRoutes");
// const questionRoutes = require("./routes/questionsRoutes");
// const answerRoutes   = require("./routes/answerRoutes");
// const practiceRoutes = require("./routes/practiceRoutes");
// const userRoutes     = require("./routes/userRoutes");

// console.log("📦 Routers Loading..");

// app.use("/chat", chatRoutes);
// app.use("/questions", questionRoutes);
// app.use("/answers", answerRoutes);
// app.use("/practice", practiceRoutes);
// app.use("/user", userRoutes);

// // ✅ Health check for Render
// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "OK", message: "Server is running" });
// });

// console.log("✅ Routers Loaded Successfully");

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`🌐 CORS Enabled for: ${allowedOrigin}`);
// });
