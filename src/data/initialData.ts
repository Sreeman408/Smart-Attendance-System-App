import { User, Student, Faculty, Subject, TimetableSlot, AttendanceRecord, LeaveRequest, AuditLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin1',
    name: 'Dr. Arthur Vance',
    email: 'admin@college.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    department: 'Administration',
    phone: '+1 (555) 019-2834'
  },
  {
    id: 'usr_fac1',
    name: 'Prof. Robert Langdon',
    email: 'robert.langdon@college.edu',
    role: 'faculty',
    facultyId: 'FAC101',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    department: 'Computer Science',
    phone: '+1 (555) 234-5678'
  },
  {
    id: 'usr_fac2',
    name: 'Dr. Sarah Connor',
    email: 'sarah.connor@college.edu',
    role: 'faculty',
    facultyId: 'FAC102',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    department: 'Computer Science',
    phone: '+1 (555) 876-5432'
  },
  {
    id: 'usr_stu1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.edu',
    role: 'student',
    studentId: 'STU202401',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    department: 'Computer Science',
    phone: '+1 (555) 345-6789'
  },
  {
    id: 'usr_stu2',
    name: 'Priya Sharma',
    email: 'priya.sharma@student.edu',
    role: 'student',
    studentId: 'STU202402',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    department: 'Computer Science',
    phone: '+1 (555) 456-7890'
  },
  {
    id: 'usr_par1',
    name: 'Vikram Sharma',
    email: 'vikram.sharma@parent.com',
    role: 'parent',
    parentId: 'PAR301',
    childStudentIds: ['STU202401', 'STU202402'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '+1 (555) 987-6543'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'STU202401',
    rollNo: '24CS01',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.edu',
    department: 'Computer Science',
    semester: 4,
    section: 'A',
    parentId: 'PAR301',
    parentName: 'Vikram Sharma',
    parentPhone: '+1 (555) 987-6543',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
  },
  {
    id: 'STU202402',
    rollNo: '24CS02',
    name: 'Priya Sharma',
    email: 'priya.sharma@student.edu',
    department: 'Computer Science',
    semester: 2,
    section: 'B',
    parentId: 'PAR301',
    parentName: 'Vikram Sharma',
    parentPhone: '+1 (555) 987-6543',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  {
    id: 'STU202403',
    rollNo: '24CS03',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.edu',
    department: 'Computer Science',
    semester: 4,
    section: 'A',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  {
    id: 'STU202404',
    rollNo: '24CS04',
    name: 'Ananya Verma',
    email: 'ananya.verma@student.edu',
    department: 'Computer Science',
    semester: 4,
    section: 'A',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
  }
];

export const INITIAL_FACULTY: Faculty[] = [
  {
    id: 'FAC101',
    facultyCode: 'CS-FAC-01',
    name: 'Prof. Robert Langdon',
    email: 'robert.langdon@college.edu',
    department: 'Computer Science',
    designation: 'Associate Professor',
    phone: '+1 (555) 234-5678',
    subjectsHandled: ['SUB101', 'SUB103']
  },
  {
    id: 'FAC102',
    facultyCode: 'CS-FAC-02',
    name: 'Dr. Sarah Connor',
    email: 'sarah.connor@college.edu',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '+1 (555) 876-5432',
    subjectsHandled: ['SUB102', 'SUB104']
  }
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'SUB101',
    code: 'CS401',
    name: 'Data Structures & Algorithms',
    department: 'Computer Science',
    semester: 4,
    type: 'Lecture',
    credits: 4,
    facultyId: 'FAC101',
    facultyName: 'Prof. Robert Langdon'
  },
  {
    id: 'SUB102',
    code: 'CS402',
    name: 'Database Management Systems',
    department: 'Computer Science',
    semester: 4,
    type: 'Lecture',
    credits: 4,
    facultyId: 'FAC102',
    facultyName: 'Dr. Sarah Connor'
  },
  {
    id: 'SUB103',
    code: 'CS401P',
    name: 'DSA Lab & Practicals',
    department: 'Computer Science',
    semester: 4,
    type: 'Practical',
    credits: 2,
    facultyId: 'FAC101',
    facultyName: 'Prof. Robert Langdon'
  },
  {
    id: 'SUB104',
    code: 'CS402P',
    name: 'DBMS Lab & Practicals',
    department: 'Computer Science',
    semester: 4,
    type: 'Practical',
    credits: 2,
    facultyId: 'FAC102',
    facultyName: 'Dr. Sarah Connor'
  }
];

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  {
    id: 'SLOT1',
    dayOfWeek: 'Monday',
    timeSlot: '09:00 AM - 10:00 AM',
    subjectId: 'SUB101',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CS401',
    subjectType: 'Lecture',
    facultyId: 'FAC101',
    facultyName: 'Prof. Robert Langdon',
    roomNo: 'LH-201',
    department: 'Computer Science',
    semester: 4,
    section: 'A'
  },
  {
    id: 'SLOT2',
    dayOfWeek: 'Monday',
    timeSlot: '10:15 AM - 11:15 AM',
    subjectId: 'SUB102',
    subjectName: 'Database Management Systems',
    subjectCode: 'CS402',
    subjectType: 'Lecture',
    facultyId: 'FAC102',
    facultyName: 'Dr. Sarah Connor',
    roomNo: 'LH-201',
    department: 'Computer Science',
    semester: 4,
    section: 'A'
  },
  {
    id: 'SLOT3',
    dayOfWeek: 'Tuesday',
    timeSlot: '02:00 PM - 05:00 PM',
    subjectId: 'SUB103',
    subjectName: 'DSA Lab & Practicals',
    subjectCode: 'CS401P',
    subjectType: 'Practical',
    facultyId: 'FAC101',
    facultyName: 'Prof. Robert Langdon',
    roomNo: 'CS-LAB-3',
    department: 'Computer Science',
    semester: 4,
    section: 'A'
  },
  {
    id: 'SLOT4',
    dayOfWeek: 'Wednesday',
    timeSlot: '09:00 AM - 10:00 AM',
    subjectId: 'SUB101',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CS401',
    subjectType: 'Lecture',
    facultyId: 'FAC101',
    facultyName: 'Prof. Robert Langdon',
    roomNo: 'LH-201',
    department: 'Computer Science',
    semester: 4,
    section: 'A'
  },
  {
    id: 'SLOT5',
    dayOfWeek: 'Thursday',
    timeSlot: '02:00 PM - 05:00 PM',
    subjectId: 'SUB104',
    subjectName: 'DBMS Lab & Practicals',
    subjectCode: 'CS402P',
    subjectType: 'Practical',
    facultyId: 'FAC102',
    facultyName: 'Dr. Sarah Connor',
    roomNo: 'CS-LAB-1',
    department: 'Computer Science',
    semester: 4,
    section: 'A'
  },
  {
    id: 'SLOT6',
    dayOfWeek: 'Friday',
    timeSlot: '11:30 AM - 12:30 PM',
    subjectId: 'SUB102',
    subjectName: 'Database Management Systems',
    subjectCode: 'CS402',
    subjectType: 'Lecture',
    facultyId: 'FAC102',
    facultyName: 'Dr. Sarah Connor',
    roomNo: 'LH-201',
    department: 'Computer Science',
    semester: 4,
    section: 'A'
  }
];

// Helper function to generate past attendance records for calendar rendering
export function generateSeedAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  // Create records for past 25 days
  for (let i = 25; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;

    // Daily subjects based on day of week
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const daySlots = INITIAL_TIMETABLE.filter(t => t.dayOfWeek === dayName);

    daySlots.forEach(slot => {
      // Deterministic pseudo-random status for Rahul Sharma (STU202401)
      let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
      
      // Make a few days absent/late to show realistic stats
      if ((i % 7 === 1) && slot.subjectType === 'Lecture') {
        status = 'absent';
      } else if (i % 9 === 0) {
        status = 'late';
      } else if (i === 12) {
        status = 'excused';
      }

      if (isToday) status = 'present';

      records.push({
        id: `att_${dateStr}_${slot.id}_STU202401`,
        date: dateStr,
        studentId: 'STU202401',
        subjectId: slot.subjectId,
        subjectName: slot.subjectName,
        subjectType: slot.subjectType,
        status,
        slotId: slot.id,
        markedByFacultyId: slot.facultyId,
        markedAt: new Date(d.getTime() + 9 * 3600000).toISOString(),
        method: isToday ? 'qr_code' : 'manual'
      });

      // Also create records for Priya Sharma (STU202402)
      records.push({
        id: `att_${dateStr}_${slot.id}_STU202402`,
        date: dateStr,
        studentId: 'STU202402',
        subjectId: slot.subjectId,
        subjectName: slot.subjectName,
        subjectType: slot.subjectType,
        status: i % 5 === 0 ? 'absent' : 'present',
        slotId: slot.id,
        markedByFacultyId: slot.facultyId,
        markedAt: new Date(d.getTime() + 9 * 3600000).toISOString(),
        method: 'manual'
      });
    });
  }

  return records;
}

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'LV101',
    applicantId: 'usr_stu1',
    applicantName: 'Rahul Sharma',
    applicantRole: 'student',
    studentId: 'STU202401',
    startDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    leaveType: 'Medical',
    reason: 'High fever and doctor recommended rest.',
    status: 'approved',
    appliedOn: new Date(Date.now() - 86400000 * 13).toISOString(),
    approvedBy: 'Dr. Arthur Vance',
    approvedOn: new Date(Date.now() - 86400000 * 12).toISOString(),
    remarks: 'Medical certificate submitted.'
  },
  {
    id: 'LV102',
    applicantId: 'usr_stu1',
    applicantName: 'Rahul Sharma',
    applicantRole: 'student',
    studentId: 'STU202401',
    startDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    leaveType: 'On Duty / Event',
    reason: 'Representing college in Inter-University Tech Hackathon.',
    status: 'pending',
    appliedOn: new Date().toISOString()
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG1',
    timestamp: new Date().toISOString(),
    userId: 'usr_admin1',
    userName: 'Dr. Arthur Vance',
    userRole: 'admin',
    action: 'System Initialized',
    details: 'Initial database seed loaded successfully with multi-role configurations.'
  },
  {
    id: 'LOG2',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: 'usr_fac1',
    userName: 'Prof. Robert Langdon',
    userRole: 'faculty',
    action: 'QR Session Created',
    details: 'Generated live 5-min QR attendance session for Data Structures & Algorithms (LH-201)'
  },
  {
    id: 'LOG3',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    userId: 'usr_stu1',
    userName: 'Rahul Sharma',
    userRole: 'student',
    action: 'QR Attendance Logged',
    details: 'Scanned QR code and logged Present for CS401'
  }
];
