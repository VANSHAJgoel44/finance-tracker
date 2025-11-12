// -------------------- IMPORTS --------------------
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { connect } = require("./redisClient");

// ✅ Import routes (make sure this matches the filename)
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analytics");



// -------------------- APP SETUP --------------------
const app = express();
app.use(helmet());
app.use(express.json());
app.use("/api/analytics", analyticsRoutes);

// -------------------- CORS --------------------
const allowedOrigin = process.env.CORS_ORIGIN || "https://melodic-hummingbird-b5735e.netlify.app";
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// -------------------- RATE LIMIT --------------------
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// -------------------- ROUTES --------------------
app.use("/api/auth", authRoutes);

// -------------------- ROOT & FALLBACK --------------------
app.get("/", (req, res) => res.send("✅ Backend running fine"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// -------------------- SERVER START --------------------
const PORT = process.env.PORT || 4000;

connect().then(() => {
  app.listen(PORT, () => {
    console.log("✅ Auth route mounted at /api/auth");
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ CORS origin: ${allowedOrigin}`);
  });
});
