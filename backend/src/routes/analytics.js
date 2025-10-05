const express = require('express');
const router = express.Router();
const { pool } =require('../db');
const { authMiddleware } = require('../middleware/auth');
const { get, setEx } =require('../redisClient');
// GET /api/analytics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId =req.user.id;
    const role =req.user.role;
    const cacheKey = `analytics:${role}:${userId}`;
    const cached =await get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    const params = role ==='admin' ? [] : [userId];

    //summary
    const monthlyQ = `
      SELECT DATE_TRUNC('month', date) AS month,
             SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
             SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      ${role === 'admin' ? '' : 'WHERE user_id = $1'}
      GROUP BY month
      ORDER BY month;
    `;
    const monthlyRes =await pool.query(monthlyQ, params);

    //categories
    let categoriesQ;
    if (role ==='admin') {
      categoriesQ = `
        SELECT category, SUM(amount) AS total
        FROM transactions
        WHERE type='expense'
        GROUP BY category
        ORDER BY total DESC;
      `;
    } else {
      categoriesQ = `
        SELECT category, SUM(amount) AS total
        FROM transactions
        WHERE user_id = $1 AND type='expense'
        GROUP BY category
        ORDER BY total DESC;
      `;
    }
    const catRes =await pool.query(categoriesQ, params);
    const payload= {monthly: monthlyRes.rows, categories: catRes.rows };
    await setEx(cacheKey, 15 * 60, payload);

    res.json(payload);
  } catch (e) {
    console.error('analytics err', e && e.message);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

module.exports = router;
