-- =========================================================================
-- Smart Attendance Management System
-- MySQL DDL Script  |  MySQL Workbench Compatible
-- Database: smart_attendance
-- =========================================================================

CREATE DATABASE IF NOT EXISTS smart_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_attendance;

-- ── Drop tables in reverse dependency order ────────────────────────────────
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS timetable;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

-- ── 1. USERS (unified table for admins, teachers, and students) ────────────
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('student', 'teacher', 'admin') NOT NULL,

    -- Student-only fields
    roll_number   VARCHAR(30)  DEFAULT NULL UNIQUE,
    section       VARCHAR(10)  DEFAULT NULL,
    semester      INT          DEFAULT NULL,

    -- Teacher-only fields
    department    VARCHAR(100) DEFAULT NULL,

    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ── 2. COURSES ─────────────────────────────────────────────────────────────
CREATE TABLE courses (
    course_id    INT AUTO_INCREMENT PRIMARY KEY,
    course_name  VARCHAR(100) NOT NULL,
    credit_hours INT NOT NULL CHECK (credit_hours > 0),
    teacher_id   INT NOT NULL,

    CONSTRAINT fk_course_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. ENROLLMENTS (many-to-many: students ↔ courses) ─────────────────────
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id    INT NOT NULL,
    course_id     INT NOT NULL,
    enrolled_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_enrollment_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_enrollment_student ON enrollments(student_id);
CREATE INDEX idx_enrollment_course  ON enrollments(course_id);

-- ── 4. TIMETABLE (schedule + geofence per slot) ────────────────────────────
CREATE TABLE timetable (
    slot_id       INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT NOT NULL,
    teacher_id    INT NOT NULL,
    day_of_week   ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    room_location VARCHAR(100)  NOT NULL,
    latitude      DECIMAL(9, 6) NOT NULL,
    longitude     DECIMAL(9, 6) NOT NULL,

    CONSTRAINT fk_timetable_course
        FOREIGN KEY (course_id)  REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_timetable_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_timetable_course  ON timetable(course_id);
CREATE INDEX idx_timetable_teacher ON timetable(teacher_id);

-- ── 5. ATTENDANCE (GPS-verified check-in records) ──────────────────────────
CREATE TABLE attendance (
    attendance_id     INT AUTO_INCREMENT PRIMARY KEY,
    student_id        INT           NOT NULL,
    slot_id           INT           NOT NULL,
    course_id         INT           NOT NULL,
    latitude_marked   DECIMAL(9, 6) NOT NULL,
    longitude_marked  DECIMAL(9, 6) NOT NULL,
    is_location_valid TINYINT(1)    NOT NULL DEFAULT 0,
    status            ENUM('Present', 'Absent') NOT NULL,
    marked_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    class_date        DATE          NOT NULL DEFAULT (CURDATE()),

    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_slot
        FOREIGN KEY (slot_id)    REFERENCES timetable(slot_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_course
        FOREIGN KEY (course_id)  REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_student_slot_date UNIQUE (student_id, slot_id, class_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_slot    ON attendance(slot_id);
CREATE INDEX idx_attendance_course  ON attendance(course_id);
CREATE INDEX idx_attendance_date    ON attendance(class_date);

-- =========================================================================
-- SEED DATA  (password for all accounts: "password")
-- =========================================================================

-- Admin
INSERT INTO users (full_name, email, password_hash, role)
VALUES ('System Admin', 'admin@uni.edu',
        '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'admin');

-- Teachers  (id = 2, 3)
INSERT INTO users (full_name, email, password_hash, role, department)
VALUES
('Dr. Sarah Ahmed',   'sarah.ahmed@uni.edu',
 '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'teacher', 'Computer Science'),
('Prof. Usman Malik', 'usman.malik@uni.edu',
 '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'teacher', 'Computer Science');

-- Students  (id = 4, 5, 6)
INSERT INTO users (full_name, email, password_hash, role, roll_number, section, semester)
VALUES
('Alex Johnson', 'alex.johnson@uni.edu',
 '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'student', '2021-CS-042', 'A', 5),
('Sara Khan',    'sara.khan@uni.edu',
 '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'student', '2021-CS-017', 'A', 5),
('Bilal Raza',   'bilal.raza@uni.edu',
 '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'student', '2021-CS-089', 'B', 5);

-- Courses  (teacher_id 2 = Dr. Sarah, 3 = Prof. Usman)
INSERT INTO courses (course_name, credit_hours, teacher_id)
VALUES
('Data Structures & Algorithms', 3, 2),
('Operating Systems',            3, 3),
('Database Systems',             3, 2);

-- Enrollments
INSERT INTO enrollments (student_id, course_id)
VALUES
(4, 1),   -- Alex  -> DSA
(5, 1),   -- Sara  -> DSA
(4, 2);   -- Alex  -> OS

-- Timetable slots
INSERT INTO timetable (course_id, teacher_id, day_of_week, start_time, end_time, room_location, latitude, longitude)
VALUES
(1, 2, 'Mon', '08:00:00', '09:30:00', 'CS Lab 1', 33.738045, 72.814522),
(2, 3, 'Tue', '10:00:00', '11:30:00', 'Room 204', 33.738120, 72.814780);

USE smart_attendance;

-- 1. Fix your manually added admin account password
UPDATE users 
SET password_hash = '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi' 
WHERE email = 'admin@ims.edu';

-- 2. Fix the default seeded admin account password
UPDATE users 
SET password_hash = '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi' 
WHERE email = 'admin@uni.edu';

-- 3. Fix the default seeded teachers & students passwords (optional but recommended!)
UPDATE users 
SET password_hash = '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi' 
WHERE password_hash LIKE '$2a$10$p3Kmg8%';