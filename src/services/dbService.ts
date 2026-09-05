import { getSupabaseClient } from './supabaseClient';
import {
  Student, Faculty, Subject, TimetableSlot, AttendanceRecord,
  LeaveRequest, AuditLog, SaturdayConfig, RegistrationRequest, ApprovalStatus,
  ParentRecord, Department
} from '../types';

export interface DeleteResult {
  success: boolean;
  message: string;
}
import {
  INITIAL_STUDENTS, INITIAL_FACULTY, INITIAL_SUBJECTS,
  INITIAL_TIMETABLE, generateSeedAttendance, INITIAL_LEAVES, INITIAL_AUDIT_LOGS,
  INITIAL_PARENTS, INITIAL_DEPARTMENTS
} from '../data/initialData';
import { Preferences } from '@capacitor/preferences';
import { compareRollNumbers } from '../utils/sortingUtils';

// Cache keys for Capacitor Preferences
const PREF_KEYS = {
  STUDENTS: 'au_cms_clean_v10_students',
  FACULTY: 'au_cms_clean_v10_faculty',
  SUBJECTS: 'au_cms_clean_v10_subjects',
  TIMETABLE: 'au_cms_clean_v10_timetable',
  ATTENDANCE: 'au_cms_clean_v10_attendance',
  LEAVES: 'au_cms_clean_v10_leaves',
  LOGS: 'au_cms_clean_v10_logs',
  SATURDAY_CONFIG: 'au_cms_clean_v10_saturday_config',
  REGISTRATIONS: 'au_cms_clean_v10_registrations',
  PARENTS: 'au_cms_clean_v10_parents',
  DEPARTMENTS: 'au_cms_clean_v10_departments'
};

// Helper for robust native Preferences & Web localStorage dual-caching
async function getCachedData<T>(key: string, fallback: T): Promise<T> {
  try {
    const res = await Preferences.get({ key });
    if (res && res.value) {
      return JSON.parse(res.value) as T;
    }
  } catch (e) {
    console.warn(`Preferences read failed for ${key}:`, e);
  }
  try {
    const localVal = localStorage.getItem(key);
    if (localVal) {
      return JSON.parse(localVal) as T;
    }
  } catch (e) {
    // Ignore localStorage error
  }
  return fallback;
}

async function setCachedData<T>(key: string, data: T): Promise<void> {
  const jsonStr = JSON.stringify(data);
  try {
    await Preferences.set({ key, value: jsonStr });
  } catch (e) {
    console.warn(`Preferences write failed for ${key}:`, e);
  }
  try {
    localStorage.setItem(key, jsonStr);
  } catch (e) {
    console.warn(`localStorage write failed for ${key}:`, e);
  }
}



// -------------------------------------------------------------
// UNIVERSAL MULTI-DEVICE SUPABASE CLOUD SYNC ENGINE
// -------------------------------------------------------------
export async function saveCloudRecord<T extends { id: string }>(entityType: string, record: T): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  let cloudSuccess = false;

  // 1. Write to native Supabase table if it exists
  try {
    const { error } = await supabase.from(entityType).upsert(record as any);
    if (!error) cloudSuccess = true;
  } catch (e) {
    // Native table might not exist
  }

  // 2. Dual-write to audit_logs table (guaranteed cloud store)
  try {
    const syncPayload = {
      id: `SYNC_${entityType}_${record.id}`,
      timestamp: new Date().toISOString(),
      user_id: record.id,
      user_name: (record as any).name || (record as any).code || record.id,
      role: (record as any).role || entityType,
      action: `CLOUD_SYNC::${entityType}`,
      details: JSON.stringify(record)
    };
    const { error: syncErr } = await supabase.from('audit_logs').upsert(syncPayload);
    if (!syncErr) {
      cloudSuccess = true;
    }
  } catch (e) {
    console.warn(`Supabase audit_logs sync error for ${entityType}:`, e);
  }

  return cloudSuccess;
}

export async function deleteCloudRecord(entityType: string, id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    await supabase.from(entityType).delete().eq('id', id);
  } catch (e) {
    // ignore
  }

  try {
    await supabase.from('audit_logs').delete().eq('id', `SYNC_${entityType}_${id}`);
  } catch (e) {
    // ignore
  }

  return true;
}

export async function fetchCloudRecords<T>(entityType: string): Promise<T[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const recordsMap = new Map<string, T>();

  // 1. Try native Supabase table first
  try {
    const { data, error } = await supabase.from(entityType).select('*');
    if (!error && data && Array.isArray(data)) {
      for (const d of data) {
        if (d && d.id) {
          recordsMap.set(d.id, d as T);
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Try universal cloud sync store in audit_logs
  try {
    const { data: syncData, error: syncError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', `CLOUD_SYNC::${entityType}`)
      .order('timestamp', { ascending: false });

    if (!syncError && syncData && Array.isArray(syncData)) {
      for (const row of syncData) {
        try {
          if (row.details) {
            const parsed = JSON.parse(row.details) as T & { id: string };
            if (parsed && parsed.id) {
              const existing = recordsMap.get(parsed.id);
              if (!existing) {
                recordsMap.set(parsed.id, parsed);
              } else {
                recordsMap.set(parsed.id, { ...existing, ...parsed });
              }
            }
          }
        } catch (e) {
          // ignore JSON parse error
        }
      }
    }
  } catch (e) {
    console.warn(`Cloud fetch error for ${entityType}:`, e);
  }

  return Array.from(recordsMap.values());
}

// -------------------------------------------------------------
// 1. STUDENTS SERVICE
// -------------------------------------------------------------
export async function fetchStudentsFromDB(): Promise<Student[]> {
  const cloudData = await fetchCloudRecords<any>('students');
  const studentMap = new Map<string, Student>();

  if (cloudData !== null) {
    for (const d of cloudData) {
      const roll = (d.roll_no || d.rollNo || d.id || '').trim();
      studentMap.set(roll || d.id, {
        id: d.id,
        rollNo: roll,
        name: d.name,
        email: d.email,
        department: d.department || 'Department of Computer Science & Engineering',
        year: d.year || '3rd Year',
        semester: d.semester || 5,
        section: d.section || 'B',
        parentId: d.parent_id || d.parentId,
        parentName: d.parent_name || d.parentName,
        parentPhone: d.parent_phone || d.parentPhone,
        avatar: d.avatar,
        approvalStatus: d.approval_status || d.approvalStatus || 'approved',
        passwordHash: d.password_hash || d.passwordHash
      });
    }
  }

  // Also query native users table in Supabase where role = 'student'
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: userStudents, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student');
      if (!error && Array.isArray(userStudents)) {
        for (const u of userStudents) {
          const roll = (u.roll || u.login_id || u.id || '').trim();
          if (!studentMap.has(roll)) {
            studentMap.set(roll, {
              id: u.id,
              rollNo: roll,
              name: u.name,
              email: u.email || `${roll}@college.edu`,
              department: u.dept_id === 'cse' ? 'Department of Computer Science & Engineering' : (u.dept_id || 'Department of Computer Science & Engineering'),
              year: '3rd Year',
              semester: 5,
              section: 'B',
              approvalStatus: 'approved',
              passwordHash: u.password_hash
            });
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  let resultList = Array.from(studentMap.values());
  if (cloudData === null && resultList.length === 0) {
    resultList = await getCachedData<Student[]>(PREF_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  // Natural numeric sorting by roll number
  resultList.sort((a, b) => compareRollNumbers(a.rollNo, b.rollNo));
  await setCachedData(PREF_KEYS.STUDENTS, resultList);
  return resultList;
}

export async function saveStudentToDB(student: Student): Promise<boolean> {
  const cloudOk = await saveCloudRecord('students', {
    id: student.id,
    roll_no: student.rollNo,
    rollNo: student.rollNo,
    name: student.name,
    email: student.email,
    department: student.department,
    year: student.year,
    semester: student.semester,
    section: student.section,
    parent_id: student.parentId || null,
    parentId: student.parentId || null,
    parent_name: student.parentName || null,
    parentName: student.parentName || null,
    parent_phone: student.parentPhone || null,
    parentPhone: student.parentPhone || null,
    avatar: student.avatar || null,
    approval_status: student.approvalStatus,
    approvalStatus: student.approvalStatus,
    password_hash: student.passwordHash || null,
    passwordHash: student.passwordHash || null
  });

  // Dual-write to native users table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('users').upsert({
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'student',
        dept_id: 'cse',
        roll: student.rollNo,
        login_id: student.rollNo,
        password_hash: student.passwordHash || 'student123'
      });
    } catch (e) {}
  }

  const cached = await getCachedData<Student[]>(PREF_KEYS.STUDENTS, []);
  const idx = cached.findIndex(s => s.id === student.id);
  if (idx >= 0) cached[idx] = student;
  else cached.unshift(student);
  await setCachedData(PREF_KEYS.STUDENTS, cached);

  return cloudOk;
}

export async function deleteStudentFromDB(idOrRoll: string): Promise<DeleteResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase cloud database is unreachable. Cannot delete.' };
  }

  try {
    const cached = await getCachedData<Student[]>(PREF_KEYS.STUDENTS, []);
    const student = cached.find(s => s.id === idOrRoll || s.rollNo === idOrRoll);
    const targetId = student?.id || idOrRoll;
    const targetRoll = student?.rollNo || idOrRoll;
    const displayName = student ? `${student.name} (${student.rollNo})` : idOrRoll;

    // 1. Delete from native users table (role = 'student')
    const { error: errUser } = await supabase.from('users').delete().eq('id', targetId);
    if (errUser) {
      console.warn('Supabase delete user by id error:', errUser);
    }
    if (targetRoll && targetRoll !== targetId) {
      await supabase.from('users').delete().eq('roll', targetRoll);
      await supabase.from('users').delete().eq('login_id', targetRoll);
    }

    // 2. Delete from native students table if it exists
    try {
      await supabase.from('students').delete().eq('id', targetId);
      if (targetRoll !== targetId) {
        await supabase.from('students').delete().eq('roll_no', targetRoll);
      }
    } catch (e) {}

    // 3. Delete from audit_logs universal sync store
    await supabase.from('audit_logs').delete().eq('id', `SYNC_students_${targetId}`);
    if (targetRoll && targetRoll !== targetId) {
      await supabase.from('audit_logs').delete().eq('id', `SYNC_students_${targetRoll}`);
    }
    await supabase.from('audit_logs').delete()
      .eq('action', 'CLOUD_SYNC::students')
      .in('user_id', [targetId, targetRoll]);

    // 4. Cascade cleanup: student attendance records, leave requests, registration requests
    try {
      await supabase.from('attendance_records').delete().or(`student_id.eq.${targetId},student_id.eq.${targetRoll}`);
    } catch (e) {}
    try {
      await supabase.from('attendance').delete().or(`student_id.eq.${targetId},student_id.eq.${targetRoll}`);
    } catch (e) {}
    try {
      await supabase.from('leave_requests').delete().or(`applicant_id.eq.${targetId},applicant_id.eq.${targetRoll},student_id.eq.${targetId},student_id.eq.${targetRoll}`);
    } catch (e) {}
    try {
      await supabase.from('registration_requests').delete().or(`roll_no.eq.${targetRoll},email.eq.${student?.email || ''}`);
    } catch (e) {}

    // 5. Update local cache (Preferences & localStorage)
    const updatedStudents = cached.filter(s => s.id !== targetId && s.rollNo !== targetRoll);
    await setCachedData(PREF_KEYS.STUDENTS, updatedStudents);

    const cachedAttendance = await getCachedData<AttendanceRecord[]>(PREF_KEYS.ATTENDANCE, []);
    const updatedAttendance = cachedAttendance.filter(a => a.studentId !== targetId && a.studentId !== targetRoll);
    await setCachedData(PREF_KEYS.ATTENDANCE, updatedAttendance);

    const cachedLeaves = await getCachedData<LeaveRequest[]>(PREF_KEYS.LEAVES, []);
    const updatedLeaves = cachedLeaves.filter(l => l.studentId !== targetId && l.applicantId !== targetId && l.applicantId !== targetRoll);
    await setCachedData(PREF_KEYS.LEAVES, updatedLeaves);

    return { success: true, message: `Student ${displayName} successfully deleted.` };
  } catch (err: any) {
    console.error('Error deleting student:', err);
    return { success: false, message: `Failed to delete student: ${err?.message || 'Network error'}` };
  }
}

// -------------------------------------------------------------
// 2. FACULTY SERVICE
// -------------------------------------------------------------
export async function fetchFacultyFromDB(): Promise<Faculty[]> {
  const cloudData = await fetchCloudRecords<any>('faculty');
  const facultyMap = new Map<string, Faculty>();

  if (cloudData !== null) {
    for (const d of cloudData) {
      const code = (d.faculty_code || d.facultyCode || d.id || '').trim();
      facultyMap.set(d.id, {
        id: d.id,
        facultyCode: code,
        name: d.name,
        email: d.email,
        department: d.department || 'Department of Computer Science & Engineering',
        designation: d.designation || 'Lecturer',
        phone: d.phone || '',
        subjectsHandled: d.subjects_handled || d.subjectsHandled || [],
        approvalStatus: d.approval_status || d.approvalStatus || 'approved',
        passwordHash: d.password_hash || d.passwordHash
      });
    }
  }

  // Also query native users table in Supabase where role = 'staff'
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: staffUsers, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'staff');
      if (!error && Array.isArray(staffUsers)) {
        for (const u of staffUsers) {
          if (!facultyMap.has(u.id)) {
            const code = (u.faculty_code || u.login_id || u.id || '').trim();
            facultyMap.set(u.id, {
              id: u.id,
              facultyCode: code,
              name: u.name,
              email: u.email || `${u.id}@college.edu`,
              department: u.dept_id === 'cse' ? 'Department of Computer Science & Engineering' : (u.dept_id || 'Department of Computer Science & Engineering'),
              designation: 'Faculty',
              phone: u.phone || '',
              subjectsHandled: [],
              approvalStatus: 'approved',
              passwordHash: u.password_hash
            });
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  let resultList = Array.from(facultyMap.values());
  if (cloudData === null && resultList.length === 0) {
    resultList = await getCachedData<Faculty[]>(PREF_KEYS.FACULTY, INITIAL_FACULTY);
  }

  await setCachedData(PREF_KEYS.FACULTY, resultList);
  return resultList;
}

export async function saveFacultyToDB(fac: Faculty): Promise<boolean> {
  const cloudOk = await saveCloudRecord('faculty', {
    id: fac.id,
    faculty_code: fac.facultyCode,
    facultyCode: fac.facultyCode,
    name: fac.name,
    email: fac.email,
    department: fac.department,
    designation: fac.designation,
    phone: fac.phone,
    approval_status: fac.approvalStatus,
    approvalStatus: fac.approvalStatus,
    password_hash: fac.passwordHash || null,
    passwordHash: fac.passwordHash || null
  });

  // Dual-write to native users table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('users').upsert({
        id: fac.id,
        name: fac.name,
        email: fac.email,
        role: 'staff',
        dept_id: 'cse',
        login_id: fac.facultyCode,
        password_hash: fac.passwordHash || 'staff123'
      });
    } catch (e) {}
  }

  const cached = await getCachedData<Faculty[]>(PREF_KEYS.FACULTY, []);
  const idx = cached.findIndex(f => f.id === fac.id);
  if (idx >= 0) cached[idx] = fac;
  else cached.unshift(fac);
  await setCachedData(PREF_KEYS.FACULTY, cached);

  return cloudOk;
}

export async function deleteFacultyFromDB(idOrCode: string): Promise<DeleteResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase cloud database is unreachable. Cannot delete.' };
  }

  try {
    const cached = await getCachedData<Faculty[]>(PREF_KEYS.FACULTY, []);
    const fac = cached.find(f => f.id === idOrCode || f.facultyCode === idOrCode);
    const targetId = fac?.id || idOrCode;
    const targetCode = fac?.facultyCode || idOrCode;
    const displayName = fac ? `${fac.name} (${fac.facultyCode})` : idOrCode;

    // 1. Delete from users table (role = 'staff')
    await supabase.from('users').delete().eq('id', targetId);
    if (targetCode && targetCode !== targetId) {
      await supabase.from('users').delete().eq('login_id', targetCode);
    }

    // 2. Delete from native faculty table if exists
    try {
      await supabase.from('faculty').delete().eq('id', targetId);
    } catch (e) {}

    // 3. Delete from audit_logs universal cloud sync
    await supabase.from('audit_logs').delete().eq('id', `SYNC_faculty_${targetId}`);
    if (targetCode && targetCode !== targetId) {
      await supabase.from('audit_logs').delete().eq('id', `SYNC_faculty_${targetCode}`);
    }
    await supabase.from('audit_logs').delete()
      .eq('action', 'CLOUD_SYNC::faculty')
      .in('user_id', [targetId, targetCode]);

    // 4. Safely unassign faculty in courses & timetable in Supabase
    try {
      await supabase.from('courses').update({ faculty_id: null }).eq('faculty_id', targetId);
      await supabase.from('courses').update({ faculty_id: null }).eq('faculty_id', targetCode);
    } catch (e) {}
    try {
      await supabase.from('timetable').update({ staff_id: null }).eq('staff_id', targetId);
      await supabase.from('timetable').update({ staff_id: null }).eq('staff_id', targetCode);
    } catch (e) {}
    try {
      await supabase.from('registration_requests').delete().or(`faculty_code.eq.${targetCode},email.eq.${fac?.email || ''}`);
    } catch (e) {}

    // 5. Update local cache
    const updatedFaculty = cached.filter(f => f.id !== targetId && f.facultyCode !== targetCode);
    await setCachedData(PREF_KEYS.FACULTY, updatedFaculty);

    // Unassign in cached subjects & timetable
    const cachedSubjects = await getCachedData<Subject[]>(PREF_KEYS.SUBJECTS, []);
    const updatedSubjects = cachedSubjects.map(s => (s.facultyId === targetId || s.facultyId === targetCode) ? { ...s, facultyId: '', facultyName: 'Unassigned' } : s);
    await setCachedData(PREF_KEYS.SUBJECTS, updatedSubjects);

    const cachedTT = await getCachedData<TimetableSlot[]>(PREF_KEYS.TIMETABLE, []);
    const updatedTT = cachedTT.map(t => (t.facultyId === targetId || t.facultyId === targetCode) ? { ...t, facultyId: '', facultyName: 'Unassigned' } : t);
    await setCachedData(PREF_KEYS.TIMETABLE, updatedTT);

    return { success: true, message: `Faculty ${displayName} successfully deleted.` };
  } catch (err: any) {
    console.error('Error deleting faculty:', err);
    return { success: false, message: `Failed to delete faculty: ${err?.message || 'Network error'}` };
  }
}

// -------------------------------------------------------------
// 3. SUBJECTS SERVICE
// -------------------------------------------------------------
export async function fetchSubjectsFromDB(): Promise<Subject[]> {
  const cloudData = await fetchCloudRecords<any>('subjects');
  const subjectMap = new Map<string, Subject>();

  if (cloudData !== null) {
    for (const d of cloudData) {
      subjectMap.set(d.id, {
        id: d.id,
        code: d.code,
        name: d.name,
        department: d.department || 'Department of Computer Science & Engineering',
        semester: d.semester || 5,
        type: d.type as any,
        credits: d.credits || 3,
        facultyId: d.faculty_id || d.facultyId || '',
        facultyName: d.faculty_name || d.facultyName
      });
    }
  }

  // Also query native courses table in Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: courses, error } = await supabase.from('courses').select('*');
      if (!error && Array.isArray(courses)) {
        for (const c of courses) {
          if (!subjectMap.has(c.id)) {
            subjectMap.set(c.id, {
              id: c.id,
              code: c.code,
              name: c.name,
              department: c.dept_id === 'cse' ? 'Department of Computer Science & Engineering' : (c.dept_id || 'Department of Computer Science & Engineering'),
              semester: 5,
              type: (c.type === 'Practical' ? 'Practical' : 'Lecture'),
              credits: 3,
              facultyId: c.faculty_id || '',
              facultyName: ''
            });
          }
        }
      }
    } catch (e) {}
  }

  let resultList = Array.from(subjectMap.values());
  if (cloudData === null && resultList.length === 0) {
    resultList = await getCachedData<Subject[]>(PREF_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  }

  await setCachedData(PREF_KEYS.SUBJECTS, resultList);
  return resultList;
}

export async function saveSubjectToDB(subject: Subject): Promise<boolean> {
  const cloudOk = await saveCloudRecord('subjects', {
    id: subject.id,
    code: subject.code,
    name: subject.name,
    department: subject.department,
    semester: subject.semester,
    type: subject.type,
    credits: subject.credits,
    faculty_id: subject.facultyId,
    facultyId: subject.facultyId
  });

  // Also upsert to native courses table in Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('courses').upsert({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        dept_id: 'cse',
        type: subject.type === 'Practical' ? 'Practical' : 'Lecture'
      });
    } catch (e) {}
  }

  const cached = await getCachedData<Subject[]>(PREF_KEYS.SUBJECTS, []);
  const idx = cached.findIndex(s => s.id === subject.id);
  if (idx >= 0) cached[idx] = subject;
  else cached.unshift(subject);
  await setCachedData(PREF_KEYS.SUBJECTS, cached);

  return cloudOk;
}

export async function deleteSubjectFromDB(idOrCode: string): Promise<DeleteResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase cloud database is unreachable. Cannot delete.' };
  }

  try {
    const cached = await getCachedData<Subject[]>(PREF_KEYS.SUBJECTS, []);
    const sub = cached.find(s => s.id === idOrCode || s.code === idOrCode);
    const targetId = sub?.id || idOrCode;
    const targetCode = sub?.code || idOrCode;
    const displayName = sub ? `${sub.name} (${sub.code})` : idOrCode;

    // 1. Cascaded deletion of linked timetable slots FIRST to satisfy foreign key constraint timetable_course_id_fkey
    try {
      await supabase.from('timetable').delete().or(`course_id.eq.${targetId},course_id.eq.${targetCode}`);
    } catch (e) {}

    // Also delete linked timetable slots from audit_logs
    try {
      const { data: ttLogs } = await supabase.from('audit_logs').select('id, details').eq('action', 'CLOUD_SYNC::timetable');
      if (ttLogs && Array.isArray(ttLogs)) {
        const toDeleteIds: string[] = [];
        for (const log of ttLogs) {
          if (log.details && (log.details.includes(`"${targetId}"`) || log.details.includes(`"${targetCode}"`))) {
            toDeleteIds.push(log.id);
          }
        }
        if (toDeleteIds.length > 0) {
          await supabase.from('audit_logs').delete().in('id', toDeleteIds);
        }
      }
    } catch (e) {}

    // 2. Delete attendance records for this subject
    try {
      await supabase.from('attendance_records').delete().or(`subject_id.eq.${targetId},subject_id.eq.${targetCode}`);
    } catch (e) {}

    // 3. Delete from native courses table
    await supabase.from('courses').delete().eq('id', targetId);
    if (targetCode && targetCode !== targetId) {
      await supabase.from('courses').delete().eq('code', targetCode);
    }

    // 4. Delete from native subjects table if exists
    try {
      await supabase.from('subjects').delete().eq('id', targetId);
    } catch (e) {}

    // 5. Delete from audit_logs universal cloud sync
    await supabase.from('audit_logs').delete().eq('id', `SYNC_subjects_${targetId}`);
    if (targetCode && targetCode !== targetId) {
      await supabase.from('audit_logs').delete().eq('id', `SYNC_subjects_${targetCode}`);
    }
    await supabase.from('audit_logs').delete()
      .eq('action', 'CLOUD_SYNC::subjects')
      .in('user_id', [targetId, targetCode]);

    // 6. Update local cache for subjects, timetable, and attendance
    const updatedSubjects = cached.filter(s => s.id !== targetId && s.code !== targetCode);
    await setCachedData(PREF_KEYS.SUBJECTS, updatedSubjects);

    const cachedTT = await getCachedData<TimetableSlot[]>(PREF_KEYS.TIMETABLE, []);
    const updatedTT = cachedTT.filter(t => t.subjectId !== targetId && t.subjectCode !== targetCode && t.subjectId !== targetCode);
    await setCachedData(PREF_KEYS.TIMETABLE, updatedTT);

    const cachedAtt = await getCachedData<AttendanceRecord[]>(PREF_KEYS.ATTENDANCE, []);
    const updatedAtt = cachedAtt.filter(a => a.subjectId !== targetId && a.subjectId !== targetCode);
    await setCachedData(PREF_KEYS.ATTENDANCE, updatedAtt);

    return { success: true, message: `Subject ${displayName} and its linked timetable slots deleted successfully.` };
  } catch (err: any) {
    console.error('Error deleting subject:', err);
    return { success: false, message: `Failed to delete subject: ${err?.message || 'Network error'}` };
  }
}

// -------------------------------------------------------------
// 4. TIMETABLE SERVICE
// -------------------------------------------------------------
export async function fetchTimetableFromDB(): Promise<TimetableSlot[]> {
  const cloudData = await fetchCloudRecords<any>('timetable');
  const slotMap = new Map<string, TimetableSlot>();

  if (cloudData !== null) {
    for (const d of cloudData) {
      slotMap.set(d.id, {
        id: d.id,
        dayOfWeek: d.day_of_week || d.dayOfWeek || d.day || 'Monday',
        timeSlot: d.time_slot || d.timeSlot || d.time || '09:00 AM - 10:00 AM',
        subjectId: d.subject_id || d.subjectId || d.course_id || 'SUB501',
        subjectName: d.subject_name || d.subjectName || '',
        subjectCode: d.subject_code || d.subjectCode || '',
        subjectType: d.subject_type || d.subjectType || 'Lecture',
        facultyId: d.faculty_id || d.facultyId || d.staff_id || 'FAC_MB',
        facultyName: d.faculty_name || d.facultyName || '',
        roomNo: d.room_no || d.roomNo || d.classroom || 'Hall - 2211',
        department: d.department || 'Department of Computer Science & Engineering',
        semester: d.semester || 5,
        section: d.section || 'B Batch'
      });
    }
  }

  // Also query native timetable table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: nativeTT, error } = await supabase.from('timetable').select('*');
      if (!error && Array.isArray(nativeTT)) {
        for (const t of nativeTT) {
          if (!slotMap.has(t.id)) {
            slotMap.set(t.id, {
              id: t.id,
              dayOfWeek: t.day || 'Monday',
              timeSlot: t.time || '08.30 AM - 09.30 AM',
              subjectId: t.course_id || '',
              subjectName: '',
              subjectCode: t.course_id || '',
              subjectType: 'Lecture',
              facultyId: t.staff_id || '',
              facultyName: '',
              roomNo: t.classroom || 'Hall - 2211',
              department: 'Department of Computer Science & Engineering',
              semester: 5,
              section: 'B Batch'
            });
          }
        }
      }
    } catch (e) {}
  }

  let resultList = Array.from(slotMap.values());
  if (cloudData === null && resultList.length === 0) {
    resultList = await getCachedData<TimetableSlot[]>(PREF_KEYS.TIMETABLE, INITIAL_TIMETABLE);
  }

  await setCachedData(PREF_KEYS.TIMETABLE, resultList);
  return resultList;
}

export async function saveTimetableSlotToDB(slot: TimetableSlot): Promise<boolean> {
  const cloudOk = await saveCloudRecord('timetable', {
    id: slot.id,
    day_of_week: slot.dayOfWeek,
    dayOfWeek: slot.dayOfWeek,
    time_slot: slot.timeSlot,
    timeSlot: slot.timeSlot,
    subject_id: slot.subjectId,
    subjectId: slot.subjectId,
    faculty_id: slot.facultyId,
    facultyId: slot.facultyId,
    room_no: slot.roomNo,
    roomNo: slot.roomNo,
    department: slot.department,
    semester: slot.semester,
    section: slot.section
  });

  // Also upsert to native timetable table in Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('timetable').upsert({
        id: slot.id,
        course_id: slot.subjectId || 'SUB501',
        day: slot.dayOfWeek,
        time: slot.timeSlot,
        classroom: slot.roomNo,
        staff_id: slot.facultyId || null
      });
    } catch (e) {}
  }

  const cached = await getCachedData<TimetableSlot[]>(PREF_KEYS.TIMETABLE, []);
  const idx = cached.findIndex(s => s.id === slot.id);
  if (idx >= 0) cached[idx] = slot;
  else cached.unshift(slot);
  await setCachedData(PREF_KEYS.TIMETABLE, cached);

  return cloudOk;
}

export async function deleteTimetableSlotFromDB(slotId: string): Promise<DeleteResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase cloud database is unreachable. Cannot delete.' };
  }

  try {
    // 1. Delete from native timetable table
    await supabase.from('timetable').delete().eq('id', slotId);

    // 2. Delete from audit_logs universal cloud sync
    await supabase.from('audit_logs').delete().eq('id', `SYNC_timetable_${slotId}`);
    await supabase.from('audit_logs').delete().eq('action', 'CLOUD_SYNC::timetable').eq('user_id', slotId);

    // 3. Update local cache
    const cached = await getCachedData<TimetableSlot[]>(PREF_KEYS.TIMETABLE, []);
    const updated = cached.filter(t => t.id !== slotId);
    await setCachedData(PREF_KEYS.TIMETABLE, updated);

    return { success: true, message: 'Timetable slot deleted successfully.' };
  } catch (err: any) {
    console.error('Error deleting timetable slot:', err);
    return { success: false, message: `Failed to delete timetable slot: ${err?.message || 'Network error'}` };
  }
}

// -------------------------------------------------------------
// 5. SATURDAY CLASS CONFIGURATION SERVICE
// -------------------------------------------------------------
export async function fetchSaturdayConfigFromDB(): Promise<SaturdayConfig> {
  const defaultCfg: SaturdayConfig = { mappedDay: 'Monday', enabled: true };
  const cloudData = await fetchCloudRecords<any>('saturday_config');
  if (cloudData !== null && cloudData.length > 0) {
    const d = cloudData[0];
    const cfg: SaturdayConfig = {
      mappedDay: d.mapped_day || d.mappedDay || 'Monday',
      enabled: d.enabled ?? true,
      lastUpdatedBy: d.updated_by || d.lastUpdatedBy,
      updatedAt: d.updated_at || d.updatedAt
    };
    await setCachedData(PREF_KEYS.SATURDAY_CONFIG, cfg);
    return cfg;
  }
  return getCachedData<SaturdayConfig>(PREF_KEYS.SATURDAY_CONFIG, defaultCfg);
}

export async function saveSaturdayConfigToDB(config: SaturdayConfig, updatedBy: string): Promise<boolean> {
  const payload = {
    id: 'sat_cfg_main',
    mapped_day: config.mappedDay,
    mappedDay: config.mappedDay,
    enabled: config.enabled,
    updated_by: updatedBy,
    lastUpdatedBy: updatedBy,
    updated_at: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const cloudOk = await saveCloudRecord('saturday_config', payload);
  await setCachedData(PREF_KEYS.SATURDAY_CONFIG, config);
  return cloudOk;
}

// -------------------------------------------------------------
// 6. ATTENDANCE RECORDS SERVICE (Weighted calculations engine)
// -------------------------------------------------------------
export async function fetchAttendanceRecordsFromDB(): Promise<AttendanceRecord[]> {
  const cloudData = await fetchCloudRecords<any>('attendance_records');
  if (cloudData !== null) {
    const mapped: AttendanceRecord[] = cloudData.map((d: any) => ({
      id: d.id,
      date: d.date,
      studentId: d.student_id || d.studentId,
      subjectId: d.subject_id || d.subjectId,
      subjectName: d.subject_name || d.subjectName || '',
      subjectType: d.subject_type || d.subjectType || 'Lecture',
      status: d.status as any,
      slotId: d.slot_id || d.slotId,
      markedByFacultyId: d.marked_by_faculty_id || d.markedByFacultyId || 'FAC101',
      markedAt: d.marked_at || d.markedAt || new Date().toISOString(),
      method: d.method || 'manual',
      notes: d.notes,
      isSaturday: d.is_saturday ?? d.isSaturday ?? false
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await setCachedData(PREF_KEYS.ATTENDANCE, mapped);
    return mapped;
  }
  return getCachedData<AttendanceRecord[]>(PREF_KEYS.ATTENDANCE, generateSeedAttendance());
}

export async function addAttendanceRecordToDB(record: AttendanceRecord): Promise<boolean> {
  const cloudOk = await saveCloudRecord('attendance_records', {
    id: record.id,
    date: record.date,
    student_id: record.studentId,
    studentId: record.studentId,
    subject_id: record.subjectId,
    subjectId: record.subjectId,
    subject_type: record.subjectType,
    subjectType: record.subjectType,
    status: record.status,
    slot_id: record.slotId || null,
    slotId: record.slotId || null,
    marked_by_faculty_id: record.markedByFacultyId,
    markedByFacultyId: record.markedByFacultyId,
    marked_at: record.markedAt,
    markedAt: record.markedAt,
    method: record.method || 'manual',
    notes: record.notes || null,
    is_saturday: record.isSaturday || false,
    isSaturday: record.isSaturday || false
  });

  const cached = await getCachedData<AttendanceRecord[]>(PREF_KEYS.ATTENDANCE, []);
  const idx = cached.findIndex(r => r.id === record.id);
  if (idx >= 0) cached[idx] = record;
  else cached.unshift(record);
  await setCachedData(PREF_KEYS.ATTENDANCE, cached);

  return cloudOk;
}

export async function saveBatchAttendanceDB(records: AttendanceRecord[]): Promise<boolean> {
  let allOk = true;
  for (const r of records) {
    const ok = await addAttendanceRecordToDB(r);
    if (!ok) allOk = false;
  }
  return allOk;
}

// -------------------------------------------------------------
// 7. REGISTRATION REQUESTS & APPROVAL QUEUE SERVICE
// -------------------------------------------------------------
export async function fetchRegistrationRequestsFromDB(): Promise<RegistrationRequest[]> {
  const cloudData = await fetchCloudRecords<any>('registration_requests');
  if (cloudData !== null) {
    const mapped: RegistrationRequest[] = cloudData.map((d: any) => ({
      id: d.id,
      role: d.role as any,
      name: d.name,
      email: d.email,
      rollNo: d.roll_no || d.rollNo,
      facultyCode: d.faculty_code || d.facultyCode,
      department: d.department || 'Computer Science',
      year: d.year,
      semester: d.semester,
      section: d.section,
      designation: d.designation,
      phone: d.phone,
      parentName: d.parent_name || d.parentName,
      parentPhone: d.parent_phone || d.parentPhone,
      status: (d.status || d.approval_status || 'pending') as ApprovalStatus,
      submittedAt: d.submitted_at || d.submittedAt || new Date().toISOString(),
      verifiedEmail: d.verified_email || d.verifiedEmail || false,
      passwordHash: d.password_hash || d.passwordHash
    })).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    await setCachedData(PREF_KEYS.REGISTRATIONS, mapped);
    return mapped;
  }
  return getCachedData<RegistrationRequest[]>(PREF_KEYS.REGISTRATIONS, []);
}

export async function submitRegistrationRequestDB(req: RegistrationRequest): Promise<boolean> {
  const cloudOk = await saveCloudRecord('registration_requests', {
    id: req.id,
    role: req.role,
    name: req.name,
    email: req.email,
    roll_no: req.rollNo || null,
    rollNo: req.rollNo || null,
    faculty_code: req.facultyCode || null,
    facultyCode: req.facultyCode || null,
    department: req.department || 'Computer Science',
    year: req.year || null,
    semester: req.semester || null,
    section: req.section || null,
    designation: req.designation || null,
    phone: req.phone || null,
    parent_name: req.parentName || null,
    parentName: req.parentName || null,
    parent_phone: req.parentPhone || null,
    parentPhone: req.parentPhone || null,
    status: req.status,
    submitted_at: req.submittedAt,
    submittedAt: req.submittedAt,
    verified_email: req.verifiedEmail,
    verifiedEmail: req.verifiedEmail,
    password_hash: req.passwordHash || null,
    passwordHash: req.passwordHash || null
  });

  const cached = await getCachedData<RegistrationRequest[]>(PREF_KEYS.REGISTRATIONS, []);
  const idx = cached.findIndex(r => r.id === req.id);
  if (idx >= 0) cached[idx] = req;
  else cached.unshift(req);
  await setCachedData(PREF_KEYS.REGISTRATIONS, cached);

  return cloudOk;
}

export async function updateRegistrationStatusDB(requestId: string, status: ApprovalStatus): Promise<boolean> {
  const reqs = await fetchRegistrationRequestsFromDB();
  const target = reqs.find(r => r.id === requestId);
  if (!target) return false;

  target.status = status;
  const cloudOk = await submitRegistrationRequestDB(target);

  if (status === 'approved') {
    if (target.role === 'student') {
      const newStudent: Student = {
        id: `STU_${Date.now()}`,
        rollNo: target.rollNo || `24CS${Math.floor(10 + Math.random() * 90)}`,
        name: target.name,
        email: target.email,
        department: target.department || 'Computer Science',
        year: target.year || '1st Year',
        semester: target.semester || 1,
        section: target.section || 'A',
        parentName: target.parentName,
        parentPhone: target.parentPhone,
        approvalStatus: 'approved',
        passwordHash: target.passwordHash
      };
      await saveStudentToDB(newStudent);

      if (target.parentName || target.parentPhone) {
        const newParent: ParentRecord = {
          id: `PAR_${Date.now()}`,
          name: target.parentName || `Parent of ${target.name}`,
          email: `parent.${target.email}`,
          phone: target.parentPhone || '',
          childRollNo: newStudent.rollNo,
          childName: newStudent.name,
          passwordHash: target.passwordHash,
          createdAt: new Date().toISOString()
        };
        await saveParentToDB(newParent);
      }
    } else if (target.role === 'faculty') {
      const newFaculty: Faculty = {
        id: `FAC_${Date.now()}`,
        facultyCode: target.facultyCode || `FAC-${Math.floor(100 + Math.random() * 900)}`,
        name: target.name,
        email: target.email,
        department: target.department || 'Computer Science',
        designation: target.designation || 'Lecturer',
        phone: target.phone || '',
        subjectsHandled: [],
        approvalStatus: 'approved',
        passwordHash: target.passwordHash
      };
      await saveFacultyToDB(newFaculty);
    }
  }
  return cloudOk;
}

// -------------------------------------------------------------
// 8. LEAVE REQUESTS SERVICE
// -------------------------------------------------------------
export async function fetchLeavesFromDB(): Promise<LeaveRequest[]> {
  const cloudData = await fetchCloudRecords<any>('leave_requests');
  if (cloudData !== null) {
    const mapped: LeaveRequest[] = cloudData.map((d: any) => ({
      id: d.id,
      applicantId: d.applicant_id || d.applicantId || d.student_id,
      applicantName: d.applicant_name || d.applicantName || 'Student',
      applicantRole: d.applicant_role || d.applicantRole || 'student',
      studentId: d.student_id || d.studentId,
      startDate: d.start_date || d.startDate || d.date,
      endDate: d.end_date || d.endDate || d.date,
      leaveType: d.leave_type || d.leaveType || 'Medical',
      reason: d.reason || '',
      status: d.status as any,
      appliedOn: d.applied_on || d.appliedOn || d.submitted_at || new Date().toISOString(),
      approvedBy: d.approved_by || d.approvedBy,
      approvedOn: d.approved_on || d.approvedOn,
      remarks: d.remarks
    })).sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());

    await setCachedData(PREF_KEYS.LEAVES, mapped);
    return mapped;
  }
  return getCachedData<LeaveRequest[]>(PREF_KEYS.LEAVES, INITIAL_LEAVES);
}

export async function addLeaveRequestDB(leave: LeaveRequest): Promise<boolean> {
  const cloudOk = await saveCloudRecord('leave_requests', {
    id: leave.id,
    applicant_id: leave.applicantId,
    applicantId: leave.applicantId,
    applicant_name: leave.applicantName,
    applicantName: leave.applicantName,
    applicant_role: leave.applicantRole,
    applicantRole: leave.applicantRole,
    student_id: leave.studentId,
    studentId: leave.studentId,
    start_date: leave.startDate,
    startDate: leave.startDate,
    end_date: leave.endDate,
    endDate: leave.endDate,
    leave_type: leave.leaveType,
    leaveType: leave.leaveType,
    reason: leave.reason,
    status: leave.status,
    applied_on: leave.appliedOn,
    appliedOn: leave.appliedOn
  });

  const cached = await getCachedData<LeaveRequest[]>(PREF_KEYS.LEAVES, []);
  cached.unshift(leave);
  await setCachedData(PREF_KEYS.LEAVES, cached);
  return cloudOk;
}

export async function updateLeaveStatusDB(leaveId: string, status: 'approved' | 'rejected', approvedBy: string, remarks?: string): Promise<boolean> {
  const leaves = await fetchLeavesFromDB();
  const target = leaves.find(l => l.id === leaveId);
  if (!target) return false;

  target.status = status;
  target.approvedBy = approvedBy;
  target.approvedOn = new Date().toISOString();
  if (remarks) target.remarks = remarks;

  return addLeaveRequestDB(target);
}

// -------------------------------------------------------------
// 9. AUDIT LOGS SERVICE
// -------------------------------------------------------------
export async function fetchAuditLogsFromDB(): Promise<AuditLog[]> {
  const cloudData = await fetchCloudRecords<any>('audit_logs');
  if (cloudData !== null) {
    const mapped: AuditLog[] = cloudData.map((d: any) => ({
      id: d.id,
      timestamp: d.timestamp || new Date().toISOString(),
      userId: d.user_id || d.userId || 'sys',
      userName: d.user_name || d.userName || 'System',
      userRole: d.user_role || d.userRole || d.role || 'user',
      action: d.action,
      details: d.details
    })).filter(l => !l.action.startsWith('CLOUD_SYNC::')).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    await setCachedData(PREF_KEYS.LOGS, mapped);
    return mapped;
  }
  return getCachedData<AuditLog[]>(PREF_KEYS.LOGS, INITIAL_AUDIT_LOGS);
}

export async function addAuditLogDB(userId: string, userName: string, userRole: any, action: string, details: string): Promise<void> {
  const newLog: AuditLog = {
    id: `LOG_${Date.now()}_${Math.floor(Math.random()*1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    details
  };
  await saveCloudRecord('audit_logs', {
    id: newLog.id,
    timestamp: newLog.timestamp,
    user_id: newLog.userId,
    userId: newLog.userId,
    user_name: newLog.userName,
    userName: newLog.userName,
    role: newLog.userRole,
    user_role: newLog.userRole,
    action: newLog.action,
    details: newLog.details
  });

  const cached = await getCachedData<AuditLog[]>(PREF_KEYS.LOGS, []);
  cached.unshift(newLog);
  await setCachedData(PREF_KEYS.LOGS, cached.slice(0, 100));
}

// -------------------------------------------------------------
// 10. PARENTS & DEPARTMENTS SERVICES
// -------------------------------------------------------------
export async function fetchParentsFromDB(): Promise<ParentRecord[]> {
  const cloudData = await fetchCloudRecords<any>('parents');
  if (cloudData !== null) {
    const mapped: ParentRecord[] = cloudData.map((d: any) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      childRollNo: d.child_roll_no || d.childRollNo || '',
      childName: d.child_name || d.childName,
      createdAt: d.created_at || d.createdAt
    }));
    await setCachedData(PREF_KEYS.PARENTS, mapped);
    return mapped;
  }
  return getCachedData<ParentRecord[]>(PREF_KEYS.PARENTS, INITIAL_PARENTS);
}

export async function saveParentToDB(parent: ParentRecord): Promise<boolean> {
  const cloudOk = await saveCloudRecord('parents', {
    id: parent.id,
    name: parent.name,
    email: parent.email,
    phone: parent.phone,
    child_roll_no: parent.childRollNo,
    childRollNo: parent.childRollNo,
    child_name: parent.childName,
    childName: parent.childName
  });

  const cached = await getCachedData<ParentRecord[]>(PREF_KEYS.PARENTS, []);
  const idx = cached.findIndex(p => p.id === parent.id);
  if (idx >= 0) cached[idx] = parent;
  else cached.unshift(parent);
  await setCachedData(PREF_KEYS.PARENTS, cached);

  return cloudOk;
}

export async function deleteParentFromDB(id: string): Promise<DeleteResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase cloud database is unreachable. Cannot delete.' };
  }

  try {
    const cached = await getCachedData<ParentRecord[]>(PREF_KEYS.PARENTS, []);
    const parent = cached.find(p => p.id === id);
    const displayName = parent ? parent.name : id;

    await supabase.from('parents').delete().eq('id', id);
    await supabase.from('users').delete().eq('id', id);
    if (parent?.childRollNo) {
      await supabase.from('users').delete().eq('login_id', `PAR_${parent.childRollNo}`);
    }
    await supabase.from('audit_logs').delete().eq('id', `SYNC_parents_${id}`);
    await supabase.from('audit_logs').delete().eq('action', 'CLOUD_SYNC::parents').eq('user_id', id);

    const updated = cached.filter(p => p.id !== id);
    await setCachedData(PREF_KEYS.PARENTS, updated);

    return { success: true, message: `Parent ${displayName} deleted successfully.` };
  } catch (err: any) {
    console.error('Error deleting parent:', err);
    return { success: false, message: `Failed to delete parent: ${err?.message || 'Network error'}` };
  }
}

export async function fetchDepartmentsFromDB(): Promise<Department[]> {
  const cloudData = await fetchCloudRecords<any>('departments');
  if (cloudData !== null) {
    const mapped: Department[] = cloudData.map((d: any) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      hodName: d.hod_name || d.hodName
    }));
    await setCachedData(PREF_KEYS.DEPARTMENTS, mapped);
    return mapped;
  }
  return getCachedData<Department[]>(PREF_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
}

export async function saveDepartmentToDB(dept: Department): Promise<boolean> {
  const cloudOk = await saveCloudRecord('departments', {
    id: dept.id,
    code: dept.code,
    name: dept.name,
    hod_name: dept.hodName,
    hodName: dept.hodName
  });

  const cached = await getCachedData<Department[]>(PREF_KEYS.DEPARTMENTS, []);
  const idx = cached.findIndex(d => d.id === dept.id);
  if (idx >= 0) cached[idx] = dept;
  else cached.unshift(dept);
  await setCachedData(PREF_KEYS.DEPARTMENTS, cached);

  return cloudOk;
}

export async function deleteDepartmentFromDB(id: string): Promise<DeleteResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase cloud database is unreachable. Cannot delete.' };
  }

  try {
    const cached = await getCachedData<Department[]>(PREF_KEYS.DEPARTMENTS, []);
    const dept = cached.find(d => d.id === id);
    const displayName = dept ? `${dept.name} (${dept.code})` : id;

    await supabase.from('departments').delete().eq('id', id);
    await supabase.from('audit_logs').delete().eq('id', `SYNC_departments_${id}`);
    await supabase.from('audit_logs').delete().eq('action', 'CLOUD_SYNC::departments').eq('user_id', id);

    const updated = cached.filter(d => d.id !== id);
    await setCachedData(PREF_KEYS.DEPARTMENTS, updated);

    return { success: true, message: `Department ${displayName} deleted successfully.` };
  } catch (err: any) {
    console.error('Error deleting department:', err);
    return { success: false, message: `Failed to delete department: ${err?.message || 'Network error'}` };
  }
}

