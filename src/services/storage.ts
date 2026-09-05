import {
  User, Student, Faculty, Subject, TimetableSlot, AttendanceRecord,
  LeaveRequest, AuditLog, QRSession
} from '../types';
import {
  INITIAL_USERS, INITIAL_STUDENTS, INITIAL_FACULTY, INITIAL_SUBJECTS,
  INITIAL_TIMETABLE, generateSeedAttendance, INITIAL_LEAVES, INITIAL_AUDIT_LOGS
} from '../data/initialData';

const KEYS = {
  USERS: 'academia_users',
  STUDENTS: 'academia_students',
  FACULTY: 'academia_faculty',
  SUBJECTS: 'academia_subjects',
  TIMETABLE: 'academia_timetable',
  ATTENDANCE: 'academia_attendance',
  LEAVES: 'academia_leaves',
  LOGS: 'academia_logs',
  CURRENT_USER: 'academia_current_user',
  THEME: 'academia_theme',
  SUPABASE_CONFIG: 'academia_supabase_config'
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(fn => fn());
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

// Initialize seed data if empty
export function initLocalStorage(): void {
  // Do not seed demo users, students, or faculty.
  // Do not auto-login as Admin on startup.
}

// User & Auth operations
export function getCurrentUser(): User | null {
  return getItem<User | null>(KEYS.CURRENT_USER, null as any);
}

export function setCurrentUser(user: User): void {
  setItem(KEYS.CURRENT_USER, user);
}

export function getAllUsers(): User[] {
  return getItem<User[]>(KEYS.USERS, INITIAL_USERS);
}

// Data getters
export function getStudents(): Student[] {
  return getItem<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
}

export function saveStudents(students: Student[]): void {
  setItem(KEYS.STUDENTS, students);
}

export function getFaculty(): Faculty[] {
  return getItem<Faculty[]>(KEYS.FACULTY, INITIAL_FACULTY);
}

export function saveFaculty(faculty: Faculty[]): void {
  setItem(KEYS.FACULTY, faculty);
}

export function getSubjects(): Subject[] {
  return getItem<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS);
}

export function saveSubjects(subjects: Subject[]): void {
  setItem(KEYS.SUBJECTS, subjects);
}

export function getTimetable(): TimetableSlot[] {
  return getItem<TimetableSlot[]>(KEYS.TIMETABLE, INITIAL_TIMETABLE);
}

export function saveTimetable(slots: TimetableSlot[]): void {
  setItem(KEYS.TIMETABLE, slots);
}

export function getAttendanceRecords(): AttendanceRecord[] {
  return getItem<AttendanceRecord[]>(KEYS.ATTENDANCE, []);
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  setItem(KEYS.ATTENDANCE, records);
}

export function addAttendanceRecord(record: AttendanceRecord): void {
  const records = getAttendanceRecords();
  // Replace existing record if same date, student, subject
  const existingIdx = records.findIndex(
    r => r.date === record.date && r.studentId === record.studentId && r.subjectId === record.subjectId
  );
  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    records.unshift(record);
  }
  saveAttendanceRecords(records);
}

export function getLeaves(): LeaveRequest[] {
  return getItem<LeaveRequest[]>(KEYS.LEAVES, INITIAL_LEAVES);
}

export function saveLeaves(leaves: LeaveRequest[]): void {
  setItem(KEYS.LEAVES, leaves);
}

export function addLeave(leave: LeaveRequest): void {
  const leaves = getLeaves();
  leaves.unshift(leave);
  saveLeaves(leaves);
}

export function updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', approvedBy: string, remarks?: string): void {
  const leaves = getLeaves();
  const index = leaves.findIndex(l => l.id === leaveId);
  if (index >= 0) {
    leaves[index].status = status;
    leaves[index].approvedBy = approvedBy;
    leaves[index].approvedOn = new Date().toISOString();
    if (remarks) leaves[index].remarks = remarks;
    saveLeaves(leaves);
  }
}

export function getAuditLogs(): AuditLog[] {
  return getItem<AuditLog[]>(KEYS.LOGS, INITIAL_AUDIT_LOGS);
}

export function logAuditAction(user: User | null, action: string, details: string): void {
  const logs = getAuditLogs();
  logs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: user?.id || 'sys',
    userName: user?.name || 'System User',
    userRole: user?.role || 'student',
    action,
    details
  });
  setItem(KEYS.LOGS, logs.slice(0, 100)); // keep last 100
}

// Active QR Sessions in-memory store
let activeQRSession: QRSession | null = null;

export function setQRSession(session: QRSession | null) {
  activeQRSession = session;
  notifyListeners();
}

export function getQRSession(): QRSession | null {
  if (activeQRSession && new Date(activeQRSession.expiresAt) < new Date()) {
    activeQRSession = null;
  }
  return activeQRSession;
}

// Reset data back to default initial seed
export function resetSystemData(): void {
  localStorage.clear();
  initLocalStorage();
  notifyListeners();
}
