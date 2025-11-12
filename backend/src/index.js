// -------------------- IMPORTS --------------------
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { connect } = require("./redisClient");

// routes
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analytics");

// -------------------- PRESTART CHECKS --------------------
// Warn if JWT_SECRET missing or too short (helps prevent runtime 500s)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 10) {
  console.warn("⚠️ JWT_SECRET is not set or is too short. Set JWT_SECRET env var in Render (or .env for local dev).");
  // Optional: uncomment to fail fast
  // console.error("FATAL: JWT_SECRET is required. Exiting.");
  // process.exit(1);
}

// -------------------- APP SETUP --------------------
const app = express();
app.use(helmet());
app.use(express.json());

// ---- Robust CORS middleware (must run BEFORE route mounts) ----
const allowedFromEnv = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean); // explicitly allowed exact origins

const allowedPatterns = [
  /\.vercel\.app$/i,     // allow vercel preview & production domains
  /\.netlify\.app$/i,    // allow netlify previews if used
  // add additional patterns here if necessary
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // If no origin header, not a browser cross-origin request — continue
  if (!origin) return next();

  let allowed = false;

  // 1) Exact matches from env
  if (allowedFromEnv.includes(origin)) allowed = true;

  // 2) Pattern matches (e.g. any preview domain)
  if (!allowed) {
    allowed = allowedPatterns.some(pat => pat.test(origin));
  }

  if (allowed) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // If you want to allow cookies / credentials in the future:
    // res.header("Access-Control-Allow-Credentials", "true");

    // Helpful debug log (optional; remove in prod)
    // console.log("CORS: allowed origin", origin);

    if (req.method === "OPTIONS") {
      // Preflight — respond quickly
      return res.sendStatus(204);
    }
    return next();
  }

  // Not allowed origin
  res.status(403).json({ message: "CORS origin not allowed", origin });
});

// -------------------- RATE LIMIT --------------------
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// -------------------- ROUTES --------------------
// Mount routes after CORS middleware so preflight is handled
app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);

// -------------------- ROOT & FALLBACK --------------------
app.get("/", (req, res) => res.send("✅ Backend running fine"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// -------------------- SERVER START --------------------
const PORT = process.env.PORT || 4000;

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log("✅ Auth route mounted at /api/auth");
      console.log("✅ Analytics route mounted at /api/analytics");
      console.log(`✅ Server running on port ${PORT}`);

      // Show configured CORS origins and patterns (informational)
      const envOrigins = allowedFromEnv.length ? allowedFromEnv : "(none)";
      console.log("✅ CORS allowed (from CORS_ORIGIN env):", envOrigins);
      console.log("✅ CORS allowed patterns: [/\\.vercel\\.app$/, /\\.netlify\\.app$/]");
    });
  })
  .catch(err => {
    console.error("Failed to connect to services (redis/db?)", err);
    process.exit(1);
  });

module.exports = app;
