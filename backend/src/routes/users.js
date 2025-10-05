const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const {authMiddleware, requireRole } = require('../middleware/auth');

//adminonly
router.get('/',authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('SELECT id, name, email, role FROM users ORDER BY id');
    res.json(r.rows);
  } catch (e) {
    console.error('users err', e);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports=router;
