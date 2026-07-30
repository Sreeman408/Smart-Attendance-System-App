import React, { useState, useEffect } from 'react';
import { Role } from './types';
import {
  initLocalStorage,
  subscribeToStore,
  getCurrentUser,
  getStudents,
  getFaculty,
  getSubjects,
  getTimetable,
  getAttendanceRecords,
  getLeaves
} from './services/storage';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { FacultyDashboard } from './components/dashboard/FacultyDashboard';
import { ParentDashboard } from './components/dashboard/ParentDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';

export default function App() {
  // Initialize seed state
  useEffect(() => {
    initLocalStorage();
  }, []);

  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [activeRole, setActiveRole] = useState<Role>(currentUser.role || 'student');
  const [activeTab, setActiveTab] = useState<string>('calendar');

  // Store data states
  const [students, setStudents] = useState(getStudents());
  const [faculty, setFaculty] = useState(getFaculty());
  const [subjects, setSubjects] = useState(getSubjects());
  const [timetable, setTimetable] = useState(getTimetable());
  const [attendanceRecords, setAttendanceRecords] = useState(getAttendanceRecords());
  const [leaves, setLeaves] = useState(getLeaves());

  // Parent child selector state
  const [selectedChildId, setSelectedChildId] = useState<string>(
    students[0]?.id || 'STU202401'
  );

  // Subscribe to store updates
  useEffect(() => {
    return subscribeToStore(() => {
      const user = getCurrentUser();
      setCurrentUser(user);
      setStudents(getStudents());
      setFaculty(getFaculty());
      setSubjects(getSubjects());
      setTimetable(getTimetable());
      setAttendanceRecords(getAttendanceRecords());
      setLeaves(getLeaves());
    });
  }, []);

  const refreshData = () => {
    setStudents(getStudents());
    setFaculty(getFaculty());
    setSubjects(getSubjects());
    setTimetable(getTimetable());
    setAttendanceRecords(getAttendanceRecords());
    setLeaves(getLeaves());
  };

  const handleRoleChange = (newRole: Role) => {
    setActiveRole(newRole);
    // Set appropriate default tab per role
    switch (newRole) {
      case 'student': setActiveTab('calendar'); break;
      case 'faculty': setActiveTab('dashboard'); break;
      case 'parent': setActiveTab('calendar'); break;
      case 'admin': setActiveTab('dashboard'); break;
    }
  };

  const currentStudent = students.find(s => s.id === (currentUser.studentId || 'STU202401')) || students[0];
  const currentFaculty = faculty.find(f => f.id === (currentUser.facultyId || 'FAC101')) || faculty[0];
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      
      {/* App Header Bar */}
      <Header
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {/* Body Layout: Desktop Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto pb-20 md:pb-6">
        
        {/* Navigation (Bottom Bar on Mobile, Sidebar on Desktop) */}
        <BottomNav
          activeRole={activeRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingLeavesCount={pendingLeavesCount}
        />

        {/* Primary Content View */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          
          {activeRole === 'student' && currentStudent && (
            <StudentDashboard
              student={currentStudent}
              subjects={subjects}
              attendanceRecords={attendanceRecords}
              timetable={timetable}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}

          {activeRole === 'faculty' && currentFaculty && (
            <FacultyDashboard
              faculty={currentFaculty}
              subjects={subjects}
              students={students}
              timetable={timetable}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}

          {activeRole === 'parent' && (
            <ParentDashboard
              parentUser={currentUser}
              students={students}
              subjects={subjects}
              faculty={faculty}
              attendanceRecords={attendanceRecords}
              selectedChildId={selectedChildId}
              onSelectChild={setSelectedChildId}
              activeTab={activeTab}
            />
          )}

          {activeRole === 'admin' && (
            <AdminDashboard
              students={students}
              faculty={faculty}
              subjects={subjects}
              timetable={timetable}
              leaves={leaves}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onDataChanged={refreshData}
            />
          )}

        </main>
      </div>

    </div>
  );
}
