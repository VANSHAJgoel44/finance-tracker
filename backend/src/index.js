// main server
const express = require( 'express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { connect: connectRedis } =require('./redisClient');
const authRoutes = require('./routes/authRoutes');

const txRoutes =require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const usersRoutes= require( './routes/users');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({origin: process.env.CORS_ORIGIN || '*' }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
app.use('/api/auth', authRoutes);
app.use('/api/transactions',txRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users',usersRoutes);

const PORT =process.env.PORT || 4000;

connectRedis().then(() => {
  app.listen(PORT, () =>console.log('Server running on', PORT));
}).catch(err => {
  console.error('Redis connect failed (continuing):', err && err.message);
  app.listen(PORT, () => console.log('Server running on', PORT));
});
