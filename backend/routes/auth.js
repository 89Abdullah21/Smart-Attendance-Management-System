const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_jwt_secret_token_key_generation_phrase_here';

// ── 1. REGISTRATION ENDPOINT ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { full_name, email, password, role, roll_number, section, semester, department } = req.body;

  try {
    // Check if user already exists
    const [userCheck] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (userCheck.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Check roll number uniqueness for students
    if (role === 'student' && roll_number) {
      const [rollCheck] = await db.query('SELECT * FROM users WHERE roll_number = ?', [roll_number]);
      if (rollCheck.length > 0) {
        return res.status(400).json({ message: 'Roll number is already registered.' });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into MySQL
    const insertQuery = `
      INSERT INTO users (
        full_name, email, password_hash, role, 
        roll_number, section, semester, department
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      full_name,
      email.toLowerCase(),
      passwordHash,
      role,
      role === 'student' ? roll_number : null,
      role === 'student' ? section : null,
      role === 'student' ? Number(semester) : null,
      role === 'teacher' ? department : null
    ];

    const [insertResult] = await db.query(insertQuery, values);
    const newUserId = insertResult.insertId;

    // Fetch the newly created user
    const [rows] = await db.query(
      'SELECT id, full_name, email, role, roll_number, section, semester, department FROM users WHERE id = ?',
      [newUserId]
    );
    const user = rows[0];

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user,
      token,
      message: 'Account registered successfully!'
    });

  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ── 2. LOGIN ENDPOINT ───────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email.toLowerCase(), role]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email, role, or credentials.' });
    }

    const user = rows[0];

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password. Access denied.' });
    }

    // Clean user object for JWT payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    };

    // Generate token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    // Exclude password hash from response
    delete user.password_hash;

    res.json({
      user,
      token,
      message: `Welcome back, ${user.full_name}!`
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during credentials validation.' });
  }
});

// ── 3. GET PROFILE / REHYDRATION ENDPOINT ────────────────────────────────────
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, role, roll_number, section, semester, department, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Profile Fetch Error:', err);
    res.status(500).json({ message: 'Server error retrieving user credentials.' });
  }
});

// ── 4. LOGOUT ENDPOINT (STUBBED TO PREVENT ERRORS) ───────────────────────────
router.post('/logout', (req, res) => {
  res.json({ message: 'Session logged out and cleared.' });
});

module.exports = router;
