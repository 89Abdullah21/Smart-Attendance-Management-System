const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ── 1. GET TEACHER COURSES ──────────────────────────────────────────────────
router.get('/courses', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.full_name AS teacher_name 
       FROM courses c 
       JOIN users u ON c.teacher_id = u.id 
       WHERE c.teacher_id = ? OR c.course_id IN (SELECT course_id FROM course_teachers WHERE teacher_id = ?)`,
      [req.user.id, req.user.id]
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

// ── 3. GET REPORT DATA FOR CHARTS + EXPORT ───────────────────────────────────
router.get('/report/:courseId', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  const { courseId } = req.params;
  const { from, to, type = 'weekly' } = req.query;

  try {
    const [courseRows] = await db.query(
      'SELECT course_id, course_name FROM courses WHERE course_id = ?',
      [courseId]
    );
    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const [assignment] = await db.query(
      `SELECT 1 FROM courses c
       WHERE c.course_id = ?
         AND (c.teacher_id = ? OR EXISTS (
           SELECT 1 FROM course_teachers ct WHERE ct.course_id = c.course_id AND ct.teacher_id = ?
         ))`,
      [courseId, req.user.id, req.user.id]
    );
    if (assignment.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to this course.' });
    }

    const dateClause = from && to ? 'AND a.class_date BETWEEN ? AND ?' : '';
    const dateParams = from && to ? [from, to] : [];

    let trendQuery = '';
    if (type === 'monthly') {
      trendQuery = `
        SELECT DATE_FORMAT(a.class_date, '%Y-%m') AS label,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
               SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent
        FROM attendance a
        WHERE a.course_id = ? ${dateClause}
        GROUP BY YEAR(a.class_date), MONTH(a.class_date)
        ORDER BY YEAR(a.class_date), MONTH(a.class_date)
      `;
    } else if (type === 'daily') {
      trendQuery = `
        SELECT DATE_FORMAT(a.class_date, '%Y-%m-%d') AS label,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
               SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent
        FROM attendance a
        WHERE a.course_id = ? ${dateClause}
        GROUP BY a.class_date
        ORDER BY a.class_date
      `;
    } else {
      trendQuery = `
        SELECT DATE_FORMAT(MIN(a.class_date), '%Y-%m-%d') AS label,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
               SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent
        FROM attendance a
        WHERE a.course_id = ? ${dateClause}
        GROUP BY YEARWEEK(a.class_date, 1)
        ORDER BY MIN(a.class_date)
      `;
    }

    const [trendRows] = await db.query(trendQuery, [courseId, ...dateParams]);
    const trend = trendRows.map(r => ({
      label: r.label,
      present: Number(r.present) || 0,
      absent: Number(r.absent) || 0
    }));

    const [distRows] = await db.query(
      `
        SELECT
          SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
          SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent
        FROM attendance a
        WHERE a.course_id = ? ${dateClause}
      `,
      [courseId, ...dateParams]
    );
    const dist = distRows[0] || {};
    const distribution = [{
      label: 'Total',
      present: Number(dist.present) || 0,
      absent: Number(dist.absent) || 0
    }];

    const joinDateClause = from && to ? 'AND a.class_date BETWEEN ? AND ?' : '';
    const rowsParams = from && to ? [from, to, courseId] : [courseId];
    const [rows] = await db.query(
      `
        SELECT u.id AS student_id, u.full_name, u.roll_number, u.section,
               COALESCE(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END), 0) AS present,
               COALESCE(SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END), 0) AS absent,
               COALESCE(COUNT(a.attendance_id), 0) AS total
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        LEFT JOIN attendance a
          ON a.student_id = u.id
         AND a.course_id = e.course_id
         ${joinDateClause}
        WHERE e.course_id = ?
        GROUP BY u.id, u.full_name, u.roll_number, u.section
        ORDER BY u.full_name ASC
      `,
      rowsParams
    );

    const enrichedRows = rows.map(r => ({
      ...r,
      present: Number(r.present) || 0,
      absent: Number(r.absent) || 0,
      total: Number(r.total) || 0,
      rate: r.total ? Math.round((Number(r.present) / Number(r.total)) * 100) : 0
    }));

    res.json({
      course: courseRows[0],
      trend,
      distribution,
      rows: enrichedRows,
      history: []
    });
  } catch (err) {
    console.error('Teacher Report Query Error:', err);
    res.status(500).json({ message: 'Failed to generate report data.' });
  }
});

// ── 4. GET ROSTER FOR A SESSION ──────────────────────────────────────────────
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

// ── 5. GET STUDENT ATTENDANCE AUDIT LOG ──────────────────────────────────────
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

// ── 6. MANUAL ATTENDANCE OVERRIDE BY TEACHER ─────────────────────────────────
router.post('/attendance/mark-manual', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  const { course_id, student_ids, status, class_date } = req.body;

  if (!course_id || !Array.isArray(student_ids) || student_ids.length === 0 || !status || !class_date) {
    return res.status(400).json({ message: 'Missing required parameters.' });
  }

  try {
    // Fetch a scheduled slot for this course to satisfy slot_id constraints
    const [slotRows] = await db.query('SELECT slot_id FROM timetable WHERE course_id = ? LIMIT 1', [course_id]);
    if (slotRows.length === 0) {
      return res.status(400).json({ message: 'No timetable slot is scheduled for this course. Please ask the admin to schedule at least one slot for this course first.' });
    }
    const slotId = slotRows[0].slot_id;

    // Perform bulk insertion/update
    const insertQuery = `
      INSERT INTO attendance (
        student_id, slot_id, course_id, 
        latitude_marked, longitude_marked, 
        is_location_valid, status, class_date
      ) VALUES (?, ?, ?, 0.0, 0.0, 1, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        marked_at = CURRENT_TIMESTAMP
    `;

    for (const studentId of student_ids) {
      await db.query(insertQuery, [
        Number(studentId),
        slotId,
        Number(course_id),
        status,
        class_date
      ]);
    }

    res.json({ message: `Successfully updated attendance records to '${status}' for ${student_ids.length} students.` });
  } catch (err) {
    console.error('Manual Marking Error:', err);
    res.status(500).json({ message: 'Failed to manually record attendance.' });
  }
});

module.exports = router;
