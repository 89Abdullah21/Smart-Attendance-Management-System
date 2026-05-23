const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ── 1. GET STUDENT TIMETABLE ────────────────────────────────────────────────
router.get('/timetable', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const query = `
      SELECT t.*, c.course_name, u.full_name AS teacher_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN timetable t ON t.course_id = c.course_id
      JOIN users u ON t.teacher_id = u.id
      WHERE e.student_id = ?
    `;
    const [rows] = await db.query(query, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Timetable Fetch Error:', err);
    res.status(500).json({ message: 'Failed to retrieve academic timetable.' });
  }
});

// ── 2. GET TODAY'S TIMETABLE SLOTS ──────────────────────────────────────────
router.get('/timetable/today', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = dayNames[new Date().getDay()];

    const query = `
      SELECT t.*, c.course_name, u.full_name AS teacher_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN timetable t ON t.course_id = c.course_id
      JOIN users u ON t.teacher_id = u.id
      WHERE e.student_id = ? AND t.day_of_week = ?
    `;
    const [rows] = await db.query(query, [req.user.id, currentDay]);
    res.json(rows);
  } catch (err) {
    console.error('Today Timetable Fetch Error:', err);
    res.status(500).json({ message: "Failed to retrieve today's schedule." });
  }
});

// ── 3. GET ATTENDANCE SUMMARY BY COURSE ──────────────────────────────────────
router.get('/attendance/summary', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const query = `
      SELECT c.course_id, c.course_name,
             COUNT(a.attendance_id) AS total,
             SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
             SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN attendance a ON a.course_id = c.course_id AND a.student_id = ?
      WHERE e.student_id = ?
      GROUP BY c.course_id, c.course_name
    `;

    const [rows] = await db.query(query, [req.user.id, req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Attendance Summary Query Error:', err);
    res.status(500).json({ message: 'Failed to compute attendance summaries.' });
  }
});

// ── 4. GET SINGLE TIMETABLE SLOT DETAILS ─────────────────────────────────────
router.get('/slot/:slotId', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { slotId } = req.params;

  try {
    const query = `
      SELECT t.slot_id, t.course_id, c.course_name, u.full_name AS teacher_name,
             t.start_time, t.end_time, t.room_location, t.latitude, t.longitude
      FROM timetable t
      JOIN courses c ON t.course_id = c.course_id
      JOIN users u ON t.teacher_id = u.id
      WHERE t.slot_id = ?
    `;
    const [rows] = await db.query(query, [slotId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Requested lecture slot details not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Slot Details Fetch Error:', err);
    res.status(500).json({ message: 'Failed to load lecture slot coordinates.' });
  }
});

// ── 5. GET STUDENT ATTENDANCE LOGS (DASHBOARD COMPATIBILITY ALIAS) ──────────
router.get('/attendance', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const query = `
      SELECT a.*, c.course_name, t.room_location 
      FROM attendance a
      JOIN courses c ON a.course_id = c.course_id
      JOIN timetable t ON a.slot_id = t.slot_id
      WHERE a.student_id = ?
      ORDER BY a.marked_at DESC
    `;
    const [rows] = await db.query(query, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('History Query Error:', err);
    res.status(500).json({ message: 'Failed to load historical check-ins.' });
  }
});

module.exports = router;
