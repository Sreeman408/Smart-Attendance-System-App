import React, { useState, useEffect, useMemo } from 'react';
import { Role, User, Student, Faculty, Subject, TimetableSlot, AttendanceRecord, LeaveRequest, RegistrationRequest, ParentRecord } from './types';
import { getStoredActiveSession, clearActiveSession } from './services/authService';
import {
  fetchStudentsFromDB, fetchFacultyFromDB, fetchSubjectsFromDB,
  fetchTimetableFromDB, fetchAttendanceRecordsFromDB, fetchLeavesFromDB,
  fetchRegistrationRequestsFromDB, fetchParentsFromDB, fetchAdminProfileFromDB
} from './services/dbService';
import { LoginGateway } from './components/auth/LoginGateway';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { FacultyDashboard } from './components/dashboard/FacultyDashboard';
import { ParentDashboard } from './components/dashboard/ParentDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<Role>('student');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loadingSession, setLoadingSession] = useState(true);

  // DB States
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Load session & DB data on mount
  useEffect(() => {
    async function loadInitialData() {
      setLoadingSession(true);
      const session = await getStoredActiveSession();
      if (session) {
        if (session.role === 'admin') {
          try {
            const adminProf = await fetchAdminProfileFromDB();
            if (adminProf.name) {
              session.name = adminProf.name;
            }
          } catch (e) {}
        }
        setCurrentUser(session);
        setActiveRole(session.role);
        setDefaultTabForRole(session.role);
      }
      await refreshDBData();
      setLoadingSession(false);
    }
    loadInitialData();
  }, []);

  const refreshDBData = async () => {
    const stus = await fetchStudentsFromDB();
    const facs = await fetchFacultyFromDB();
    const subs = await fetchSubjectsFromDB();
    const tt = await fetchTimetableFromDB();
    const atts = await fetchAttendanceRecordsFromDB();
    const lvs = await fetchLeavesFromDB();
    const regs = await fetchRegistrationRequestsFromDB();
    const pars = await fetchParentsFromDB();

    setStudents(stus);
    setFaculty(facs);
    setSubjects(subs);
    setTimetable(tt);
    setAttendanceRecords(atts);
    setLeaves(lvs);
    setRegistrations(regs);
    setParents(pars);
  };

  const setDefaultTabForRole = (role: Role) => {
    switch (role) {
      case 'student': setActiveTab('dashboard'); break;
      case 'faculty': setActiveTab('dashboard'); break;
      case 'parent': setActiveTab('dashboard'); break;
      case 'admin': setActiveTab('dashboard'); break;
    }
  };

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    setDefaultTabForRole(user.role);
    await refreshDBData();
  };

  const handleLogout = async () => {
    await clearActiveSession();
    setCurrentUser(null);
  };

  const handleRoleChange = (newRole: Role) => {
    // Lock role strictly to assigned user role unless user is Admin
    if (currentUser?.role !== 'admin') return;
    setActiveRole(newRole);
    setDefaultTabForRole(newRole);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-wider text-amber-400">Loading Smart Attendance CMS...</p>
      </div>
    );
  }

  // Render Login Gateway if unauthenticated
  if (!currentUser) {
    return <LoginGateway onLoginSuccess={handleLoginSuccess} />;
  }

  const currentStudent = students.find(s => s.id === currentUser.studentId);
  const currentFaculty = faculty.find(f => f.id === currentUser.facultyId) || faculty[0];
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;
  const pendingApprovalsCount = registrations.filter(r => r.status === 'pending').length;

  // Security Check: If non-admin user somehow gets mismatched activeRole, force back to currentUser.role
  const effectiveRole = currentUser.role === 'admin' ? activeRole : currentUser.role;

  // Resolve linked students strictly for the logged-in parent
  const linkedStudents = useMemo(() => {
    if (!currentUser || effectiveRole !== 'parent') return [];
    const parentMatch = parents.find(p =>
      (currentUser.parentId && p.id === currentUser.parentId) ||
      p.id === currentUser.id ||
      (currentUser.email && p.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.phone && p.phone && (p.phone === currentUser.phone || currentUser.phone.includes(p.phone) || p.phone.includes(currentUser.phone)))
    );

    const childRolls: string[] = [];
    if (parentMatch) {
      if (Array.isArray(parentMatch.childRollNos)) {
        childRolls.push(...parentMatch.childRollNos.map(r => r.toLowerCase()));
      }
      if (parentMatch.childRollNo) {
        childRolls.push(parentMatch.childRollNo.toLowerCase());
      }
    }

    return students.filter(s => {
      if (currentUser.childStudentIds && currentUser.childStudentIds.includes(s.id)) return true;
      if (childRolls.includes(s.rollNo.toLowerCase()) || childRolls.includes(s.id.toLowerCase())) return true;
      if (parentMatch && s.parentId && s.parentId === parentMatch.id) return true;
      if (parentMatch && parentMatch.phone && s.parentPhone && s.parentPhone.includes(parentMatch.phone)) return true;
      return false;
    });
  }, [currentUser, effectiveRole, parents, students]);

  // Keep selectedChildId synchronized with linked students
  useEffect(() => {
    if (effectiveRole === 'parent') {
      if (linkedStudents.length > 0) {
        if (!selectedChildId || !linkedStudents.some(s => s.id === selectedChildId)) {
          setSelectedChildId(linkedStudents[0].id);
        }
      } else {
        setSelectedChildId('');
      }
    } else if (students.length > 0 && !selectedChildId) {
      setSelectedChildId(students[0].id);
    }
  }, [effectiveRole, linkedStudents, selectedChildId, students]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-amber-500 selection:text-slate-950">
      
      {/* App Header Bar */}
      <Header
        activeRole={effectiveRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        onUserUpdated={setCurrentUser}
        onLogout={handleLogout}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
        studentsList={effectiveRole === 'parent' ? linkedStudents : students}
      />

      {/* Body Layout: Desktop Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto pb-20 md:pb-6">
        
        {/* Navigation (Bottom Bar on Mobile, Sidebar on Desktop) */}
        <BottomNav
          activeRole={effectiveRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingLeavesCount={pendingLeavesCount}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* Primary Content View */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          
          {effectiveRole === 'student' && (
            currentStudent ? (
              <StudentDashboard
                student={currentStudent}
                subjects={subjects}
                attendanceRecords={attendanceRecords}
                timetable={timetable}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Profile Pending Approval</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your student registration is being reviewed by the Admin. Once approved, your profile and attendance will display here.
                </p>
              </div>
            )
          )}

          {effectiveRole === 'faculty' && currentFaculty && (
            <FacultyDashboard
              faculty={currentFaculty}
              subjects={subjects}
              students={students}
              timetable={timetable}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}

          {effectiveRole === 'parent' && (
            <ParentDashboard
              parentUser={currentUser}
              students={linkedStudents}
              subjects={subjects}
              faculty={faculty}
              attendanceRecords={attendanceRecords}
              selectedChildId={selectedChildId}
              onSelectChild={setSelectedChildId}
              activeTab={activeTab}
              timetable={timetable}
            />
          )}

          {effectiveRole === 'admin' && (
            <AdminDashboard
              students={students}
              faculty={faculty}
              subjects={subjects}
              timetable={timetable}
              leaves={leaves}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onDataChanged={refreshDBData}
            />
          )}

        </main>
      </div>

    </div>
  );
}
