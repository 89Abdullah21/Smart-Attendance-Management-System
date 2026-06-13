// Migration script: creates and seeds the departments table
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'smart_attendance',
  });

  console.log('Connected to database:', process.env.DB_NAME);

  // Create departments table if not exists
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS departments (
      department_id   INT AUTO_INCREMENT PRIMARY KEY,
      department_name VARCHAR(150) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Table "departments" ensured.');

  // Seed common university departments
  const depts = [
    'Business Administration',
    'Chemistry',
    'Civil Engineering',
    'Computer Science',
    'Electrical Engineering',
    'Information Technology',
    'Mathematics',
    'Mechanical Engineering',
    'Physics',
    'Software Engineering',
  ];

  for (const d of depts) {
    await conn.execute(
      'INSERT IGNORE INTO departments (department_name) VALUES (?)',
      [d]
    );
  }
  console.log('Departments seeded (duplicates ignored).');

  // Print table contents
  const [rows] = await conn.execute('SELECT * FROM departments ORDER BY department_name');
  console.log('\nDepartments in database:');
  rows.forEach(r => console.log(`  [${r.department_id}] ${r.department_name}`));

  await conn.end();
  console.log('\nMigration complete!');
})().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
