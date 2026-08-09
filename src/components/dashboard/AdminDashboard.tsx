import React, { useState } from 'react';
import { Student, Faculty, Subject, TimetableSlot, LeaveRequest, AuditLog } from '../../types';
import { Users, BookOpen, Clock, FileText, FileSpreadsheet, Plus, Upload, Trash2, Shield, Calendar, UserCheck, CheckCircle2 } from 'lucide-react';
import { ReportsManager } from '../reports/ReportsManager';
import { LeaveManager } from '../leaves/LeaveManager';
import { PendingApprovalsManager } from '../admin/PendingApprovalsManager';
import { SaturdayConfigManager } from '../admin/SaturdayConfigManager';
import { BulkUploadModal } from '../admin/BulkUploadModal';
import { saveStudentToDB, saveFacultyToDB } from '../../services/dbService';

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
  const [subSection, setSubSection] = useState<'overview' | 'approvals' | 'saturday'>('overview');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);

  // New Student state
  const [stuRoll, setStuRoll] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuDept, setStuDept] = useState('Computer Science');
  const [stuYear, setStuYear] = useState('2nd Year');
  const [stuSem, setStuSem] = useState(4);

  // New Faculty state
  const [facCode, setFacCode] = useState('');
  const [facName, setFacName] = useState('');
  const [facEmail, setFacEmail] = useState('');

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stuRoll || !stuName) return;
    const newStu: Student = {
      id: `STU_${Date.now()}`,
      rollNo: stuRoll,
      name: stuName,
      email: stuEmail || `${stuRoll.toLowerCase()}@student.edu`,
      department: stuDept,
      year: stuYear,
      semester: Number(stuSem),
      section: 'A',
      approvalStatus: 'approved'
    };
    await saveStudentToDB(newStu);
    setShowAddStudent(false);
    onDataChanged();
    setStuRoll('');
    setStuName('');
    setStuEmail('');
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facCode || !facName) return;
    const newFac: Faculty = {
      id: `FAC_${Date.now()}`,
      facultyCode: facCode,
      name: facName,
      email: facEmail || `${facCode.toLowerCase()}@college.edu`,
      department: 'Computer Science',
      designation: 'Assistant Professor',
      phone: '+91 98401 11223',
      subjectsHandled: [],
      approvalStatus: 'approved'
    };
    await saveFacultyToDB(newFac);
    setShowAddFaculty(false);
    onDataChanged();
    setFacCode('');
    setFacName('');
    setFacEmail('');
  };

  if (activeTab === 'reports') {
    return <ReportsManager students={students} subjects={subjects} />;
  }

  if (activeTab === 'leaves') {
    return <LeaveManager user={{ id: 'admin', name: 'Admin', role: 'admin', email: 'admin@college.edu' }} onLeaveUpdated={onDataChanged} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      
      {/* Admin Section Tabs Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSubSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            subSection === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          Dashboard Overview
        </button>

        <button
          onClick={() => setSubSection('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            subSection === 'approvals'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Pending Registration Approvals
        </button>

        <button
          onClick={() => setSubSection('saturday')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            subSection === 'saturday'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Saturday Classes Schedule
        </button>

        <button
          onClick={() => setShowBulkUpload(true)}
          className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          Bulk Batch Upload
        </button>
      </div>

      {/* RENDER SUBSECTION: PENDING APPROVALS */}
      {subSection === 'approvals' && <PendingApprovalsManager />}

      {/* RENDER SUBSECTION: SATURDAY CONFIG */}
      {subSection === 'saturday' && <SaturdayConfigManager />}

      {/* RENDER SUBSECTION: OVERVIEW */}
      {subSection === 'overview' && (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {students.length}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Faculty Roster</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {faculty.length}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Subjects / Labs</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {subjects.length}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Pending Leaves</span>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {leaves.filter(l => l.status === 'pending').length}
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddStudent(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-red-900 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>

              <button
                onClick={() => setShowAddFaculty(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Faculty
              </button>
            </div>
          </div>

          {/* Add Student Modal Popup */}
          {showAddStudent && (
            <div className="p-5 bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Add New Student Profile</h4>
              <form onSubmit={handleAddStudent} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Roll No (e.g. 24CS06)"
                    value={stuRoll}
                    onChange={e => setStuRoll(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={stuName}
                    onChange={e => setStuName(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={stuEmail}
                    onChange={e => setStuEmail(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAddStudent(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md">Save Student</button>
                </div>
              </form>
            </div>
          )}

          {/* Add Faculty Modal Popup */}
          {showAddFaculty && (
            <div className="p-5 bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Add New Faculty Member</h4>
              <form onSubmit={handleAddFaculty} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Faculty Code (e.g. CS-FAC-05)"
                    value={facCode}
                    onChange={e => setFacCode(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Faculty Name"
                    value={facName}
                    onChange={e => setFacName(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={facEmail}
                    onChange={e => setFacEmail(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAddFaculty(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md">Save Faculty</button>
                </div>
              </form>
            </div>
          )}

          {/* Student Roster Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Active Student Directory
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Year / Sem</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{st.rollNo}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="p-3 text-slate-500">{st.department}</td>
                      <td className="p-3 font-semibold">{st.year || '2nd Year'} (Sem {st.semester})</td>
                      <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {st.approvalStatus ? st.approvalStatus.toUpperCase() : 'APPROVED'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={onDataChanged}
      />

    </div>
  );
};
