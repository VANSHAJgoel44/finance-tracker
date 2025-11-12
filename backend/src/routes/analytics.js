// backend/src/routes/analytics.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

// ✅ GET /api/analytics — summary of all transactions
router.get("/", async (req, res) => {
  try {
    const incomeRes = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type='income';"
    );
    const expenseRes = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type='expense';"
    );

    const categoryRes = await pool.query(
      "SELECT category, SUM(amount) as total FROM transactions WHERE type='expense' GROUP BY category;"
    );

    const totalIncome = Number(incomeRes.rows[0].total);
    const totalExpense = Number(expenseRes.rows[0].total);
    const netBalance = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      netBalance,
      categoryBreakdown: categoryRes.rows,
    });
  } catch (err) {
    console.error("Analytics fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
