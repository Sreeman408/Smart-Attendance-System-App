import { getSupabaseClient } from './supabaseClient';
import {
  Student, Faculty, Subject, TimetableSlot, AttendanceRecord,
  LeaveRequest, AuditLog, SaturdayConfig, RegistrationRequest, ApprovalStatus,
  ParentRecord, Department
} from '../types';
import {
  INITIAL_STUDENTS, INITIAL_FACULTY, INITIAL_SUBJECTS,
  INITIAL_TIMETABLE, generateSeedAttendance, INITIAL_LEAVES, INITIAL_AUDIT_LOGS,
  INITIAL_PARENTS, INITIAL_DEPARTMENTS
} from '../data/initialData';
import { Preferences } from '@capacitor/preferences';

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
// 1. STUDENTS SERVICE
// -------------------------------------------------------------
export async function fetchStudentsFromDB(): Promise<Student[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('students').select('*').order('name');
      if (!error && data && data.length > 0) {
        const mapped: Student[] = data.map((d: any) => ({
          id: d.id,
          rollNo: d.roll_no || d.rollNo,
          name: d.name,
          email: d.email,
          department: d.department,
          year: d.year || '2nd Year',
          semester: d.semester || 4,
          section: d.section || 'A',
          parentId: d.parent_id || d.parentId,
          parentName: d.parent_name || d.parentName,
          parentPhone: d.parent_phone || d.parentPhone,
          avatar: d.avatar,
          approvalStatus: d.approval_status || d.approvalStatus || 'approved'
        }));
        await setCachedData(PREF_KEYS.STUDENTS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase fetchStudents error, falling back to cache:', e);
    }
  }
  return getCachedData<Student[]>(PREF_KEYS.STUDENTS, INITIAL_STUDENTS.map(s => ({
    ...s,
    year: s.year || '2nd Year',
    approvalStatus: 'approved'
  })));
}

export async function saveStudentToDB(student: Student): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        id: student.id,
        roll_no: student.rollNo,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        semester: student.semester,
        section: student.section,
        parent_id: student.parentId || null,
        parent_name: student.parentName || null,
        parent_phone: student.parentPhone || null,
        avatar: student.avatar || null,
        approval_status: student.approvalStatus
      };
      const { error } = await supabase.from('students').upsert(payload);
      if (error) console.error('Error saving student to Supabase:', error);
    } catch (e) {
      console.error('Supabase saveStudent exception:', e);
    }
  }
  // Sync local cache
  const cached = await getCachedData<Student[]>(PREF_KEYS.STUDENTS, []);
  const idx = cached.findIndex(s => s.id === student.id);
  if (idx >= 0) cached[idx] = student;
  else cached.unshift(student);
  await setCachedData(PREF_KEYS.STUDENTS, cached);
  return true;
}

// -------------------------------------------------------------
// 2. FACULTY SERVICE
// -------------------------------------------------------------
export async function fetchFacultyFromDB(): Promise<Faculty[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('faculty').select('*').order('name');
      if (!error && data && data.length > 0) {
        const mapped: Faculty[] = data.map((d: any) => ({
          id: d.id,
          facultyCode: d.faculty_code || d.facultyCode,
          name: d.name,
          email: d.email,
          department: d.department,
          designation: d.designation || 'Lecturer',
          phone: d.phone || '',
          subjectsHandled: d.subjects_handled || [],
          approvalStatus: d.approval_status || d.approvalStatus || 'approved'
        }));
        await setCachedData(PREF_KEYS.FACULTY, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase fetchFaculty error, falling back to cache:', e);
    }
  }
  return getCachedData<Faculty[]>(PREF_KEYS.FACULTY, INITIAL_FACULTY.map(f => ({
    ...f,
    approvalStatus: 'approved'
  })));
}

export async function saveFacultyToDB(fac: Faculty): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        id: fac.id,
        faculty_code: fac.facultyCode,
        name: fac.name,
        email: fac.email,
        department: fac.department,
        designation: fac.designation,
        phone: fac.phone,
        approval_status: fac.approvalStatus
      };
      await supabase.from('faculty').upsert(payload);
    } catch (e) {
      console.error('Save faculty error:', e);
    }
  }
  const cached = await getCachedData<Faculty[]>(PREF_KEYS.FACULTY, []);
  const idx = cached.findIndex(f => f.id === fac.id);
  if (idx >= 0) cached[idx] = fac;
  else cached.unshift(fac);
  await setCachedData(PREF_KEYS.FACULTY, cached);
  return true;
}

// -------------------------------------------------------------
// 3. SUBJECTS SERVICE
// -------------------------------------------------------------
export async function fetchSubjectsFromDB(): Promise<Subject[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('subjects').select('*').order('code');
      if (!error && data && data.length > 0) {
        const mapped: Subject[] = data.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          department: d.department,
          semester: d.semester,
          type: d.type as any,
          credits: d.credits || 3,
          facultyId: d.faculty_id || d.facultyId || '',
          facultyName: d.faculty_name || d.facultyName
        }));
        await setCachedData(PREF_KEYS.SUBJECTS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase fetchSubjects error:', e);
    }
  }
  return getCachedData<Subject[]>(PREF_KEYS.SUBJECTS, INITIAL_SUBJECTS);
}

export async function saveSubjectToDB(subject: Subject): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('subjects').upsert({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        department: subject.department,
        semester: subject.semester,
        type: subject.type,
        credits: subject.credits,
        faculty_id: subject.facultyId
      });
    } catch (e) {
      console.error('Save subject error:', e);
    }
  }
  const cached = await getCachedData<Subject[]>(PREF_KEYS.SUBJECTS, []);
  const idx = cached.findIndex(s => s.id === subject.id);
  if (idx >= 0) cached[idx] = subject;
  else cached.unshift(subject);
  await setCachedData(PREF_KEYS.SUBJECTS, cached);
  return true;
}

// -------------------------------------------------------------
// 4. TIMETABLE SERVICE
// -------------------------------------------------------------
export async function fetchTimetableFromDB(): Promise<TimetableSlot[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('timetable').select('*');
      if (!error && data && data.length > 0) {
        const mapped: TimetableSlot[] = data.map((d: any) => ({
          id: d.id,
          dayOfWeek: d.day_of_week || d.dayOfWeek,
          timeSlot: d.time_slot || d.timeSlot,
          subjectId: d.subject_id || d.subjectId,
          subjectName: d.subject_name || d.subjectName || '',
          subjectCode: d.subject_code || d.subjectCode || '',
          subjectType: d.subject_type || d.subjectType || 'Lecture',
          facultyId: d.faculty_id || d.facultyId,
          facultyName: d.faculty_name || d.facultyName || '',
          roomNo: d.room_no || d.roomNo || 'LH-1',
          department: d.department || 'Computer Science',
          semester: d.semester || 4,
          section: d.section || 'A'
        }));
        await setCachedData(PREF_KEYS.TIMETABLE, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Timetable fetch error:', e);
    }
  }
  return getCachedData<TimetableSlot[]>(PREF_KEYS.TIMETABLE, INITIAL_TIMETABLE);
}

export async function saveTimetableSlotToDB(slot: TimetableSlot): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('timetable').upsert({
        id: slot.id,
        day_of_week: slot.dayOfWeek,
        time_slot: slot.timeSlot,
        subject_id: slot.subjectId,
        faculty_id: slot.facultyId,
        room_no: slot.roomNo,
        department: slot.department,
        semester: slot.semester,
        section: slot.section
      });
    } catch (e) {
      console.error('Save slot error:', e);
    }
  }
  const cached = await getCachedData<TimetableSlot[]>(PREF_KEYS.TIMETABLE, []);
  const idx = cached.findIndex(s => s.id === slot.id);
  if (idx >= 0) cached[idx] = slot;
  else cached.unshift(slot);
  await setCachedData(PREF_KEYS.TIMETABLE, cached);
  return true;
}

// -------------------------------------------------------------
// 5. SATURDAY CLASS CONFIGURATION SERVICE
// -------------------------------------------------------------
export async function fetchSaturdayConfigFromDB(): Promise<SaturdayConfig> {
  const defaultCfg: SaturdayConfig = { mappedDay: 'Monday', enabled: true };
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('saturday_config').select('*').limit(1);
      if (!error && data && data.length > 0) {
        const cfg: SaturdayConfig = {
          mappedDay: data[0].mapped_day as any,
          enabled: data[0].enabled,
          lastUpdatedBy: data[0].updated_by,
          updatedAt: data[0].updated_at
        };
        await setCachedData(PREF_KEYS.SATURDAY_CONFIG, cfg);
        return cfg;
      }
    } catch (e) {
      console.warn('Saturday config fetch error:', e);
    }
  }
  return getCachedData<SaturdayConfig>(PREF_KEYS.SATURDAY_CONFIG, defaultCfg);
}

export async function saveSaturdayConfigToDB(config: SaturdayConfig, updatedBy: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const payload = {
    id: 'sat_cfg_main',
    mapped_day: config.mappedDay,
    enabled: config.enabled,
    updated_by: updatedBy,
    updated_at: new Date().toISOString()
  };
  if (supabase) {
    try {
      await supabase.from('saturday_config').upsert(payload);
    } catch (e) {
      console.error('Save saturday config error:', e);
    }
  }
  const fullCfg: SaturdayConfig = {
    ...config,
    lastUpdatedBy: updatedBy,
    updatedAt: payload.updated_at
  };
  await setCachedData(PREF_KEYS.SATURDAY_CONFIG, fullCfg);
  return true;
}

// -------------------------------------------------------------
// 6. ATTENDANCE RECORDS & WEIGHTED CALCULATIONS SERVICE
// -------------------------------------------------------------
export async function fetchAttendanceRecordsFromDB(): Promise<AttendanceRecord[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('attendance_records').select('*').order('date', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped: AttendanceRecord[] = data.map((d: any) => ({
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
          isSaturday: d.is_saturday || d.isSaturday || false
        }));
        await setCachedData(PREF_KEYS.ATTENDANCE, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Attendance records fetch error:', e);
    }
  }
  const seed = generateSeedAttendance();
  return getCachedData<AttendanceRecord[]>(PREF_KEYS.ATTENDANCE, seed);
}

export async function addAttendanceRecordToDB(record: AttendanceRecord): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('attendance_records').upsert({
        id: record.id,
        date: record.date,
        student_id: record.studentId,
        subject_id: record.subjectId,
        subject_type: record.subjectType,
        status: record.status,
        slot_id: record.slotId,
        marked_by_faculty_id: record.markedByFacultyId,
        marked_at: record.markedAt,
        method: record.method,
        notes: record.notes,
        is_saturday: record.isSaturday || false
      });
    } catch (e) {
      console.error('Save attendance error:', e);
    }
  }
  const cached = await getCachedData<AttendanceRecord[]>(PREF_KEYS.ATTENDANCE, []);
  const idx = cached.findIndex(r => r.date === record.date && r.studentId === record.studentId && r.subjectId === record.subjectId);
  if (idx >= 0) cached[idx] = record;
  else cached.unshift(record);
  await setCachedData(PREF_KEYS.ATTENDANCE, cached);
  return true;
}

// -------------------------------------------------------------
// 7. REGISTRATION REQUESTS & APPROVAL QUEUE SERVICE
// -------------------------------------------------------------
export async function fetchRegistrationRequestsFromDB(): Promise<RegistrationRequest[]> {
  const localCached = await getCachedData<RegistrationRequest[]>(PREF_KEYS.REGISTRATIONS, []);
  const supabase = getSupabaseClient();

  const requestsMap = new Map<string, RegistrationRequest>();

  // 1. Always populate with local cached records first
  for (const req of localCached) {
    if (req && req.id) {
      requestsMap.set(req.id, req);
    }
  }

  // 2. Fetch from Supabase if connected and merge seamlessly
  if (supabase) {
    try {
      const { data, error } = await supabase.from('registration_requests').select('*').order('submitted_at', { ascending: false });
      if (error) {
        console.warn('Supabase fetch registration_requests error:', error);
      } else if (data && Array.isArray(data)) {
        for (const d of data) {
          const remoteReq: RegistrationRequest = {
            id: d.id,
            role: d.role as any,
            name: d.name,
            email: d.email,
            rollNo: d.roll_no || d.rollNo,
            facultyCode: d.faculty_code || d.facultyCode,
            department: d.department,
            year: d.year,
            semester: d.semester,
            section: d.section,
            designation: d.designation,
            phone: d.phone,
            parentName: d.parent_name || d.parentName,
            parentPhone: d.parent_phone || d.parentPhone,
            status: d.status as ApprovalStatus,
            submittedAt: d.submitted_at || d.submittedAt || new Date().toISOString(),
            verifiedEmail: d.verified_email || d.verifiedEmail || false
          };

          const existingLocal = requestsMap.get(remoteReq.id);
          if (!existingLocal) {
            requestsMap.set(remoteReq.id, remoteReq);
          } else {
            // Merge remote with local, allowing updated status from remote or local
            requestsMap.set(remoteReq.id, {
              ...existingLocal,
              ...remoteReq,
              status: remoteReq.status || existingLocal.status
            });
          }
        }
      }
    } catch (e) {
      console.warn('Supabase fetch registration_requests exception, serving local cache:', e);
    }
  }

  const merged = Array.from(requestsMap.values()).sort((a, b) => {
    const timeA = new Date(a.submittedAt).getTime() || 0;
    const timeB = new Date(b.submittedAt).getTime() || 0;
    return timeB - timeA;
  });

  // Keep local cache synced with merged set
  await setCachedData(PREF_KEYS.REGISTRATIONS, merged);
  return merged;
}

export async function submitRegistrationRequestDB(req: RegistrationRequest): Promise<boolean> {
  let localOk = false;
  let supabaseOk = false;

  // 1. Save to local cache ALWAYS
  try {
    const cached = await getCachedData<RegistrationRequest[]>(PREF_KEYS.REGISTRATIONS, []);
    const idx = cached.findIndex(r => r.id === req.id);
    if (idx >= 0) {
      cached[idx] = req;
    } else {
      cached.unshift(req);
    }
    await setCachedData(PREF_KEYS.REGISTRATIONS, cached);
    localOk = true;
  } catch (e) {
    console.error('Local cache save failed for registration request:', e);
  }

  // 2. Attempt Supabase insert / upsert
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        id: req.id,
        role: req.role,
        name: req.name,
        email: req.email,
        roll_no: req.rollNo || null,
        faculty_code: req.facultyCode || null,
        department: req.department || 'Computer Science',
        year: req.year || null,
        semester: req.semester || null,
        section: req.section || null,
        designation: req.designation || null,
        phone: req.phone || null,
        parent_name: req.parentName || null,
        parent_phone: req.parentPhone || null,
        status: req.status,
        submitted_at: req.submittedAt,
        verified_email: req.verifiedEmail
      };
      const { error } = await supabase.from('registration_requests').upsert(payload);
      if (error) {
        console.error('Supabase registration_requests upsert error:', error);
      } else {
        supabaseOk = true;
      }
    } catch (e) {
      console.error('Supabase registration_requests upsert exception:', e);
    }
  }

  // Return success if at least local save succeeded
  return localOk || supabaseOk;
}

export async function updateRegistrationStatusDB(requestId: string, status: ApprovalStatus): Promise<boolean> {
  const supabase = getSupabaseClient();
  const cached = await getCachedData<RegistrationRequest[]>(PREF_KEYS.REGISTRATIONS, []);
  const target = cached.find(r => r.id === requestId);
  if (!target) return false;

  target.status = status;
  await setCachedData(PREF_KEYS.REGISTRATIONS, cached);

  if (supabase) {
    try {
      await supabase.from('registration_requests').update({ status }).eq('id', requestId);
    } catch (e) {
      console.error('Update registration status error:', e);
    }
  }

  // If approved, create active student or faculty record
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
        approvalStatus: 'approved'
      };
      await saveStudentToDB(newStudent);

      // Link parent account if details supplied
      if (target.parentName || target.parentPhone) {
        const newParent: ParentRecord = {
          id: `PAR_${Date.now()}`,
          name: target.parentName || `Parent of ${target.name}`,
          email: `parent.${target.email}`,
          phone: target.parentPhone || '',
          childRollNo: newStudent.rollNo,
          childName: newStudent.name,
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
        approvalStatus: 'approved'
      };
      await saveFacultyToDB(newFaculty);
    }
  }
  return true;
}

// -------------------------------------------------------------
// 8. LEAVE REQUESTS SERVICE
// -------------------------------------------------------------
export async function fetchLeavesFromDB(): Promise<LeaveRequest[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('leave_requests').select('*').order('applied_on', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped: LeaveRequest[] = data.map((d: any) => ({
          id: d.id,
          applicantId: d.applicant_id || d.applicantId,
          applicantName: d.applicant_name || d.applicantName,
          applicantRole: d.applicant_role || d.applicantRole,
          studentId: d.student_id || d.studentId,
          startDate: d.start_date || d.startDate,
          endDate: d.end_date || d.endDate,
          leaveType: d.leave_type || d.leaveType,
          reason: d.reason,
          status: d.status as any,
          appliedOn: d.applied_on || d.appliedOn,
          approvedBy: d.approved_by,
          approvedOn: d.approved_on,
          remarks: d.remarks
        }));
        await setCachedData(PREF_KEYS.LEAVES, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Leaves fetch error:', e);
    }
  }
  return getCachedData<LeaveRequest[]>(PREF_KEYS.LEAVES, INITIAL_LEAVES);
}

export async function addLeaveRequestDB(leave: LeaveRequest): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('leave_requests').upsert({
        id: leave.id,
        applicant_id: leave.applicantId,
        applicant_name: leave.applicantName,
        applicant_role: leave.applicantRole,
        student_id: leave.studentId,
        start_date: leave.startDate,
        end_date: leave.endDate,
        leave_type: leave.leaveType,
        reason: leave.reason,
        status: leave.status,
        applied_on: leave.appliedOn
      });
    } catch (e) {
      console.error('Add leave error:', e);
    }
  }
  const cached = await getCachedData<LeaveRequest[]>(PREF_KEYS.LEAVES, []);
  cached.unshift(leave);
  await setCachedData(PREF_KEYS.LEAVES, cached);
  return true;
}

export async function updateLeaveStatusDB(leaveId: string, status: 'approved' | 'rejected', approvedBy: string, remarks?: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  if (supabase) {
    try {
      await supabase.from('leave_requests').update({
        status,
        approved_by: approvedBy,
        approved_on: now,
        remarks: remarks || null
      }).eq('id', leaveId);
    } catch (e) {
      console.error('Update leave status error:', e);
    }
  }
  const cached = await getCachedData<LeaveRequest[]>(PREF_KEYS.LEAVES, []);
  const target = cached.find(l => l.id === leaveId);
  if (target) {
    target.status = status;
    target.approvedBy = approvedBy;
    target.approvedOn = now;
    if (remarks) target.remarks = remarks;
    await setCachedData(PREF_KEYS.LEAVES, cached);
  }
  return true;
}

// -------------------------------------------------------------
// 9. AUDIT LOGS SERVICE
// -------------------------------------------------------------
export async function fetchAuditLogsFromDB(): Promise<AuditLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (!error && data && data.length > 0) {
        const mapped: AuditLog[] = data.map((d: any) => ({
          id: d.id,
          timestamp: d.timestamp,
          userId: d.user_id || d.userId,
          userName: d.user_name || d.userName,
          userRole: d.user_role || d.userRole,
          action: d.action,
          details: d.details
        }));
        await setCachedData(PREF_KEYS.LOGS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Audit logs fetch error:', e);
    }
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
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('audit_logs').insert({
        id: newLog.id,
        timestamp: newLog.timestamp,
        user_id: newLog.userId,
        user_name: newLog.userName,
        user_role: newLog.userRole,
        action: newLog.action,
        details: newLog.details
      });
    } catch (e) {
      console.error('Add audit log error:', e);
    }
  }
  const cached = await getCachedData<AuditLog[]>(PREF_KEYS.LOGS, []);
  cached.unshift(newLog);
  await setCachedData(PREF_KEYS.LOGS, cached.slice(0, 100));
}

// -------------------------------------------------------------
// 10. DELETION SERVICES
// -------------------------------------------------------------
export async function deleteStudentFromDB(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('students').delete().eq('id', id);
    } catch (e) {
      console.error('Delete student error:', e);
    }
  }
  const cached = await getCachedData<Student[]>(PREF_KEYS.STUDENTS, []);
  const updated = cached.filter(s => s.id !== id);
  await setCachedData(PREF_KEYS.STUDENTS, updated);
  return true;
}

export async function deleteFacultyFromDB(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('faculty').delete().eq('id', id);
    } catch (e) {
      console.error('Delete faculty error:', e);
    }
  }
  const cached = await getCachedData<Faculty[]>(PREF_KEYS.FACULTY, []);
  const updated = cached.filter(f => f.id !== id);
  await setCachedData(PREF_KEYS.FACULTY, updated);
  return true;
}

export async function deleteSubjectFromDB(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('subjects').delete().eq('id', id);
    } catch (e) {
      console.error('Delete subject error:', e);
    }
  }
  const cached = await getCachedData<Subject[]>(PREF_KEYS.SUBJECTS, []);
  const updated = cached.filter(s => s.id !== id);
  await setCachedData(PREF_KEYS.SUBJECTS, updated);
  return true;
}

export async function deleteTimetableSlotFromDB(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('timetable').delete().eq('id', id);
    } catch (e) {
      console.error('Delete timetable slot error:', e);
    }
  }
  const cached = await getCachedData<TimetableSlot[]>(PREF_KEYS.TIMETABLE, []);
  const updated = cached.filter(t => t.id !== id);
  await setCachedData(PREF_KEYS.TIMETABLE, updated);
  return true;
}

// -------------------------------------------------------------
// 11. PARENTS & DEPARTMENTS SERVICES
// -------------------------------------------------------------
export async function fetchParentsFromDB(): Promise<ParentRecord[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('parents').select('*').order('name');
      if (!error && data && data.length > 0) {
        const mapped: ParentRecord[] = data.map((d: any) => ({
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
    } catch (e) {
      console.warn('Fetch parents error:', e);
    }
  }
  return getCachedData<ParentRecord[]>(PREF_KEYS.PARENTS, INITIAL_PARENTS);
}

export async function saveParentToDB(parent: ParentRecord): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('parents').upsert({
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        child_roll_no: parent.childRollNo,
        child_name: parent.childName
      });
    } catch (e) {
      console.error('Save parent error:', e);
    }
  }
  const cached = await getCachedData<ParentRecord[]>(PREF_KEYS.PARENTS, []);
  const idx = cached.findIndex(p => p.id === parent.id);
  if (idx >= 0) cached[idx] = parent;
  else cached.unshift(parent);
  await setCachedData(PREF_KEYS.PARENTS, cached);
  return true;
}

export async function deleteParentFromDB(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('parents').delete().eq('id', id);
    } catch (e) {
      console.error('Delete parent error:', e);
    }
  }
  const cached = await getCachedData<ParentRecord[]>(PREF_KEYS.PARENTS, []);
  const updated = cached.filter(p => p.id !== id);
  await setCachedData(PREF_KEYS.PARENTS, updated);
  return true;
}

export async function fetchDepartmentsFromDB(): Promise<Department[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (!error && data && data.length > 0) {
        const mapped: Department[] = data.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          hodName: d.hod_name || d.hodName
        }));
        await setCachedData(PREF_KEYS.DEPARTMENTS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Fetch departments error:', e);
    }
  }
  return getCachedData<Department[]>(PREF_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
}

export async function saveDepartmentToDB(dept: Department): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('departments').upsert({
        id: dept.id,
        code: dept.code,
        name: dept.name,
        hod_name: dept.hodName
      });
    } catch (e) {
      console.error('Save department error:', e);
    }
  }
  const cached = await getCachedData<Department[]>(PREF_KEYS.DEPARTMENTS, []);
  const idx = cached.findIndex(d => d.id === dept.id);
  if (idx >= 0) cached[idx] = dept;
  else cached.unshift(dept);
  await setCachedData(PREF_KEYS.DEPARTMENTS, cached);
  return true;
}

export async function deleteDepartmentFromDB(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('departments').delete().eq('id', id);
    } catch (e) {
      console.error('Delete department error:', e);
    }
  }
  const cached = await getCachedData<Department[]>(PREF_KEYS.DEPARTMENTS, []);
  const updated = cached.filter(d => d.id !== id);
  await setCachedData(PREF_KEYS.DEPARTMENTS, updated);
  return true;
}

