# Smart Attendance Management System
CREATE DATABASE atendance;
USE attendance;

# 1) ADMINS
CREATE TABLE admins (
    admin_id      INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 2) TEACHERS
CREATE TABLE teachers (
    teacher_id    INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    department    VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 3) STUDENTS
CREATE TABLE students (
    student_id    INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    roll_number   VARCHAR(20)  NOT NULL UNIQUE,
    section       VARCHAR(10)  NOT NULL,
    semester      INT          NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 4 COURSES
CREATE TABLE courses (
    course_id    INT AUTO_INCREMENT PRIMARY KEY,
    course_name  VARCHAR(100) NOT NULL,
    credit_hours INT          NOT NULL,
    teacher_id   INT          NOT NULL,
    CONSTRAINT fk_course_teacher
        FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

# 5) ENROLLMENTS
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id    INT NOT NULL,
    course_id     INT NOT NULL,
    CONSTRAINT fk_enroll_student
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_enroll_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_enrollment
        UNIQUE (student_id, course_id)
);

# 6) TIMETABLE
CREATE TABLE timetable (
    slot_id       INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT  NOT NULL,
    day_of_week   ENUM('Mon','Tue','Wed','Thu','Fri') NOT NULL,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    room_location VARCHAR(100) NOT NULL,
    latitude      DECIMAL(9,6) NOT NULL,
    longitude     DECIMAL(9,6) NOT NULL,
    CONSTRAINT fk_timetable_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

# 7) ATTENDANCE
CREATE TABLE attendance (
    attendance_id     INT AUTO_INCREMENT PRIMARY KEY,
    student_id        INT  NOT NULL,
    slot_id           INT  NOT NULL,
    course_id         INT  NOT NULL,
    class_date        DATE NOT NULL,
    marked_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status            ENUM('Present','Absent') NOT NULL,
    latitude_marked   DECIMAL(9,6) NOT NULL,
    longitude_marked  DECIMAL(9,6) NOT NULL,
    is_location_valid BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_att_student
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_att_slot
        FOREIGN KEY (slot_id) REFERENCES timetable(slot_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_att_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_attendance
        UNIQUE (student_id, slot_id, class_date)
);
