import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'academia_supabase_credentials';

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseCredentials(): SupabaseCredentials {
  try {
    const data = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        isConfigured: Boolean(parsed.url && parsed.anonKey)
      };
    }
  } catch (e) {
    console.error('Error reading Supabase credentials:', e);
  }
  return { url: '', anonKey: '', isConfigured: false };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem(
    SUPABASE_CONFIG_KEY,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (!creds.isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(creds.url, creds.anonKey);
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export const SUPABASE_SQL_SCHEMA = `-- Academia - College Attendance Management System
-- Database Schema for Supabase / PostgreSQL

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  department VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  section VARCHAR(10),
  parent_id VARCHAR(50),
  parent_name VARCHAR(100),
  parent_phone VARCHAR(30),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
  id VARCHAR(50) PRIMARY KEY,
  faculty_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100),
  phone VARCHAR(30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subjects Table (Lecture & Practical weight)
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
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

-- 5. Attendance Records Table (Weighted calculation engine)
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
  notes TEXT
);

-- 6. Leave Requests Table
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

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT
);

-- Row Level Security (RLS) Enable
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated / public anon API keys
CREATE POLICY "Allow public select" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON attendance_records FOR INSERT WITH CHECK (true);
`;
