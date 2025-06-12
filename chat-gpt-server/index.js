require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const chatRoutes     = require("./routes/chatRoutes");
const questionRoutes = require("./routes/questionsRoutes");
const answerRoutes   = require("./routes/answerRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const userRoutes = require("./routes/userRoutes");
console.log("📦 Routers Loading..");
app.use("/chat", chatRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);
app.use("/practice", practiceRoutes);
app.use("/user", userRoutes);

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

console.log("✅ Routers Loaded Successfully");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
