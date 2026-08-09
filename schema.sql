-- ============================================================
-- ANNAMALAI UNIVERSITY COLLEGE ATTENDANCE MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL DATABASE SCHEMA & POLICIES
-- ============================================================

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  department VARCHAR(100) NOT NULL,
  year VARCHAR(50) DEFAULT '2nd Year',
  semester INT NOT NULL DEFAULT 4,
  section VARCHAR(10) DEFAULT 'A',
  parent_id VARCHAR(50),
  parent_name VARCHAR(100),
  parent_phone VARCHAR(30),
  avatar TEXT,
  approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
  id VARCHAR(50) PRIMARY KEY,
  faculty_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) DEFAULT 'Assistant Professor',
  phone VARCHAR(30),
  approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subjects Table (Lecture & Practical weight separation)
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  semester INT NOT NULL DEFAULT 4,
  type VARCHAR(20) CHECK (type IN ('Lecture', 'Practical')),
  credits INT DEFAULT 3,
  faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
  id VARCHAR(50) PRIMARY KEY,
  day_of_week VARCHAR(20) NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id VARCHAR(50) REFERENCES faculty(id) ON DELETE CASCADE,
  room_no VARCHAR(30),
  department VARCHAR(100),
  semester INT,
  section VARCHAR(10)
);

-- 5. Saturday Class Configuration Table
CREATE TABLE IF NOT EXISTS saturday_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'sat_cfg_main',
  mapped_day VARCHAR(20) NOT NULL DEFAULT 'Monday',
  enabled BOOLEAN DEFAULT true,
  updated_by VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Attendance Records Table (Weighted calculation engine)
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(100) PRIMARY KEY,
  date DATE NOT NULL,
  student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
  subject_id VARCHAR(50) REFERENCES subjects(id) ON DELETE CASCADE,
  subject_type VARCHAR(20) CHECK (subject_type IN ('Lecture', 'Practical')),
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused', 'holiday')),
  slot_id VARCHAR(50),
  marked_by_faculty_id VARCHAR(50),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  method VARCHAR(20) DEFAULT 'manual',
  notes TEXT,
  is_saturday BOOLEAN DEFAULT false
);

-- 7. Registration Requests & Pending Approvals Table
CREATE TABLE IF NOT EXISTS registration_requests (
  id VARCHAR(50) PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty')),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  roll_no VARCHAR(50),
  faculty_code VARCHAR(50),
  department VARCHAR(100) NOT NULL,
  year VARCHAR(50),
  semester INT,
  section VARCHAR(10),
  designation VARCHAR(100),
  phone VARCHAR(30),
  parent_name VARCHAR(100),
  parent_phone VARCHAR(30),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified_email BOOLEAN DEFAULT true
);

-- 8. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(50) PRIMARY KEY,
  applicant_id VARCHAR(50) NOT NULL,
  applicant_name VARCHAR(100) NOT NULL,
  applicant_role VARCHAR(20) NOT NULL,
  student_id VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_by VARCHAR(100),
  approved_on TIMESTAMP WITH TIME ZONE,
  remarks TEXT
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE saturday_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Allow Public Access for Mobile App API Calls
CREATE POLICY "Allow public all students" ON students FOR ALL USING (true);
CREATE POLICY "Allow public all faculty" ON faculty FOR ALL USING (true);
CREATE POLICY "Allow public all subjects" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow public all timetable" ON timetable FOR ALL USING (true);
CREATE POLICY "Allow public all saturday_config" ON saturday_config FOR ALL USING (true);
CREATE POLICY "Allow public all attendance" ON attendance_records FOR ALL USING (true);
CREATE POLICY "Allow public all registrations" ON registration_requests FOR ALL USING (true);
CREATE POLICY "Allow public all leaves" ON leave_requests FOR ALL USING (true);
