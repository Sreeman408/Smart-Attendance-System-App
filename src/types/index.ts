export type Role = 'admin' | 'faculty' | 'student' | 'parent';

export type SubjectType = 'Lecture' | 'Practical'; // Practical weight = 3 x Lecture weight

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'holiday';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  department?: string;
  // Specific role IDs
  studentId?: string; // e.g. "CS202401"
  facultyId?: string; // e.g. "FAC102"
  parentId?: string;  // e.g. "PAR301"
  childStudentIds?: string[]; // For parents with multiple children
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  avatar?: string;
}

export interface Faculty {
  id: string;
  facultyCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  subjectsHandled: string[]; // Subject IDs
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  type: SubjectType;
  credits: number;
  facultyId: string;
  facultyName?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlot: string; // e.g. "09:00 AM - 10:00 AM"
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectType: SubjectType;
  facultyId: string;
  facultyName: string;
  roomNo: string;
  department: string;
  semester: number;
  section: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName?: string;
  subjectId: string;
  subjectName: string;
  subjectType: SubjectType;
  status: AttendanceStatus;
  slotId?: string;
  markedByFacultyId: string;
  markedAt: string; // ISO String
  method: 'manual' | 'qr_code' | 'bulk';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: Role;
  studentId?: string;
  subjectId?: string; // Optional for subject-specific leave
  startDate: string;
  endDate: string;
  leaveType: 'Medical' | 'Personal' | 'On Duty / Event' | 'Other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  remarks?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface QRSession {
  id: string;
  token: string;
  subjectId: string;
  subjectName: string;
  subjectType: SubjectType;
  facultyId: string;
  facultyName: string;
  createdAt: string;
  expiresAt: string;
  roomNo: string;
  active: boolean;
}

export interface AttendanceSummary {
  totalConductedUnits: number;
  totalAttendedUnits: number;
  percentage: number;
  status: 'Safe' | 'Borderline' | 'Shortage';
  totalClassesConducted: number;
  totalClassesAttended: number;
  presentsCount: number;
  absentsCount: number;
  latesCount: number;
  excusedCount: number;
  streakDays: number;
}
