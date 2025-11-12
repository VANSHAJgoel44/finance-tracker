// backend/src/routes/analytics.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // If auth middleware provided req.user.id, scope queries to that user.
    const hasUser = req.user && req.user.id;
    const userId = hasUser ? req.user.id : null;

    // build optional WHERE clause and params depending on auth
    const whereClause = hasUser ? "WHERE user_id = $1" : "";
    const params = hasUser ? [userId] : [];

    // 1) Totals
    const incomeSql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      ${whereClause}
      ${whereClause ? "AND type='income'" : "WHERE type='income'"}
    `;
    const expenseSql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      ${whereClause}
      ${whereClause ? "AND type='expense'" : "WHERE type='expense'"}
    `;

    const [incomeRes, expenseRes] = await Promise.all([
      pool.query(incomeSql, params),
      pool.query(expenseSql, params),
    ]);

    const totalIncome = Number(incomeRes.rows[0].total || 0);
    const totalExpense = Number(expenseRes.rows[0].total || 0);
    const netBalance = totalIncome - totalExpense;

    // 2) Category breakdown (expenses grouped by category) - keep original name for compatibility
    const categorySql = `
      SELECT category, SUM(amount) as total
      FROM transactions
      ${whereClause ? `${whereClause} AND type='expense'` : `WHERE type='expense'`}
      GROUP BY category
      ORDER BY SUM(amount) DESC;
    `;
    const categoryRes = await pool.query(categorySql, params);

    // 3) Monthly aggregation (income & expense per month) - returns month as 'YYYY-MM-01'
    const monthlySql = `
      SELECT
        TO_CHAR(date_trunc('month', date), 'YYYY-MM-01') AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END),0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END),0) AS expense
      FROM transactions
      ${whereClause}
      GROUP BY date_trunc('month', date)
      ORDER BY date_trunc('month', date) ASC;
    `;
    const monthlyRes = await pool.query(monthlySql, params);

    // Format rows to numbers
    const monthly = monthlyRes.rows.map((r) => ({
      month: r.month,
      income: Number(r.income || 0),
      expense: Number(r.expense || 0),
    }));

    const categoryBreakdown = categoryRes.rows.map((r) => ({
      category: r.category,
      total: Number(r.total || 0),
    }));

    // Send response — preserve old keys and add new ones
    res.json({
      totalIncome,
      totalExpense,
      netBalance,
      categoryBreakdown,       // original name (keeps backwards compatibility)
      categories: categoryBreakdown, // also expose as `categories` for frontend convenience
      monthly,
    });
  } catch (err) {
    console.error("Analytics fetch error:", err && err.stack ? err.stack : err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
