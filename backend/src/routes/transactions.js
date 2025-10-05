const express = require('express');
const router = express.Router();
const { pool }= require('../db');
const {authMiddleware, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { del } = require('../redisClient');

//GET transactions
router.get('/',authMiddleware, async (req, res) => {
  const page =Math.max(1, parseInt(req.query.page || '1'));
  const limit =12;
  const offset = (page - 1) * limit;

  const userId = (req.user.role === 'admin' && req.query.userId) ? req.query.userId : req.user.id;

  try {
    const q ='SELECT * FROM transactions WHERE user_id=$1 ORDER BY date DESC LIMIT $2 OFFSET $3';
    const r = await pool.query(q, [userId, limit, offset]);
    res.json({data: r.rows });
  } catch (e) {
    console.error('GET tx err', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/',authMiddleware, requireRole('admin', 'user'), [
  body('type').isIn(['income','expense']),
  body('amount').isFloat({ gt: 0 })
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  const { type, amount, category, description, date } = req.body;
  const userId = req.user.id;

  try {
    const q ='INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *';
    const r= await pool.query(q, [userId, type, amount, category || 'Uncategorized', description || '', date || new Date()]);
    await del(`analytics:${req.user.role}:${userId}`);
    await del(`analytics:user:${userId}`);
    res.json(r.rows[0]);
  } catch (e) {
    console.error('POST tx err', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'user'), async (req, res) => {
  const id= req.params.id;
  const { type, amount, category, description, date } = req.body;
  try {
    const ex = await pool.query('SELECT user_id FROM transactions WHERE id=$1', [id]);
    if (!ex.rows.length) return res.status(404).json({ error: 'Not found' });
    const owner = ex.rows[0].user_id;
    if (req.user.role !== 'admin' && owner !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const q ='UPDATE transactions SET type=$1, amount=$2, category=$3, description=$4, date=$5 WHERE id=$6 RETURNING *';
    const r = await pool.query(q, [type, amount, category, description,date, id]);
    await del(`analytics:${req.user.role}:${owner}`);
    await del(`analytics:user:${owner}`);
    res.json(r.rows[0]);
  } catch (e) {
    console.error('PUT tx err', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id',authMiddleware, requireRole('admin', 'user'), async (req, res) => {
  const id = req.params.id;
  try {
    const ex = await pool.query('SELECT user_id FROM transactions WHERE id=$1', [id]);
    if (!ex.rows.length) return res.status(404).json({ error: 'Not found' });
    const owner = ex.rows[0].user_id;
    if (req.user.role !== 'admin' && owner !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await pool.query('DELETE FROM transactions WHERE id=$1', [id]);
    await del(`analytics:${req.user.role}:${owner}`);
    await del(`analytics:user:${owner}`);
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE tx err', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
