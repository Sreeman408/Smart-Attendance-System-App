import { User, Student, Faculty, Subject, TimetableSlot, AttendanceRecord, LeaveRequest, AuditLog, ParentRecord, Department } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin1',
    name: 'Dr. M. Balasubramanian',
    email: 'admin@college.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    department: 'Department of Computer Science & Engineering',
    phone: '+91 94431 12345'
  },
  {
    id: 'usr_fac1',
    name: 'Dr. M. Balasubramanian',
    email: 'balasubramanian@annamalai.edu',
    role: 'faculty',
    facultyId: 'FAC_MB',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    department: 'Department of Computer Science & Engineering',
    phone: '+91 94431 12345'
  },
  {
    id: 'usr_fac2',
    name: 'Dr. K. Kavitha',
    email: 'kavitha@annamalai.edu',
    role: 'faculty',
    facultyId: 'FAC_KK',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    department: 'Department of Computer Science & Engineering',
    phone: '+91 94436 67890'
  },
  {
    id: 'usr_fac3',
    name: 'Dr. R. Saminathan',
    email: 'saminathan@annamalai.edu',
    role: 'faculty',
    facultyId: 'FAC_RS',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    department: 'Department of Computer Science & Engineering',
    phone: '+91 94433 34567'
  },
  {
    id: 'usr_stu1',
    name: 'Sreeman',
    email: 'sreeman@student.annamalai.edu',
    role: 'student',
    studentId: 'STU202401',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    department: 'Department of Computer Science & Engineering',
    phone: '+91 98765 43210'
  },
  {
    id: 'usr_stu2',
    name: 'Ananya Verma',
    email: 'ananya@student.annamalai.edu',
    role: 'student',
    studentId: 'STU202402',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    department: 'Department of Computer Science & Engineering',
    phone: '+91 98765 43211'
  },
  {
    id: 'usr_par1',
    name: 'Sundaram S',
    email: 'sundaram@parent.com',
    role: 'parent',
    parentId: 'PAR301',
    childStudentIds: ['STU202401'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '+91 98421 98765'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'STU202401',
    rollNo: '22CSE01',
    name: 'Sreeman',
    email: 'sreeman@student.annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    year: '3rd Year',
    semester: 5,
    section: 'B Batch',
    parentId: 'PAR301',
    parentName: 'Sundaram S',
    parentPhone: '+91 98421 98765',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    approvalStatus: 'approved'
  },
  {
    id: 'STU202402',
    rollNo: '22CSE02',
    name: 'Ananya Verma',
    email: 'ananya@student.annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    year: '3rd Year',
    semester: 5,
    section: 'B Batch',
    parentId: 'PAR301',
    parentName: 'Sundaram S',
    parentPhone: '+91 98421 98765',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    approvalStatus: 'approved'
  },
  {
    id: 'STU202403',
    rollNo: '22CSE03',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.edu',
    department: 'Department of Computer Science & Engineering',
    year: '3rd Year',
    semester: 5,
    section: 'B Batch',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    approvalStatus: 'approved'
  },
  {
    id: 'STU202404',
    rollNo: '22CSE04',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.edu',
    department: 'Department of Computer Science & Engineering',
    year: '3rd Year',
    semester: 5,
    section: 'B Batch',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    approvalStatus: 'approved'
  }
];

export const INITIAL_FACULTY: Faculty[] = [
  {
    id: 'FAC_MB',
    facultyCode: 'FAC-501',
    name: 'Dr. M. Balasubramanian',
    email: 'balasubramanian@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Professor & Head',
    phone: '+91 94431 12345',
    subjectsHandled: ['SUB501', 'SUB511'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_GA',
    facultyCode: 'FAC-502',
    name: 'Dr. G. Arulselvi',
    email: 'arulselvi@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Associate Professor',
    phone: '+91 94432 23456',
    subjectsHandled: ['SUB502'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_RS',
    facultyCode: 'FAC-503',
    name: 'Dr. R. Saminathan',
    email: 'saminathan@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Professor',
    phone: '+91 94433 34567',
    subjectsHandled: ['SUB503'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_RA',
    facultyCode: 'FAC-504',
    name: 'Dr. R. Arunkumar',
    email: 'arunkumar@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Associate Professor',
    phone: '+91 94434 45678',
    subjectsHandled: ['SUB504'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_AK',
    facultyCode: 'FAC-505',
    name: 'Dr. A. Kanthimathinathan',
    email: 'kanthimathinathan@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Assistant Professor',
    phone: '+91 94435 56789',
    subjectsHandled: ['SUB505'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_KK',
    facultyCode: 'FAC-506',
    name: 'Dr. K. Kavitha',
    email: 'kavitha@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Professor',
    phone: '+91 94436 67890',
    subjectsHandled: ['SUB506', 'SUB508', 'SUB510'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_AP',
    facultyCode: 'FAC-507',
    name: 'Dr. A. Punitha',
    email: 'punitha@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Associate Professor',
    phone: '+91 94437 78901',
    subjectsHandled: ['SUB507'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_ANS',
    facultyCode: 'FAC-508',
    name: 'Dr. AN. Sigappi',
    email: 'sigappi@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Professor',
    phone: '+91 94438 89012',
    subjectsHandled: ['SUB508'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_AS',
    facultyCode: 'FAC-509',
    name: 'Dr. A. Suhasini',
    email: 'suhasini@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Professor',
    phone: '+91 94439 90123',
    subjectsHandled: ['SUB509'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_TSS',
    facultyCode: 'FAC-510',
    name: 'Dr. T.S. Subashini',
    email: 'subashini@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Professor',
    phone: '+91 94440 01234',
    subjectsHandled: ['SUB509'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_BK',
    facultyCode: 'FAC-511',
    name: 'Dr. B. Kirubagari',
    email: 'kirubagari@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Assistant Professor',
    phone: '+91 94441 12345',
    subjectsHandled: ['SUB509'],
    approvalStatus: 'approved'
  },
  {
    id: 'FAC_CA',
    facultyCode: 'FAC-512',
    name: 'Dr. C. Anbuananth',
    email: 'anbuananth@annamalai.edu',
    department: 'Department of Computer Science & Engineering',
    designation: 'Associate Professor',
    phone: '+91 94442 23456',
    subjectsHandled: ['SUB510'],
    approvalStatus: 'approved'
  }
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'SUB501',
    code: '22CSPC501',
    name: 'Theory of Computation',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Lecture',
    credits: 4,
    facultyId: 'FAC_MB',
    facultyName: 'Dr. M. Balasubramanian'
  },
  {
    id: 'SUB502',
    code: '22CSPC502',
    name: 'Computer Graphics and Multimedia',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Lecture',
    credits: 4,
    facultyId: 'FAC_GA',
    facultyName: 'Dr. G. Arulselvi'
  },
  {
    id: 'SUB503',
    code: '22CSPC503',
    name: 'Computer Networks',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Lecture',
    credits: 4,
    facultyId: 'FAC_RS',
    facultyName: 'Dr. R. Saminathan'
  },
  {
    id: 'SUB504',
    code: '22CSPC504',
    name: 'Microprocessors',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Lecture',
    credits: 4,
    facultyId: 'FAC_RA',
    facultyName: 'Dr. R. Arunkumar'
  },
  {
    id: 'SUB505',
    code: '22CSPE505',
    name: 'Professional Elective I (Web Technology)',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Lecture',
    credits: 3,
    facultyId: 'FAC_AK',
    facultyName: 'Dr. A. Kanthimathinathan'
  },
  {
    id: 'SUB506',
    code: '22CSPE506',
    name: 'Professional Elective II (Mobile App Development)',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Lecture',
    credits: 3,
    facultyId: 'FAC_KK',
    facultyName: 'Dr. K. Kavitha'
  },
  {
    id: 'SUB507',
    code: '22CSOE507',
    name: 'Open Elective – I (Big Data Analytics)',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Lecture',
    credits: 3,
    facultyId: 'FAC_AP',
    facultyName: 'Dr. A. Punitha'
  },
  {
    id: 'SUB508',
    code: '22CSCP508',
    name: 'Computer Graphics & Multimedia Lab [Ground Floor Lab]',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Practical',
    credits: 2,
    facultyId: 'FAC_KK',
    facultyName: 'Dr. K. Kavitha (I/C), Dr. AN. Sigappi'
  },
  {
    id: 'SUB509',
    code: '22CSCP509',
    name: 'Computer Networks Lab [UG Lab 1/2]',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Practical',
    credits: 2,
    facultyId: 'FAC_AS',
    facultyName: 'Dr. A. Suhasini (I/C), Dr. T.S. Subashini, Dr. B. Kirubagari'
  },
  {
    id: 'SUB510',
    code: '22CSCP510',
    name: 'Microprocessors Lab [Annexure Lab]',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Practical',
    credits: 2,
    facultyId: 'FAC_CA',
    facultyName: 'Dr. C. Anbuananth (I/C), Dr. K. Kavitha'
  },
  {
    id: 'SUB511',
    code: '22ETIT511',
    name: 'Industrial Training / Rural Internship / Innovation',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    type: 'Practical',
    credits: 2,
    facultyId: 'FAC_MB',
    facultyName: 'Dr. M. Balasubramanian'
  }
];

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  // MONDAY
  {
    id: 'SLOT_MON_1',
    dayOfWeek: 'Monday',
    timeSlot: '08.30 AM - 09.30 AM',
    subjectId: 'SUB505',
    subjectName: 'Professional Elective I (Web Technology)',
    subjectCode: '22CSPE505',
    subjectType: 'Lecture',
    facultyId: 'FAC_AK',
    facultyName: 'Dr. A. Kanthimathinathan',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_MON_2',
    dayOfWeek: 'Monday',
    timeSlot: '09.30 AM - 10.30 AM',
    subjectId: 'SUB503',
    subjectName: 'Computer Networks',
    subjectCode: '22CSPC503',
    subjectType: 'Lecture',
    facultyId: 'FAC_RS',
    facultyName: 'Dr. R. Saminathan',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_MON_3',
    dayOfWeek: 'Monday',
    timeSlot: '10.40 AM - 11.40 AM',
    subjectId: 'SUB501',
    subjectName: 'Theory of Computation',
    subjectCode: '22CSPC501',
    subjectType: 'Lecture',
    facultyId: 'FAC_MB',
    facultyName: 'Dr. M. Balasubramanian',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_MON_4',
    dayOfWeek: 'Monday',
    timeSlot: '11.40 AM - 12.40 PM',
    subjectId: 'SUB507',
    subjectName: 'Open Elective – I (Big Data Analytics)',
    subjectCode: '22CSOE507',
    subjectType: 'Lecture',
    facultyId: 'FAC_AP',
    facultyName: 'Dr. A. Punitha',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_MON_5',
    dayOfWeek: 'Monday',
    timeSlot: '01.30 PM - 02.30 PM',
    subjectId: 'SUB506',
    subjectName: 'Professional Elective II (Mobile App Development)',
    subjectCode: '22CSPE506',
    subjectType: 'Lecture',
    facultyId: 'FAC_KK',
    facultyName: 'Dr. K. Kavitha',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_MON_6',
    dayOfWeek: 'Monday',
    timeSlot: '02.30 PM - 03.30 PM',
    subjectId: 'SUB502',
    subjectName: 'Computer Graphics and Multimedia',
    subjectCode: '22CSPC502',
    subjectType: 'Lecture',
    facultyId: 'FAC_GA',
    facultyName: 'Dr. G. Arulselvi',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },

  // TUESDAY
  {
    id: 'SLOT_TUE_1',
    dayOfWeek: 'Tuesday',
    timeSlot: '08.30 AM - 09.30 AM',
    subjectId: 'SUB502',
    subjectName: 'Computer Graphics and Multimedia',
    subjectCode: '22CSPC502',
    subjectType: 'Lecture',
    facultyId: 'FAC_GA',
    facultyName: 'Dr. G. Arulselvi',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_TUE_2',
    dayOfWeek: 'Tuesday',
    timeSlot: '09.30 AM - 10.30 AM',
    subjectId: 'SUB504',
    subjectName: 'Microprocessors',
    subjectCode: '22CSPC504',
    subjectType: 'Lecture',
    facultyId: 'FAC_RA',
    facultyName: 'Dr. R. Arunkumar',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_TUE_3',
    dayOfWeek: 'Tuesday',
    timeSlot: '10.40 AM - 11.40 AM',
    subjectId: 'SUB503',
    subjectName: 'Computer Networks',
    subjectCode: '22CSPC503',
    subjectType: 'Lecture',
    facultyId: 'FAC_RS',
    facultyName: 'Dr. R. Saminathan',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_TUE_4',
    dayOfWeek: 'Tuesday',
    timeSlot: '11.40 AM - 12.40 PM',
    subjectId: 'SUB506',
    subjectName: 'Professional Elective II (Mobile App Development)',
    subjectCode: '22CSPE506',
    subjectType: 'Lecture',
    facultyId: 'FAC_KK',
    facultyName: 'Dr. K. Kavitha',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_TUE_5',
    dayOfWeek: 'Tuesday',
    timeSlot: '01.30 PM - 04.30 PM',
    subjectId: 'SUB508',
    subjectName: 'Computer Graphics & Multimedia Lab [Ground Floor Lab]',
    subjectCode: '22CSCP508',
    subjectType: 'Practical',
    facultyId: 'FAC_KK',
    facultyName: 'Dr. K. Kavitha (I/C), Dr. AN. Sigappi',
    roomNo: 'Ground Floor Lab',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },

  // WEDNESDAY
  {
    id: 'SLOT_WED_1',
    dayOfWeek: 'Wednesday',
    timeSlot: '09.30 AM - 12.40 PM',
    subjectId: 'SUB510',
    subjectName: 'Microprocessors Lab [Annexure Lab]',
    subjectCode: '22CSCP510',
    subjectType: 'Practical',
    facultyId: 'FAC_CA',
    facultyName: 'Dr. C. Anbuananth (I/C), Dr. K. Kavitha',
    roomNo: 'Annexure Lab',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_WED_2',
    dayOfWeek: 'Wednesday',
    timeSlot: '01.30 PM - 02.30 PM',
    subjectId: 'SUB507',
    subjectName: 'Open Elective – I (Big Data Analytics)',
    subjectCode: '22CSOE507',
    subjectType: 'Lecture',
    facultyId: 'FAC_AP',
    facultyName: 'Dr. A. Punitha',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_WED_3',
    dayOfWeek: 'Wednesday',
    timeSlot: '02.30 PM - 03.30 PM',
    subjectId: 'SUB501',
    subjectName: 'Theory of Computation',
    subjectCode: '22CSPC501',
    subjectType: 'Lecture',
    facultyId: 'FAC_MB',
    facultyName: 'Dr. M. Balasubramanian',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_WED_4',
    dayOfWeek: 'Wednesday',
    timeSlot: '03.30 PM - 04.30 PM',
    subjectId: 'SUB504',
    subjectName: 'Microprocessors',
    subjectCode: '22CSPC504',
    subjectType: 'Lecture',
    facultyId: 'FAC_RA',
    facultyName: 'Dr. R. Arunkumar',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },

  // THURSDAY
  {
    id: 'SLOT_THU_1',
    dayOfWeek: 'Thursday',
    timeSlot: '08.30 AM - 09.30 AM',
    subjectId: 'SUB503',
    subjectName: 'Computer Networks',
    subjectCode: '22CSPC503',
    subjectType: 'Lecture',
    facultyId: 'FAC_RS',
    facultyName: 'Dr. R. Saminathan',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_THU_2',
    dayOfWeek: 'Thursday',
    timeSlot: '09.30 AM - 10.30 AM',
    subjectId: 'SUB506',
    subjectName: 'Professional Elective II (Mobile App Development)',
    subjectCode: '22CSPE506',
    subjectType: 'Lecture',
    facultyId: 'FAC_KK',
    facultyName: 'Dr. K. Kavitha',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_THU_3',
    dayOfWeek: 'Thursday',
    timeSlot: '10.40 AM - 11.40 AM',
    subjectId: 'SUB505',
    subjectName: 'Professional Elective I (Web Technology)',
    subjectCode: '22CSPE505',
    subjectType: 'Lecture',
    facultyId: 'FAC_AK',
    facultyName: 'Dr. A. Kanthimathinathan',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_THU_4',
    dayOfWeek: 'Thursday',
    timeSlot: '11.40 AM - 12.40 PM',
    subjectId: 'SUB504',
    subjectName: 'Microprocessors',
    subjectCode: '22CSPC504',
    subjectType: 'Lecture',
    facultyId: 'FAC_RA',
    facultyName: 'Dr. R. Arunkumar',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_THU_5',
    dayOfWeek: 'Thursday',
    timeSlot: '01.30 PM - 04.30 PM',
    subjectId: 'SUB511',
    subjectName: 'Industrial Training / Rural Internship / Innovation',
    subjectCode: '22ETIT511',
    subjectType: 'Practical',
    facultyId: 'FAC_MB',
    facultyName: 'Dr. M. Balasubramanian',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },

  // FRIDAY
  {
    id: 'SLOT_FRI_1',
    dayOfWeek: 'Friday',
    timeSlot: '08.30 AM - 09.30 AM',
    subjectId: 'SUB505',
    subjectName: 'Professional Elective I (Web Technology)',
    subjectCode: '22CSPE505',
    subjectType: 'Lecture',
    facultyId: 'FAC_AK',
    facultyName: 'Dr. A. Kanthimathinathan',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_FRI_2',
    dayOfWeek: 'Friday',
    timeSlot: '09.30 AM - 10.30 AM',
    subjectId: 'SUB501',
    subjectName: 'Theory of Computation',
    subjectCode: '22CSPC501',
    subjectType: 'Lecture',
    facultyId: 'FAC_MB',
    facultyName: 'Dr. M. Balasubramanian',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_FRI_3',
    dayOfWeek: 'Friday',
    timeSlot: '10.40 AM - 11.40 AM',
    subjectId: 'SUB507',
    subjectName: 'Open Elective – I (Big Data Analytics)',
    subjectCode: '22CSOE507',
    subjectType: 'Lecture',
    facultyId: 'FAC_AP',
    facultyName: 'Dr. A. Punitha',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_FRI_4',
    dayOfWeek: 'Friday',
    timeSlot: '11.40 AM - 12.40 PM',
    subjectId: 'SUB502',
    subjectName: 'Computer Graphics and Multimedia',
    subjectCode: '22CSPC502',
    subjectType: 'Lecture',
    facultyId: 'FAC_GA',
    facultyName: 'Dr. G. Arulselvi',
    roomNo: 'Hall - 2211',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
  },
  {
    id: 'SLOT_FRI_5',
    dayOfWeek: 'Friday',
    timeSlot: '01.30 PM - 04.30 PM',
    subjectId: 'SUB509',
    subjectName: 'Computer Networks Lab [UG Lab 1/2]',
    subjectCode: '22CSCP509',
    subjectType: 'Practical',
    facultyId: 'FAC_AS',
    facultyName: 'Dr. A. Suhasini (I/C), Dr. T.S. Subashini, Dr. B. Kirubagari',
    roomNo: 'UG Lab 1/2',
    department: 'Department of Computer Science & Engineering',
    semester: 5,
    section: 'B Batch'
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
      let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
      
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
    applicantName: 'Sreeman',
    applicantRole: 'student',
    studentId: 'STU202401',
    startDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    leaveType: 'Medical',
    reason: 'High fever and doctor recommended rest.',
    status: 'approved',
    appliedOn: new Date(Date.now() - 86400000 * 13).toISOString(),
    approvedBy: 'Dr. M. Balasubramanian',
    approvedOn: new Date(Date.now() - 86400000 * 12).toISOString(),
    remarks: 'Medical certificate submitted.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG1',
    timestamp: new Date().toISOString(),
    userId: 'usr_admin1',
    userName: 'Dr. M. Balasubramanian',
    userRole: 'admin',
    action: 'Annamalai University CSE V Sem Timetable Seeded',
    details: 'System initialized with official Annamalai University B.E CSE Semester V B Batch (Hall - 2211) timetable and faculty schedule.'
  }
];

export const INITIAL_PARENTS: ParentRecord[] = [
  {
    id: 'PAR301',
    name: 'Sundaram S',
    email: 'sundaram@parent.com',
    phone: '+91 98421 98765',
    childRollNo: '22CSE01',
    childName: 'Sreeman',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'DEP101',
    code: 'CSE',
    name: 'Department of Computer Science & Engineering',
    hodName: 'Dr. M. Balasubramanian'
  }
];
