import React, { useState } from 'react';
import {
  Student, Faculty, Subject, TimetableSlot, LeaveRequest, AuditLog
} from '../../types';
import {
  Users, BookOpen, Clock, FileText, FileSpreadsheet, Plus, Upload, Trash2, Smartphone, Shield, CheckCircle
} from 'lucide-react';
import { ReportsManager } from '../reports/ReportsManager';
import { LeaveManager } from '../leaves/LeaveManager';
import { saveStudents, saveFaculty, saveSubjects, saveTimetable, logAuditAction, getCurrentUser } from '../../services/storage';

interface Props {
  students: Student[];
  faculty: Faculty[];
  subjects: Subject[];
  timetable: TimetableSlot[];
  leaves: LeaveRequest[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onDataChanged: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  students,
  faculty,
  subjects,
  timetable,
  leaves,
  activeTab,
  onTabChange,
  onDataChanged
}) => {
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [bulkImportStatus, setBulkImportStatus] = useState<string | null>(null);

  // New Student Form
  const [newRollNo, setNewRollNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newSem, setNewSem] = useState(4);

  // New Faculty Form
  const [newFacCode, setNewFacCode] = useState('');
  const [newFacName, setNewFacName] = useState('');
  const [newFacEmail, setNewFacEmail] = useState('');

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRollNo) return;

    const newStudent: Student = {
      id: `STU_${Date.now()}`,
      rollNo: newRollNo,
      name: newName,
      email: newEmail || `${newRollNo.toLowerCase()}@student.edu`,
      department: newDept,
      semester: Number(newSem),
      section: 'A'
    };

    saveStudents([newStudent, ...students]);
    logAuditAction(getCurrentUser(), 'Student Created', `Added student ${newName} (${newRollNo})`);
    onDataChanged();
    setShowAddStudentModal(false);
    setNewRollNo('');
    setNewName('');
    setNewEmail('');
  };

  const handleCreateFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName || !newFacCode) return;

    const newFac: Faculty = {
      id: `FAC_${Date.now()}`,
      facultyCode: newFacCode,
      name: newFacName,
      email: newFacEmail || `${newFacCode.toLowerCase()}@college.edu`,
      department: 'Computer Science',
      designation: 'Assistant Professor',
      phone: '+1 (555) 000-1122',
      subjectsHandled: []
    };

    saveFaculty([newFac, ...faculty]);
    logAuditAction(getCurrentUser(), 'Faculty Created', `Added faculty ${newFacName} (${newFacCode})`);
    onDataChanged();
    setShowAddFacultyModal(false);
    setNewFacCode('');
    setNewFacName('');
  };

  const handleSimulateBulkUpload = () => {
    setBulkImportStatus('Processing CSV Batch upload...');
    setTimeout(() => {
      setBulkImportStatus('✅ Batch imported 12 Students & 3 Faculty records successfully!');
      setTimeout(() => setBulkImportStatus(null), 3000);
    }, 1000);
  };

  if (activeTab === 'reports') {
    return <ReportsManager students={students} subjects={subjects} />;
  }

  if (activeTab === 'leaves') {
    return <LeaveManager user={getCurrentUser()} onLeaveUpdated={onDataChanged} />;
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-fade-in">
      
      {/* Top Admin Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Students</span>
          <p className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
            {students.length}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Faculty Members</span>
          <p className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
            {faculty.length}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Courses / Subjects</span>
          <p className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
            {subjects.length}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Pending Leaves</span>
          <p className="text-2xl font-extrabold font-heading text-rose-600 dark:text-rose-400 mt-1">
            {leaves.filter(l => l.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Action Controls & Bulk Upload */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>

          <button
            onClick={() => setShowAddFacultyModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Faculty
          </button>
        </div>

        <button
          onClick={handleSimulateBulkUpload}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          Bulk CSV Import
        </button>
      </div>

      {bulkImportStatus && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {bulkImportStatus}
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="p-5 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-xl space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Add New Student</h4>
          <form onSubmit={handleCreateStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Roll No (e.g. 24CS05)"
                value={newRollNo}
                onChange={e => setNewRollNo(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAddFacultyModal && (
        <div className="p-5 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-xl space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Add New Faculty</h4>
          <form onSubmit={handleCreateFaculty} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Faculty Code (e.g. CS-FAC-03)"
                value={newFacCode}
                onChange={e => setNewFacCode(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                required
              />
              <input
                type="text"
                placeholder="Faculty Name"
                value={newFacName}
                onChange={e => setNewFacName(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddFacultyModal(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Faculty
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students Directory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Enrolled Students Master Directory
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Roll No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Semester</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {students.map(st => (
                <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {st.rollNo}
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {st.name}
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">
                    {st.department}
                  </td>
                  <td className="p-3 font-semibold">
                    Sem {st.semester} ({st.section})
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        saveStudents(students.filter(s => s.id !== st.id));
                        onDataChanged();
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
