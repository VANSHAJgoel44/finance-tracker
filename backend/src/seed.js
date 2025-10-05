const { pool } = require('./db');
const bcrypt =require('bcrypt');

(async () => {
  try {
    console.log( 'Connecting to database...');
    await pool.query(`
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS users;
    `);
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user'
      );
    `);

    //transactions table
    await pool.query(`
      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(10) CHECK (type IN ('income', 'expense')),
        amount NUMERIC(10,2) NOT NULL,
        category VARCHAR(50),
        description TEXT,
        date TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log( 'Tables created successfully.' );

    //demo users
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const userPass = await bcrypt.hash('User@123', 10);
    const readOnlyPass = await bcrypt.hash('ReadOnly@123', 10);

    await pool.query(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Admin', 'admin@Demo.com', $1, 'admin'),
      ('Normal User', 'user@Demo.com', $2, 'user'),
      ('Read Only', 'readonly@Demo.com', $3, 'read-only');
    `, [adminPass, userPass, readOnlyPass]);

    console.log(' Demo users inserted.');

    const users = await pool.query('SELECT id, email FROM users');
    const adminId = users.rows.find(u => u.email === 'admin@Demo.com').id;
    const userId = users.rows.find(u => u.email === 'user@Demo.com').id;
    const readOnlyId = users.rows.find(u => u.email === 'readonly@Demo.com').id;

    //sample transactions for Admin
    await pool.query(`
      INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES
      ($1, 'income', 9000, 'Salary', 'Monthly salary', NOW() - INTERVAL '60 days'),
      ($1, 'income', 500, 'Freelance', 'Side project', NOW() - INTERVAL '20 days'),
      ($1, 'expense', 2500, 'Rent', 'House rent', NOW() - INTERVAL '55 days'),
      ($1, 'expense', 1200, 'Food', 'Groceries and dining', NOW() - INTERVAL '30 days'),
      ($1, 'expense', 800, 'Transport', 'Car maintenance', NOW() - INTERVAL '10 days'),
      ($1, 'expense', 600, 'Entertainment', 'Movies and subscriptions', NOW());
    `, [adminId]);

    //for Normal User
    await pool.query(`
      INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES
      ($1, 'income', 4500, 'Freelance', 'User project income', NOW() - INTERVAL '50 days'),
      ($1, 'income', 1800, 'Salary', 'Part-time job', NOW() - INTERVAL '25 days'),
      ($1, 'expense', 1200, 'Food', 'Groceries and restaurants', NOW() - INTERVAL '5 days'),
      ($1, 'expense', 700, 'Transport', 'Metro and cabs', NOW() - INTERVAL '15 days'),
      ($1, 'expense', 300, 'Entertainment', 'Netflix and Spotify', NOW() - INTERVAL '8 days');
    `, [userId]);

    //for Readonly user
    await pool.query(`
      INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES
      ($1, 'income', 3500, 'Project', 'Read-only project income', NOW() - INTERVAL '20 days'),
      ($1, 'income', 1500, 'Gift', 'Family gift', NOW() - INTERVAL '10 days'),
      ($1, 'expense', 1000, 'Bills', 'Electricity and Internet', NOW() - INTERVAL '4 days'),
      ($1, 'expense', 800, 'Groceries', 'Weekly grocery shopping', NOW() - INTERVAL '2 days'),
      ($1, 'expense', 400, 'Transport', 'Taxi and bus', NOW());
    `, [readOnlyId]);

    console.log('Sample transactions inserted for all users.');
    console.log(' Database seeding complete!');
  } catch (err) {
    console.error('Seed error:', err && err.message);
  } finally {
    try { await pool.end(); } catch (e) { /* ignore */ }
    console.log('Connection closed.');
  }
})();
