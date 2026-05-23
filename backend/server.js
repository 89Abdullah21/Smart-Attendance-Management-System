const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

// Route Imports
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARES ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // Adjust to specific frontend domain (e.g. http://localhost:5173) in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware for tracking requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── DATABASE CONNECTIVITY VERIFICATION ───────────────────────────────────────
db.query('SELECT NOW() AS now')
  .then(([rows]) => {
    console.log(`✅ Connected successfully to MySQL database (Server Time: ${rows[0].now})`);
  })
  .catch((err) => {
    console.error('❌ Failed to establish connection to MySQL!', err);
  });

// ── API ROUTES ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// ── GLOBAL ERROR HANDLING MIDDLEWARE ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔥 Global Exception Handled:', err.stack);
  res.status(500).json({
    message: 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// ── START THE SERVER ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Smart Attendance express server is running on port ${PORT}`);
});

module.exports = app;
