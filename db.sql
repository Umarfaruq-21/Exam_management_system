-- ============================================
-- Database: exam_planning
-- ============================================

CREATE DATABASE IF NOT EXISTS exam_planning;
USE exam_planning;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  usn VARCHAR(20) UNIQUE,           -- for students
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') NOT NULL,
  branch ENUM('CSE','ISE','ECE','EEE','CIVIL','MECH','AI'), -- student branch
  semester INT CHECK (semester BETWEEN 1 AND 8)             -- 1-8 semester
);

-- ============================================
-- Table: courses
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  branch ENUM('CSE','ISE','ECE','EEE','CIVIL','MECH','AI') NOT NULL,
  semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8)   -- course semester
);

-- ============================================
-- Table: exams
-- ============================================
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ============================================
-- Table: rooms
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  capacity INT NOT NULL
);

-- ============================================
-- Table: seat_assignments
-- ============================================
CREATE TABLE IF NOT EXISTS seat_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  room_id INT NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  student_id INT NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_seat_per_exam_room (exam_id, room_id, seat_number)
);

-- ============================================
-- Table: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
