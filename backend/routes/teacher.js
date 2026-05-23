const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ── 1. GET TEACHER COURSES ──────────────────────────────────────────────────
router.get('/courses', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT c.*, u.full_name AS teacher_name FROM courses c JOIN users u ON c.teacher_id = u.id WHERE c.teacher_id = ?',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Teacher Courses Query Error:', err);
    res.status(500).json({ message: 'Failed to retrieve course registries.' });
  }
});

// ── 2. GET KPI SUMMARY & CHART DATA ──────────────────────────────────────────
router.get('/kpi/:courseId', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  const { courseId } = req.params;
  const { from, to } = req.query;

  try {
    // Total enrollment count
    const [enrollRows] = await db.query(
      'SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ?',
      [courseId]
    );
    const enrolledStudents = Number(enrollRows[0].count) || 1;

    // Fetch aggregate attendance metrics
    let attQuery = `
      SELECT status, COUNT(*) AS count 
      FROM attendance 
      WHERE course_id = ?
    `;
    const params = [courseId];

    if (from && to) {
      attQuery += ' AND class_date BETWEEN ? AND ?';
      params.push(from, to);
    }
    attQuery += ' GROUP BY status';

    const [attRows] = await db.query(attQuery, params);

    let present = 0;
    let absent = 0;

    attRows.forEach(r => {
      if (r.status === 'Present') present = Number(r.count);
      if (r.status === 'Absent') absent = Number(r.count);
    });

    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    // Generate trend chart logs grouped by class date
    let chartQuery = `
      SELECT class_date, 
             SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS Present,
             SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS Absent
      FROM attendance
      WHERE course_id = ?
    `;
    const chartParams = [courseId];
    if (from && to) {
      chartQuery += ' AND class_date BETWEEN ? AND ?';
      chartParams.push(from, to);
    }
    chartQuery += ' GROUP BY class_date ORDER BY class_date ASC';

    const [chartRows] = await db.query(chartQuery, chartParams);

    const chartData = chartRows.map(r => ({
      date: new Date(r.class_date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }),
      Present: Number(r.Present),
      Absent: Number(r.Absent)
    }));

    res.json({
      present,
      absent,
      total: total || 0,
      rate,
      trend: 2.4, // Comparison benchmark
      chartData
    });

  } catch (err) {
    console.error('Teacher KPI Query Error:', err);
    res.status(500).json({ message: 'Failed to generate course analytics report.' });
  }
});

// ── 3. GET ROSTER FOR A SESSION ──────────────────────────────────────────────
router.get('/roster/:courseId', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  const { courseId } = req.params;
  const { date } = req.query; // YYYY-MM-DD
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Queries all enrolled students in the course, left-joining their attendance log for the chosen date
    const query = `
      SELECT u.id AS student_id, u.full_name, u.roll_number, u.section,
             a.status, a.marked_at, a.is_location_valid
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN attendance a ON a.student_id = u.id AND a.course_id = ? AND a.class_date = ?
      WHERE e.course_id = ?
    `;

    const [rows] = await db.query(query, [courseId, targetDate, courseId]);
    res.json(rows);
  } catch (err) {
    console.error('Teacher Roster Query Error:', err);
    res.status(500).json({ message: 'Failed to retrieve roster registries.' });
  }
});

// ── 4. GET STUDENT ATTENDANCE AUDIT LOG ──────────────────────────────────────
router.get('/audit/:studentId/:courseId', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  const { studentId, courseId } = req.params;

  try {
    const query = `
      SELECT a.attendance_id, a.class_date, a.marked_at, a.status, a.is_location_valid,
             t.room_location, a.latitude_marked, a.longitude_marked
      FROM attendance a
      JOIN timetable t ON a.slot_id = t.slot_id
      WHERE a.student_id = ? AND a.course_id = ?
      ORDER BY a.class_date DESC
    `;

    const [rows] = await db.query(query, [studentId, courseId]);
    res.json(rows);
  } catch (err) {
    console.error('Teacher Audit Query Error:', err);
    res.status(500).json({ message: 'Failed to retrieve student audits.' });
  }
});

module.exports = router;
