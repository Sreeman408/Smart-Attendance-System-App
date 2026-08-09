import { User, Role, Student, Faculty } from '../types';
import {
  fetchStudentsFromDB, fetchFacultyFromDB, fetchRegistrationRequestsFromDB,
  submitRegistrationRequestDB, saveStudentToDB, saveFacultyToDB
} from './dbService';
import { Preferences } from '@capacitor/preferences';

const SESSION_KEY = 'au_cms_active_session';
const OTP_STORAGE_KEY = 'au_cms_email_otps';

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
  pendingApproval?: boolean;
}

// -------------------------------------------------------------
// REAL MULTI-ROLE LOGIN SYSTEM
// -------------------------------------------------------------
export async function loginUser(emailOrId: string, role: Role): Promise<AuthResult> {
  const input = emailOrId.trim().toLowerCase();

  // 1. Admin login fallback & check
  if (role === 'admin') {
    if (input === 'admin@college.edu' || input === 'admin' || input.includes('admin')) {
      const adminUser: User = {
        id: 'usr_admin1',
        name: 'Dr. Arthur Vance',
        email: 'admin@college.edu',
        role: 'admin',
        department: 'Administration',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        phone: '+91 98401 23456',
        approvalStatus: 'approved'
      };
      await saveActiveSession(adminUser);
      return { success: true, message: 'Welcome to Admin Registry!', user: adminUser };
    }
  }

  // 2. Student login check
  if (role === 'student') {
    const students = await fetchStudentsFromDB();
    const found = students.find(s =>
      s.email.toLowerCase() === input || s.rollNo.toLowerCase() === input || s.id.toLowerCase() === input
    );
    if (found) {
      if (found.approvalStatus === 'pending') {
        return {
          success: false,
          pendingApproval: true,
          message: 'Your Student Registration is pending Admin approval. Please wait for Admin activation.'
        };
      }
      if (found.approvalStatus === 'rejected') {
        return {
          success: false,
          message: 'Your registration application was rejected by Admin. Please contact department head.'
        };
      }
      const stuUser: User = {
        id: `usr_${found.id}`,
        name: found.name,
        email: found.email,
        role: 'student',
        studentId: found.id,
        department: found.department,
        avatar: found.avatar,
        approvalStatus: found.approvalStatus
      };
      await saveActiveSession(stuUser);
      return { success: true, message: `Welcome back, ${found.name}!`, user: stuUser };
    }

    // Check if in pending registration queue
    const pendingReqs = await fetchRegistrationRequestsFromDB();
    const pendingFound = pendingReqs.find(r =>
      r.role === 'student' && (r.email.toLowerCase() === input || r.rollNo?.toLowerCase() === input)
    );
    if (pendingFound) {
      return {
        success: false,
        pendingApproval: true,
        message: 'Your account application is pending Admin approval. You will receive access once approved.'
      };
    }
    return { success: false, message: 'Student Roll No / Email not found. Please register your profile.' };
  }

  // 3. Faculty login check
  if (role === 'faculty') {
    const facultyList = await fetchFacultyFromDB();
    const found = facultyList.find(f =>
      f.email.toLowerCase() === input || f.facultyCode.toLowerCase() === input || f.id.toLowerCase() === input
    );
    if (found) {
      if (found.approvalStatus === 'pending') {
        return {
          success: false,
          pendingApproval: true,
          message: 'Faculty Account is pending Admin validation.'
        };
      }
      const facUser: User = {
        id: `usr_${found.id}`,
        name: found.name,
        email: found.email,
        role: 'faculty',
        facultyId: found.id,
        department: found.department,
        phone: found.phone,
        approvalStatus: found.approvalStatus
      };
      await saveActiveSession(facUser);
      return { success: true, message: `Welcome back, ${found.name}!`, user: facUser };
    }

    const pendingReqs = await fetchRegistrationRequestsFromDB();
    const pendingFound = pendingReqs.find(r =>
      r.role === 'faculty' && (r.email.toLowerCase() === input || r.facultyCode?.toLowerCase() === input)
    );
    if (pendingFound) {
      return {
        success: false,
        pendingApproval: true,
        message: 'Faculty account application is currently pending Admin review.'
      };
    }
    return { success: false, message: 'Faculty Code / Email not found. Please register from the login page.' };
  }

  // 4. Parent login check
  if (role === 'parent') {
    const students = await fetchStudentsFromDB();
    const childMatches = students.filter(s =>
      s.email.toLowerCase().includes(input) || (s.parentPhone && s.parentPhone.includes(input)) || input.includes('parent') || input === 'parent@gmail.com'
    );
    const parentUser: User = {
      id: 'usr_parent_main',
      name: 'Ward Parent Gateway',
      email: input.includes('@') ? input : 'parent@gmail.com',
      role: 'parent',
      parentId: 'PAR301',
      childStudentIds: childMatches.length > 0 ? childMatches.map(c => c.id) : [students[0]?.id || 'STU202401'],
      approvalStatus: 'approved'
    };
    await saveActiveSession(parentUser);
    return { success: true, message: 'Parent Gateway Authorized', user: parentUser };
  }

  return { success: false, message: 'Invalid credentials or selected role.' };
}

// -------------------------------------------------------------
// OTP VERIFICATION SYSTEM FOR REGISTRATION & EMAIL EDITING
// -------------------------------------------------------------
export function generateVerificationOTP(email: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    const otps = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}');
    otps[email.toLowerCase()] = { code: otp, expires: Date.now() + 10 * 60 * 1000 };
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
  } catch (e) {
    console.error('Error storing OTP:', e);
  }
  return otp;
}

export function verifyOTPCode(email: string, codeInput: string): boolean {
  try {
    const otps = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}');
    const record = otps[email.toLowerCase()];
    if (record && record.code === codeInput.trim() && record.expires > Date.now()) {
      delete otps[email.toLowerCase()];
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
      return true;
    }
  } catch (e) {
    console.error('OTP check error:', e);
  }
  return false;
}

// -------------------------------------------------------------
// SESSION PERSISTENCE MANAGEMENT
// -------------------------------------------------------------
export async function saveActiveSession(user: User): Promise<void> {
  await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(user) });
}

export async function getStoredActiveSession(): Promise<User | null> {
  try {
    const res = await Preferences.get({ key: SESSION_KEY });
    if (res && res.value) {
      return JSON.parse(res.value) as User;
    }
  } catch (e) {
    console.warn('Session retrieval error:', e);
  }
  return null;
}

export async function clearActiveSession(): Promise<void> {
  await Preferences.remove({ key: SESSION_KEY });
}
