// Migration: creates teacher_departments table and migrates existing single-dept data
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'smart_attendance',
    multipleStatements: true,
  });

  console.log('Connected to database:', process.env.DB_NAME);

  // 1. Create teacher_departments junction table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS teacher_departments (
      teacher_id    INT NOT NULL,
      department_id INT NOT NULL,
      PRIMARY KEY (teacher_id, department_id),
      CONSTRAINT fk_td_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_td_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Table "teacher_departments" ensured.');

  // 2. Migrate existing single-department values from users.department for teachers
  const [teachers] = await conn.execute(
    `SELECT id, department FROM users WHERE role = 'teacher' AND department IS NOT NULL AND department != ''`
  );
  console.log(`Found ${teachers.length} teachers with existing department data to migrate.`);

  let migrated = 0;
  for (const teacher of teachers) {
    // Find matching department_id
    const [deptRows] = await conn.execute(
      `SELECT department_id FROM departments WHERE LOWER(department_name) = LOWER(?) LIMIT 1`,
      [teacher.department]
    );

    if (deptRows.length > 0) {
      const deptId = deptRows[0].department_id;
      await conn.execute(
        `INSERT IGNORE INTO teacher_departments (teacher_id, department_id) VALUES (?, ?)`,
        [teacher.id, deptId]
      );
      console.log(`  Migrated: Teacher ID ${teacher.id} → dept "${teacher.department}" (dept_id ${deptId})`);
      migrated++;
    } else {
      // Department not in the departments table yet — insert it first
      const [insertResult] = await conn.execute(
        `INSERT IGNORE INTO departments (department_name) VALUES (?)`,
        [teacher.department]
      );
      let deptId;
      if (insertResult.insertId > 0) {
        deptId = insertResult.insertId;
      } else {
        const [existing] = await conn.execute(
          `SELECT department_id FROM departments WHERE LOWER(department_name) = LOWER(?) LIMIT 1`,
          [teacher.department]
        );
        deptId = existing[0]?.department_id;
      }
      if (deptId) {
        await conn.execute(
          `INSERT IGNORE INTO teacher_departments (teacher_id, department_id) VALUES (?, ?)`,
          [teacher.id, deptId]
        );
        console.log(`  Added & migrated new dept "${teacher.department}" for teacher ID ${teacher.id}`);
        migrated++;
      }
    }
  }

  console.log(`\nMigrated ${migrated}/${teachers.length} teachers.`);

  // 3. Verify
  const [rows] = await conn.execute(`
    SELECT u.id, u.full_name, GROUP_CONCAT(d.department_name ORDER BY d.department_name SEPARATOR ', ') AS departments
    FROM users u
    LEFT JOIN teacher_departments td ON td.teacher_id = u.id
    LEFT JOIN departments d ON d.department_id = td.department_id
    WHERE u.role = 'teacher'
    GROUP BY u.id, u.full_name
  `);
  console.log('\nTeachers and their assigned departments:');
  rows.forEach(r => console.log(`  [${r.id}] ${r.full_name} → ${r.departments || 'none'}`));

  await conn.end();
  console.log('\nMigration complete!');
})().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
