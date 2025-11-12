const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require("bcryptjs");

const jwt =require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const { authMiddleware } = require('../middleware/auth');

router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({min: 6 }),
  body('name').notEmpty()
], async (req,res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  const { name, email, password } = req.body;
  try {
    const hashed =await bcrypt.hash(password, 10);
    const q ='INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role';
    const r= await pool.query(q, [name, email, hashed, 'user']);
    res.json(r.rows[0]);
  } catch (e) {
    if (e.code ==='23505') return res.status(400).json({ error: 'Email already exists' });
    console.error('Register err', e);
    res.status(500).json({ error: 'Server error' });
  }
});

//login
router.post('/login',[
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const { email, password } =req.body;
  try {
    const r = await pool.query('SELECT id, name, password, role FROM users WHERE email=$1', [email]);
    if (!r.rows.length) return res.status(400).json({ error: 'Invalid credentials' });
    const u = r.rows[0];
    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: u.id, role: u.role, email }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: u.id, name: u.name, email, role: u.role } });
  } catch (e) {
    console.error('Login err', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me',authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
