-- =========================================================================
-- MIGRATION: Add departments table
-- Run this on your existing smart_attendance database to fix the
-- empty department dropdown on the login/registration/settings pages.
-- =========================================================================

USE smart_attendance;

-- Create departments table (safe to run even if it already exists)
CREATE TABLE IF NOT EXISTS departments (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert common university departments (ignore duplicates)
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

SELECT * FROM departments;
