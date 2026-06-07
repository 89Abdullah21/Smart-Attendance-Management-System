const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply admin protection to all routes in this file
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// ── 1. COURSES MANAGEMENT ───────────────────────────────────────────────────

// Get all courses with assigned teacher name, class properties, and co-teachers
router.get('/courses', async (req, res) => {
  try {
    const query = `
      SELECT c.course_id, c.course_name, c.credit_hours, c.teacher_id, c.department, c.semester, c.section, u.full_name AS teacher_name,
             (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id) AS enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id AND u.role = 'teacher'
      ORDER BY c.course_id ASC
    `;
    const [courses] = await db.query(query);

    for (let c of courses) {
      const [coTeachers] = await db.query(
        'SELECT ct.teacher_id, u.full_name FROM course_teachers ct JOIN users u ON ct.teacher_id = u.id WHERE ct.course_id = ?',
        [c.course_id]
      );
      c.co_teachers = coTeachers;
      c.teacher_ids = [c.teacher_id, ...coTeachers.map(t => t.teacher_id)];
    }

    res.json(courses);
  } catch (err) {
    console.error('Admin Courses Fetch Error:', err);
    res.status(500).json({ message: 'Failed to retrieve academic courses.' });
  }
});

// Create a new academic course with class properties & multiple teachers
router.post('/courses', async (req, res) => {
  const { course_name, credit_hours, teacher_id, department, semester, section, teacher_ids } = req.body;

  if (!course_name || !credit_hours || !teacher_id) {
    return res.status(400).json({ message: 'Missing required course fields.' });
  }

  try {
    // Verify teacher exists
    const [teacherCheck] = await db.query('SELECT id FROM users WHERE id = ? AND role = ?', [teacher_id, 'teacher']);
    if (teacherCheck.length === 0) {
      return res.status(400).json({ message: 'Primary teacher not found.' });
    }

    const query = `
      INSERT INTO courses (course_name, credit_hours, teacher_id, department, semester, section) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      course_name, 
      Number(credit_hours), 
      Number(teacher_id),
      department || null,
      semester ? Number(semester) : null,
      section || null
    ]);

    const courseId = result.insertId;

    // Handle co-teachers
    if (Array.isArray(teacher_ids)) {
      for (const tId of teacher_ids) {
        if (Number(tId) !== Number(teacher_id)) {
          await db.query(
            'INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE course_id=course_id',
            [courseId, Number(tId)]
          );
        }
      }
    }

    // Auto-enroll matching students
    if (department && semester && section) {
      const [matchingStudents] = await db.query(
        'SELECT id FROM users WHERE role = ? AND LOWER(department) = LOWER(?) AND semester = ? AND LOWER(section) = LOWER(?)',
        ['student', department, Number(semester), section]
      );
      for (const student of matchingStudents) {
        await db.query(
          'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrollment_id=enrollment_id',
          [student.id, courseId]
        );
      }
    }

    res.status(201).json({
      course_id: courseId,
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

// Edit an academic course (PUT /courses/:courseId)
router.put('/courses/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const { course_name, credit_hours, teacher_id, department, semester, section, teacher_ids } = req.body;

  if (!course_name || !credit_hours || !teacher_id) {
    return res.status(400).json({ message: 'Missing required course fields.' });
  }

  try {
    const [courseCheck] = await db.query('SELECT * FROM courses WHERE course_id = ?', [courseId]);
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const query = `
      UPDATE courses SET 
        course_name = ?, 
        credit_hours = ?, 
        teacher_id = ?, 
        department = ?, 
        semester = ?, 
        section = ? 
      WHERE course_id = ?
    `;
    await db.query(query, [
      course_name,
      Number(credit_hours),
      Number(teacher_id),
      department || null,
      semester ? Number(semester) : null,
      section || null,
      courseId
    ]);

    // Update co-teachers: delete existing ones first
    await db.query('DELETE FROM course_teachers WHERE course_id = ?', [courseId]);

    // Insert new co-teachers
    if (Array.isArray(teacher_ids)) {
      for (const tId of teacher_ids) {
        if (Number(tId) !== Number(teacher_id)) {
          await db.query(
            'INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE course_id=course_id',
            [courseId, Number(tId)]
          );
        }
      }
    }

    // Auto-enroll matching students
    if (department && semester && section) {
      const [matchingStudents] = await db.query(
        'SELECT id FROM users WHERE role = ? AND LOWER(department) = LOWER(?) AND semester = ? AND LOWER(section) = LOWER(?)',
        ['student', department, Number(semester), section]
      );
      for (const student of matchingStudents) {
        await db.query(
          'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrollment_id=enrollment_id',
          [student.id, courseId]
        );
      }
    }

    res.json({ message: 'Course updated successfully!' });
  } catch (err) {
    console.error('Admin Course Edit Error:', err);
    res.status(500).json({ message: 'Failed to update academic course.' });
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
  const { course_id, day_of_week, start_time, end_time, room_location, latitude, longitude, teacher_id } = req.body;

  if (!course_id || !day_of_week || !start_time || !end_time || !room_location || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Missing required timetable slot fields.' });
  }

  try {
    // Look up assigned teacher_id from courses
    const [courseRows] = await db.query('SELECT teacher_id FROM courses WHERE course_id = ?', [course_id]);
    if (courseRows.length === 0) {
      return res.status(400).json({ message: 'Target course not found.' });
    }

    let assignedTeacherId = courseRows[0].teacher_id;
    if (teacher_id) {
      const [teacherCheck] = await db.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [Number(teacher_id), 'teacher']
      );
      if (teacherCheck.length === 0) {
        return res.status(400).json({ message: 'Selected instructor not found.' });
      }

      const [coCheck] = await db.query(
        'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
        [course_id, Number(teacher_id)]
      );
      if (Number(teacher_id) !== Number(assignedTeacherId) && coCheck.length === 0) {
        return res.status(400).json({ message: 'Selected instructor is not assigned to this course.' });
      }
      assignedTeacherId = Number(teacher_id);
    }

    const query = `
      INSERT INTO timetable (course_id, teacher_id, day_of_week, start_time, end_time, room_location, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      Number(course_id),
      assignedTeacherId,
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

// Edit any user (PUT /users/:userId)
router.put('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { full_name, email, roll_number, section, semester, department, role } = req.body;

  try {
    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const currentUser = userRows[0];

    // Check email uniqueness if email is changed
    if (email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const [emailCheck] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ message: 'Email is already in use.' });
      }
    }

    // Check roll number uniqueness if changed
    if (role === 'student' && roll_number && roll_number !== currentUser.roll_number) {
      const [rollCheck] = await db.query('SELECT * FROM users WHERE roll_number = ?', [roll_number]);
      if (rollCheck.length > 0) {
        return res.status(400).json({ message: 'Roll number is already registered.' });
      }
    }

    const updateQuery = `
      UPDATE users SET 
        full_name = ?,
        email = ?,
        roll_number = ?,
        section = ?,
        semester = ?,
        department = ?
      WHERE id = ?
    `;

    const values = [
      full_name || currentUser.full_name,
      email ? email.toLowerCase() : currentUser.email,
      role === 'student' ? (roll_number || currentUser.roll_number) : null,
      role === 'student' ? (section || currentUser.section) : null,
      role === 'student' ? (semester !== undefined ? Number(semester) : currentUser.semester) : null,
      (role === 'teacher' || role === 'student') ? (department || currentUser.department) : null,
      userId
    ];

    await db.query(updateQuery, values);

    // If student class changed, sync enrollments
    const finalRole = role || currentUser.role;
    const finalDept = (finalRole === 'student' || finalRole === 'teacher') ? (department || currentUser.department) : null;
    const finalSem = finalRole === 'student' ? (semester !== undefined ? Number(semester) : currentUser.semester) : null;
    const finalSec = finalRole === 'student' ? (section || currentUser.section) : null;

    if (finalRole === 'student' && finalDept && finalSem && finalSec) {
      // Auto enroll matching student
      const [matchingCourses] = await db.query(
        'SELECT course_id FROM courses WHERE LOWER(department) = LOWER(?) AND semester = ? AND LOWER(section) = LOWER(?)',
        [finalDept, Number(finalSem), finalSec]
      );
      for (const c of matchingCourses) {
        await db.query(
          'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrollment_id=enrollment_id',
          [userId, c.course_id]
        );
      }
    }

    res.json({ message: 'User updated successfully!' });
  } catch (err) {
    console.error('Admin User Edit Error:', err);
    res.status(500).json({ message: 'Failed to update user profile.' });
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

// ── 5. DEPARTMENTS MANAGEMENT ─────────────────────────────────────────────────

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT department_id, department_name FROM departments ORDER BY department_name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Admin Departments Fetch Error:', err);
    res.status(500).json({ message: 'Failed to retrieve departments.' });
  }
});

// Create a new department
router.post('/departments', async (req, res) => {
  const { department_name } = req.body;
  if (!department_name || !department_name.trim()) {
    return res.status(400).json({ message: 'Department name is required.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO departments (department_name) VALUES (?)',
      [department_name.trim()]
    );
    res.status(201).json({
      department_id: result.insertId,
      department_name: department_name.trim(),
      message: 'Department created successfully!'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Department already exists.' });
    }
    console.error('Admin Department Creation Error:', err);
    res.status(500).json({ message: 'Failed to create department.' });
  }
});

// Delete a department
router.delete('/departments/:departmentId', async (req, res) => {
  const { departmentId } = req.params;
  try {
    const [result] = await db.query('DELETE FROM departments WHERE department_id = ?', [departmentId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found.' });
    }
    res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    console.error('Admin Department Deletion Error:', err);
    res.status(500).json({ message: 'Failed to delete department.' });
  }
});

module.exports = router;
