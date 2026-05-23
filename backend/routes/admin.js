const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply admin protection to all routes in this file
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// ── 1. COURSES MANAGEMENT ───────────────────────────────────────────────────

// Get all courses with assigned teacher name and enrolled student count
router.get('/courses', async (req, res) => {
  try {
    const query = `
      SELECT c.course_id, c.course_name, c.credit_hours, c.teacher_id, u.full_name AS teacher_name,
             (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id) AS enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id AND u.role = 'teacher'
      ORDER BY c.course_id ASC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Admin Courses Fetch Error:', err);
    res.status(500).json({ message: 'Failed to retrieve academic courses.' });
  }
});

// Create a new academic course
router.post('/courses', async (req, res) => {
  const { course_name, credit_hours, teacher_id } = req.body;

  if (!course_name || !credit_hours || !teacher_id) {
    return res.status(400).json({ message: 'Missing required course fields.' });
  }

  try {
    // Verify teacher exists
    const [teacherCheck] = await db.query('SELECT id FROM users WHERE id = ? AND role = ?', [teacher_id, 'teacher']);
    if (teacherCheck.length === 0) {
      return res.status(400).json({ message: 'Assigned teacher not found in faculty member records.' });
    }

    const query = 'INSERT INTO courses (course_name, credit_hours, teacher_id) VALUES (?, ?, ?)';
    const [result] = await db.query(query, [course_name, Number(credit_hours), Number(teacher_id)]);

    res.status(201).json({
      course_id: result.insertId,
      course_name,
      credit_hours: Number(credit_hours),
      teacher_id: Number(teacher_id),
      message: 'Course created successfully!'
    });
  } catch (err) {
    console.error('Admin Course Creation Error:', err);
    res.status(500).json({ message: 'Failed to create academic course.' });
  }
});

// Delete a course
router.delete('/courses/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    const query = 'DELETE FROM courses WHERE course_id = ?';
    const [result] = await db.query(query, [courseId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    res.json({ message: 'Course removed successfully.' });
  } catch (err) {
    console.error('Admin Course Deletion Error:', err);
    res.status(500).json({ message: 'Failed to delete academic course. Check if it has dependent records.' });
  }
});

// ── 2. TIMETABLE MANAGEMENT ─────────────────────────────────────────────────

// Get all scheduled timetable slots
router.get('/timetable', async (req, res) => {
  try {
    const query = `
      SELECT t.slot_id, t.course_id, c.course_name, t.teacher_id, u.full_name AS teacher_name,
             t.day_of_week, t.start_time, t.end_time, t.room_location, t.latitude, t.longitude
      FROM timetable t
      JOIN courses c ON t.course_id = c.course_id
      LEFT JOIN users u ON t.teacher_id = u.id AND u.role = 'teacher'
      ORDER BY t.slot_id ASC
    `;
    const [rows] = await db.query(query);
    
    // Format TIME values from DB to 'HH:MM'
    const formatted = rows.map(r => ({
      ...r,
      start_time: r.start_time.substring(0, 5),
      end_time: r.end_time.substring(0, 5),
      latitude: Number(r.latitude),
      longitude: Number(r.longitude)
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Admin Timetable Fetch Error:', err);
    res.status(500).json({ message: 'Failed to retrieve academic timetable slots.' });
  }
});

// Schedule a new timetable slot
router.post('/timetable', async (req, res) => {
  const { course_id, day_of_week, start_time, end_time, room_location, latitude, longitude } = req.body;

  if (!course_id || !day_of_week || !start_time || !end_time || !room_location || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Missing required timetable slot fields.' });
  }

  try {
    // Look up assigned teacher_id from courses
    const [courseRows] = await db.query('SELECT teacher_id FROM courses WHERE course_id = ?', [course_id]);
    if (courseRows.length === 0) {
      return res.status(400).json({ message: 'Target course not found.' });
    }

    const teacher_id = courseRows[0].teacher_id;

    const query = `
      INSERT INTO timetable (course_id, teacher_id, day_of_week, start_time, end_time, room_location, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      Number(course_id),
      teacher_id,
      day_of_week,
      start_time,
      end_time,
      room_location,
      Number(latitude),
      Number(longitude)
    ]);

    res.status(201).json({
      slot_id: result.insertId,
      course_id: Number(course_id),
      teacher_id,
      day_of_week,
      start_time,
      end_time,
      room_location,
      latitude: Number(latitude),
      longitude: Number(longitude),
      message: 'Timetable slot registered successfully!'
    });
  } catch (err) {
    console.error('Admin Timetable Slot Creation Error:', err);
    res.status(500).json({ message: 'Failed to register timetable slot.' });
  }
});

// Delete a timetable slot
router.delete('/timetable/:slotId', async (req, res) => {
  const { slotId } = req.params;

  try {
    const query = 'DELETE FROM timetable WHERE slot_id = ?';
    const [result] = await db.query(query, [slotId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Timetable slot not found.' });
    }

    res.json({ message: 'Timetable slot deleted successfully.' });
  } catch (err) {
    console.error('Admin Timetable Deletion Error:', err);
    res.status(500).json({ message: 'Failed to delete timetable slot.' });
  }
});

// ── 3. USER REGISTRIES (TEACHERS / STUDENTS) ─────────────────────────────────

// Get all faculty members
router.get('/teachers', async (req, res) => {
  try {
    const query = 'SELECT id AS teacher_id, full_name, email, department, created_at FROM users WHERE role = ? ORDER BY full_name ASC';
    const [rows] = await db.query(query, ['teacher']);
    res.json(rows);
  } catch (err) {
    console.error('Admin Teachers Fetch Error:', err);
    res.status(500).json({ message: 'Failed to retrieve faculty registry.' });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const query = 'SELECT id AS student_id, full_name, email, roll_number, section, semester, created_at FROM users WHERE role = ? ORDER BY full_name ASC';
    const [rows] = await db.query(query, ['student']);
    res.json(rows);
  } catch (err) {
    console.error('Admin Students Fetch Error:', err);
    res.status(500).json({ message: 'Failed to retrieve student roster.' });
  }
});

// ── 4. STUDENT-COURSE ENROLLMENT LINKING ─────────────────────────────────────

// Get all enrollments
router.get('/enrollments', async (req, res) => {
  try {
    const query = `
      SELECT e.enrollment_id, e.student_id, u.full_name AS student_name, u.roll_number,
             e.course_id, c.course_name
      FROM enrollments e
      JOIN users u ON e.student_id = u.id AND u.role = 'student'
      JOIN courses c ON e.course_id = c.course_id
      ORDER BY e.enrollment_id DESC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Admin Enrollments Fetch Error:', err);
    res.status(500).json({ message: 'Failed to retrieve enrollments.' });
  }
});

// Enroll a student in a course
router.post('/enrollments', async (req, res) => {
  const { student_id, course_id } = req.body;

  if (!student_id || !course_id) {
    return res.status(400).json({ message: 'Missing required student_id or course_id.' });
  }

  try {
    // Verify student exists
    const [studentCheck] = await db.query('SELECT id FROM users WHERE id = ? AND role = ?', [student_id, 'student']);
    if (studentCheck.length === 0) {
      return res.status(400).json({ message: 'Target student not found.' });
    }

    // Verify course exists
    const [courseCheck] = await db.query('SELECT course_id FROM courses WHERE course_id = ?', [course_id]);
    if (courseCheck.length === 0) {
      return res.status(400).json({ message: 'Target course not found.' });
    }

    // Insert enrollment
    const query = 'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)';
    const [result] = await db.query(query, [Number(student_id), Number(course_id)]);

    res.status(201).json({
      enrollment_id: result.insertId,
      student_id: Number(student_id),
      course_id: Number(course_id),
      message: 'Student enrolled in course successfully!'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Student is already enrolled in this course.' });
    }
    console.error('Admin Enrollment Error:', err);
    res.status(500).json({ message: 'Failed to enroll student in course.' });
  }
});

// Unenroll a student from a course
router.delete('/enrollments/:enrollmentId', async (req, res) => {
  const { enrollmentId } = req.params;

  try {
    const query = 'DELETE FROM enrollments WHERE enrollment_id = ?';
    const [result] = await db.query(query, [enrollmentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Enrollment not found.' });
    }

    res.json({ message: 'Student unenrolled successfully.' });
  } catch (err) {
    console.error('Admin Unenrollment Error:', err);
    res.status(500).json({ message: 'Failed to unenroll student.' });
  }
});

module.exports = router;
