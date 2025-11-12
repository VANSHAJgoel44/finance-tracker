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

// ---- Robust CORS middleware (replace previous CORS handling) ----
const allowedFromEnv = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean); // explicitly allowed exact origins, comma separated

// helper patterns: allow your production Vercel domain(s) and preview domains:
const allowedPatterns = [
  /\.vercel\.app$/i,     // allow any subdomain ending in .vercel.app (preview + production)
  /\.netlify\.app$/i,    // allow netlify if used
  // add other patterns if required, e.g. /\.example-cdn\.com$/
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // No Origin header (server-to-server or same-origin) -> proceed
  if (!origin) return next();

  // 1) Exact match from environment list
  if (allowedFromEnv.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    // 2) Pattern match (e.g., allow any vercel preview domain)
    const matched = allowedPatterns.some(pat => pat.test(origin));
    if (matched) {
      res.header("Access-Control-Allow-Origin", origin);
    }
  }

  // If header has been set to an allowed origin, send other necessary headers:
  if (res.getHeader("Access-Control-Allow-Origin")) {
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // If you later enable cookies / credentials, also set:
    // res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
  }

  // Not allowed:
  res.status(403).json({ message: "CORS origin not allowed", origin });
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

    // Informational: what origins/patterns we accept
    const envOrigins = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
    console.log("✅ CORS allowed (from CORS_ORIGIN env):", envOrigins.length ? envOrigins : "(none)");
    console.log("✅ CORS allowed patterns: [/\\.vercel\\.app$/, /\\.netlify\\.app$/]");
  });
});

