-- Run once against the existing smart_attendance database.
-- This preserves existing data and ensures registration columns are available.

USE smart_attendance;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS departments (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO departments (department_name) VALUES
('Computer Science'),
('Software Engineering'),
('Information Technology'),
('Electrical Engineering'),
('Mechanical Engineering'),
('Civil Engineering'),
('Business Administration'),
('Mathematics'),
('Physics'),
('Chemistry');
