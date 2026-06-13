-- =========================================================================
-- MySQL DDL Migration Script
-- Database: smart_attendance
-- Compatible with: MySQL 8.0+ / MySQL Workbench
-- =========================================================================

-- Create and select the database
CREATE DATABASE IF NOT EXISTS smart_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_attendance;

-- Drop tables in dependency order (children first)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS timetable;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- ── 1. USERS TABLE ────────────────────────────────────────────────────────────
-- Unified table for students, teachers, and admins.
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('student', 'teacher', 'admin') NOT NULL,

    -- Student-specific fields (nullable for teachers/admins)
    roll_number   VARCHAR(30) DEFAULT NULL UNIQUE,
    section       VARCHAR(10) DEFAULT NULL,
    semester      INT         DEFAULT NULL,

    -- Teacher-specific fields (nullable for students/admins)
    department    VARCHAR(100) DEFAULT NULL,

    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for lookup speed during authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ── 2. COURSES TABLE ──────────────────────────────────────────────────────────
CREATE TABLE courses (
    course_id    INT AUTO_INCREMENT PRIMARY KEY,
    course_name  VARCHAR(100) NOT NULL,
    credit_hours INT NOT NULL CHECK (credit_hours > 0),
    teacher_id   INT NOT NULL,
    department   VARCHAR(100) DEFAULT NULL,
    semester     INT DEFAULT NULL,
    section      VARCHAR(10) DEFAULT NULL,

    CONSTRAINT fk_course_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2b. COURSE TEACHERS TABLE (Many-to-Many: co-teachers → courses) ─────────────
CREATE TABLE course_teachers (
    course_id  INT NOT NULL,
    teacher_id INT NOT NULL,
    PRIMARY KEY (course_id, teacher_id),
    CONSTRAINT fk_course_teachers_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_course_teachers_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 3. ENROLLMENTS TABLE (Many-to-Many: students → courses) ──────────────────
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

-- ── 4. TIMETABLE TABLE ────────────────────────────────────────────────────────
-- Stores schedules + geofence coordinates (classroom latitude/longitude)
CREATE TABLE timetable (
    slot_id       INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT NOT NULL,
    teacher_id    INT NOT NULL,
    day_of_week   ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    room_location VARCHAR(100) NOT NULL,
    latitude      DECIMAL(9, 6) NOT NULL,
    longitude     DECIMAL(9, 6) NOT NULL,

    CONSTRAINT fk_timetable_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_timetable_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_timetable_course   ON timetable(course_id);
CREATE INDEX idx_timetable_teacher  ON timetable(teacher_id);

-- ── 5. ATTENDANCE TABLE ───────────────────────────────────────────────────────
-- Stores logged records verified against geofence radius.
CREATE TABLE attendance (
    attendance_id     INT AUTO_INCREMENT PRIMARY KEY,
    student_id        INT NOT NULL,
    slot_id           INT NOT NULL,
    course_id         INT NOT NULL,
    latitude_marked   DECIMAL(9, 6) NOT NULL,
    longitude_marked  DECIMAL(9, 6) NOT NULL,
    is_location_valid TINYINT(1) NOT NULL DEFAULT 0,
    status            ENUM('Present', 'Absent') NOT NULL,
    marked_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    class_date        DATE NOT NULL DEFAULT (CURDATE()),

    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_slot
        FOREIGN KEY (slot_id) REFERENCES timetable(slot_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_student_slot_date UNIQUE (student_id, slot_id, class_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_slot    ON attendance(slot_id);
CREATE INDEX idx_attendance_course  ON attendance(course_id);
CREATE INDEX idx_attendance_date    ON attendance(class_date);

-- ── 6. DEPARTMENTS TABLE ──────────────────────────────────────────────────────
-- Stores available departments for registration dropdown
CREATE TABLE departments (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- SEED DATA FOR QUICK START / INITIAL LAUNCH
-- Password for all seed accounts: "password"
-- Hash: $2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi
-- =========================================================================

-- Insert Departments
INSERT INTO departments (department_name) VALUES
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

-- Insert Admin
INSERT INTO users (full_name, email, password_hash, role)
VALUES ('System Admin', 'admin@uni.edu', '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'admin');

-- Insert Teachers
INSERT INTO users (full_name, email, password_hash, role, department)
VALUES 
('Dr. Sarah Ahmed',  'sarah.ahmed@uni.edu',  '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'teacher', 'Computer Science'),
('Prof. Usman Malik', 'usman.malik@uni.edu', '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'teacher', 'Computer Science');

-- Insert Students
INSERT INTO users (full_name, email, password_hash, role, roll_number, section, semester)
VALUES 
('Alex Johnson', 'alex.johnson@uni.edu', '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'student', '2021-CS-042', 'A', 5),
('Sara Khan',    'sara.khan@uni.edu',    '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'student', '2021-CS-017', 'A', 5),
('Bilal Raza',   'bilal.raza@uni.edu',   '$2a$10$XSEUAPwU9CJuE5z0aML1nOivSNRzBqpIxP4RCDa7l8hny8OEdGIVi', 'student', '2021-CS-089', 'B', 5);

-- Insert Courses (teacher_id 2 = Dr. Sarah Ahmed, teacher_id 3 = Prof. Usman Malik)
INSERT INTO courses (course_name, credit_hours, teacher_id)
VALUES 
('Data Structures & Algorithms', 3, 2),
('Operating Systems',            3, 3),
('Database Systems',             3, 2);

-- Insert Enrollments
-- user id 4 = Alex, 5 = Sara, 6 = Bilal
INSERT INTO enrollments (student_id, course_id)
VALUES 
(4, 1), -- Alex  -> DSA
(5, 1), -- Sara  -> DSA
(4, 2); -- Alex  -> OS

-- Insert Timetable Slots
INSERT INTO timetable (course_id, teacher_id, day_of_week, start_time, end_time, room_location, latitude, longitude)
VALUES 
(1, 2, 'Mon', '08:00:00', '09:30:00', 'CS Lab 1',  33.738045, 72.814522),
(2, 3, 'Tue', '10:00:00', '11:30:00', 'Room 204',  33.738120, 72.814780);
