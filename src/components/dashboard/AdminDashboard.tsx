import React, { useState, useEffect } from 'react';
import { Student, Faculty, Subject, TimetableSlot, LeaveRequest, ParentRecord, Department } from '../../types';
import {
  Users, BookOpen, Clock, FileText, Plus, Upload, Trash2, Shield, Calendar, UserCheck,
  Building, Edit, Search, AlertTriangle, Download, CheckCircle2, RefreshCw, BarChart2, PieChart as PieChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ReportsManager } from '../reports/ReportsManager';
import { LeaveManager } from '../leaves/LeaveManager';
import { PendingApprovalsManager } from '../admin/PendingApprovalsManager';
import { SaturdayConfigManager } from '../admin/SaturdayConfigManager';
import { BulkUploadModal } from '../admin/BulkUploadModal';
import {
  saveStudentToDB, deleteStudentFromDB,
  saveFacultyToDB, deleteFacultyFromDB,
  saveSubjectToDB, deleteSubjectFromDB,
  saveTimetableSlotToDB, deleteTimetableSlotFromDB,
  fetchParentsFromDB, saveParentToDB, deleteParentFromDB,
  fetchDepartmentsFromDB, saveDepartmentToDB, deleteDepartmentFromDB,
  fetchAttendanceRecordsFromDB
} from '../../services/dbService';
import { calculateOverallAttendance } from '../../utils/attendance';
import * as XLSX from 'xlsx';

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
  const [subSection, setSubSection] = useState<'overview' | 'directory' | 'crud' | 'approvals' | 'saturday'>('overview');
  const [crudTab, setCrudTab] = useState<'subjects' | 'faculty' | 'students' | 'parents' | 'timetable' | 'departments'>('subjects');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShortageOnly, setFilterShortageOnly] = useState(false);

  // DB Extra entities
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  // Modals state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form Fields
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadExtraAdminData();
  }, []);

  const loadExtraAdminData = async () => {
    const pars = await fetchParentsFromDB();
    const depts = await fetchDepartmentsFromDB();
    const atts = await fetchAttendanceRecordsFromDB();
    setParents(pars);
    setDepartments(depts);
    setAttendanceList(atts);
  };

  // Calculate Student Attendance Stats for Analytics
  const studentStats = students.map(st => {
    const stAtts = attendanceList.filter(a => a.studentId === st.id);
    const summary = calculateOverallAttendance(stAtts, subjects);
    return {
      student: st,
      summary
    };
  });

  const safeCount = studentStats.filter(s => s.summary.percentage >= 85).length;
  const avgCount = studentStats.filter(s => s.summary.percentage >= 75 && s.summary.percentage < 85).length;
  const shortageCount = studentStats.filter(s => s.summary.percentage < 75).length;

  const pieData = [
    { name: 'Safe (>=85%)', value: safeCount, color: '#10b981' },
    { name: 'Average (75-84%)', value: avgCount, color: '#f59e0b' },
    { name: 'Shortage Risk (<75%)', value: shortageCount, color: '#f43f5e' }
  ];

  const barData = subjects.map(sub => {
    const subAtts = attendanceList.filter(a => a.subjectId === sub.id);
    const presentCount = subAtts.filter(a => a.status === 'present').length;
    const totalCount = subAtts.length || 1;
    const avgPct = Math.round((presentCount / totalCount) * 100);
    return {
      subject: sub.code,
      attendance: avgPct
    };
  });

  // Export Overall System Summary
  const handleExportSystemSummary = (type: 'csv' | 'xlsx') => {
    const data = studentStats.map(s => ({
      'Roll Number': s.student.rollNo,
      'Student Name': s.student.name,
      'Department': s.student.department,
      'Year / Semester': `${s.student.year} (Sem ${s.student.semester})`,
      'Total Classes Conducted': s.summary.totalClassesConducted,
      'Total Classes Attended': s.summary.totalClassesAttended,
      'Overall Attendance %': `${s.summary.percentage}%`,
      'Risk Status': s.summary.status
    }));

    if (type === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Annamalai_Overall_System_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'System Attendance Summary');
      XLSX.writeFile(wb, `Annamalai_Overall_System_Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  // CRUD Handlers
  const handleSaveEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (crudTab === 'subjects') {
      const sub: Subject = {
        id: editingItem?.id || `SUB_${Date.now()}`,
        code: formData.code || 'CS501',
        name: formData.name || 'New Subject',
        department: formData.department || 'Computer Science',
        semester: Number(formData.semester || 4),
        type: formData.type || 'Lecture',
        credits: Number(formData.credits || 3),
        facultyId: formData.facultyId || faculty[0]?.id || 'FAC101',
        facultyName: faculty.find(f => f.id === formData.facultyId)?.name || 'Prof. Robert Langdon'
      };
      await saveSubjectToDB(sub);
    } else if (crudTab === 'faculty') {
      const fac: Faculty = {
        id: editingItem?.id || `FAC_${Date.now()}`,
        facultyCode: formData.facultyCode || `FAC-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name || 'New Faculty',
        email: formData.email || 'faculty@college.edu',
        department: formData.department || 'Computer Science',
        designation: formData.designation || 'Assistant Professor',
        phone: formData.phone || '+1 555-0192',
        subjectsHandled: [],
        approvalStatus: 'approved'
      };
      await saveFacultyToDB(fac);
    } else if (crudTab === 'students') {
      const stu: Student = {
        id: editingItem?.id || `STU_${Date.now()}`,
        rollNo: formData.rollNo || '24CS05',
        name: formData.name || 'New Student',
        email: formData.email || 'student@student.edu',
        department: formData.department || 'Computer Science',
        year: formData.year || '2nd Year',
        semester: Number(formData.semester || 4),
        section: formData.section || 'A',
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        approvalStatus: 'approved'
      };
      await saveStudentToDB(stu);
    } else if (crudTab === 'parents') {
      const par: ParentRecord = {
        id: editingItem?.id || `PAR_${Date.now()}`,
        name: formData.name || 'New Parent',
        email: formData.email || 'parent@gmail.com',
        phone: formData.phone || '+1 555-0199',
        childRollNo: formData.childRollNo || '24CS01',
        childName: formData.childName || 'Rahul Sharma'
      };
      await saveParentToDB(par);
    } else if (crudTab === 'timetable') {
      const tt: TimetableSlot = {
        id: editingItem?.id || `SLOT_${Date.now()}`,
        dayOfWeek: formData.dayOfWeek || 'Monday',
        timeSlot: formData.timeSlot || '09:00 AM - 10:00 AM',
        subjectId: formData.subjectId || subjects[0]?.id || 'SUB101',
        subjectName: subjects.find(s => s.id === formData.subjectId)?.name || 'Data Structures',
        subjectCode: subjects.find(s => s.id === formData.subjectId)?.code || 'CS401',
        subjectType: subjects.find(s => s.id === formData.subjectId)?.type || 'Lecture',
        facultyId: formData.facultyId || faculty[0]?.id || 'FAC101',
        facultyName: faculty.find(f => f.id === formData.facultyId)?.name || 'Prof. Robert Langdon',
        roomNo: formData.roomNo || 'LH-201',
        department: formData.department || 'Computer Science',
        semester: Number(formData.semester || 4),
        section: formData.section || 'A'
      };
      await saveTimetableSlotToDB(tt);
    } else if (crudTab === 'departments') {
      const dept: Department = {
        id: editingItem?.id || `DEP_${Date.now()}`,
        code: formData.code || 'IT',
        name: formData.name || 'Information Technology',
        hodName: formData.hodName || 'Dr. Arthur Vance'
      };
      await saveDepartmentToDB(dept);
    }

    setModalMode(null);
    setEditingItem(null);
    setFormData({});
    await loadExtraAdminData();
    onDataChanged();
  };

  const handleDeleteEntity = async (type: string, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} record?`)) return;
    if (type === 'subject') await deleteSubjectFromDB(id);
    else if (type === 'faculty') await deleteFacultyFromDB(id);
    else if (type === 'student') await deleteStudentFromDB(id);
    else if (type === 'parent') await deleteParentFromDB(id);
    else if (type === 'timetable') await deleteTimetableSlotFromDB(id);
    else if (type === 'department') await deleteDepartmentFromDB(id);

    await loadExtraAdminData();
    onDataChanged();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({});
    setModalMode('add');
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalMode('edit');
  };

  if (activeTab === 'reports') return <ReportsManager students={students} subjects={subjects} />;
  if (activeTab === 'leaves') return <LeaveManager user={{ id: 'admin', name: 'Admin', role: 'admin', email: 'admin@college.edu' }} onLeaveUpdated={onDataChanged} />;
  if (activeTab === 'approvals') return <PendingApprovalsManager />;
  if (activeTab === 'saturday') return <SaturdayConfigManager />;
  if (activeTab === 'bulk') return <BulkUploadModal isOpen={true} onClose={() => onTabChange('dashboard')} onSuccess={onDataChanged} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      
      {/* Admin Top Sub-Section Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSubSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            subSection === 'overview'
              ? 'bg-gradient-to-r from-red-900 via-red-800 to-amber-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          Analytics & Overview
        </button>

        <button
          onClick={() => setSubSection('crud')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            subSection === 'crud'
              ? 'bg-gradient-to-r from-red-900 via-red-800 to-amber-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Full Admin Management (CRUD)
        </button>

        <button
          onClick={() => setSubSection('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            subSection === 'approvals'
              ? 'bg-gradient-to-r from-red-900 via-red-800 to-amber-600 text-white shadow-md'
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
              ? 'bg-gradient-to-r from-red-900 via-red-800 to-amber-600 text-white shadow-md'
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

      {/* RENDER SUBSECTION: OVERVIEW & RECHARTS */}
      {subSection === 'overview' && (
        <div className="space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Enrolled Students</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{students.length}</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Faculty Roster</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{faculty.length}</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Subjects & Labs</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{subjects.length}</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Shortage Risk Students</span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{shortageCount}</p>
            </div>
          </div>

          {/* Global Dashboard Recharts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pie Chart: Overall Student Attendance Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-amber-500" />
                Overall Attendance Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} Students`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Subject Average Attendance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-500" />
                Subject Average Attendance %
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <Tooltip formatter={(val) => [`${val}%`, 'Avg Attendance']} />
                    <Bar dataKey="attendance" fill="#d97706" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Attendance Shortage Filter Banner & Export Control */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterShortageOnly(!filterShortageOnly)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                  filterShortageOnly
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                {filterShortageOnly ? 'Showing Shortage Risk (<75%)' : 'Filter Shortage Risk Students (<75%)'}
              </button>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportSystemSummary('csv')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                Export CSV
              </button>

              <button
                onClick={() => handleExportSystemSummary('xlsx')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Student Roster Table with Shortage Alert Badges */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Student Directory & Attendance Performance
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Year / Sem</th>
                    <th className="p-3">Attendance %</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentStats
                    .filter(s => {
                      if (filterShortageOnly && s.summary.percentage >= 75) return false;
                      if (searchQuery && !s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                      return true;
                    })
                    .map(({ student: st, summary }) => (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{st.rollNo}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                        <td className="p-3 text-slate-500">{st.department}</td>
                        <td className="p-3 font-semibold">{st.year || '2nd Year'} (Sem {st.semester})</td>
                        <td className="p-3 font-extrabold">{summary.percentage}%</td>
                        <td className="p-3 text-right">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                            summary.percentage < 75
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                              : summary.percentage < 85
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {summary.status === 'Shortage' ? '🚨 Shortage Risk' : summary.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* RENDER SUBSECTION: FULL CRUD MANAGEMENT */}
      {subSection === 'crud' && (
        <div className="space-y-5">
          
          {/* CRUD Entity Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
            {(['subjects', 'faculty', 'students', 'parents', 'timetable', 'departments'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setCrudTab(tab); setModalMode(null); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  crudTab === tab
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}

            <button
              onClick={openAddModal}
              className="ml-auto px-3.5 py-1.5 bg-gradient-to-r from-red-900 to-amber-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add {crudTab.slice(0, -1)}
            </button>
          </div>

          {/* Add / Edit Form Modal Inline Container */}
          {modalMode && (
            <div className="p-5 bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-xl space-y-4 animate-fade-in">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {modalMode} {crudTab.slice(0, -1)} Record
              </h4>
              <form onSubmit={handleSaveEntity} className="space-y-3">
                
                {crudTab === 'subjects' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Code (e.g. CS401)"
                      value={formData.code || ''}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Subject Name"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <select
                      value={formData.type || 'Lecture'}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="Lecture">Lecture</option>
                      <option value="Practical">Practical (Lab)</option>
                    </select>
                  </div>
                )}

                {crudTab === 'faculty' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Faculty Code (e.g. FAC103)"
                      value={formData.facultyCode || ''}
                      onChange={e => setFormData({ ...formData, facultyCode: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {crudTab === 'students' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Roll No (e.g. 24CS05)"
                      value={formData.rollNo || ''}
                      onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Student Name"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {crudTab === 'parents' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Parent Name"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Child Roll No (e.g. 24CS01)"
                      value={formData.childRollNo || ''}
                      onChange={e => setFormData({ ...formData, childRollNo: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {crudTab === 'timetable' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={formData.dayOfWeek || 'Monday'}
                      onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Time Slot (e.g. 09:00 AM - 10:00 AM)"
                      value={formData.timeSlot || ''}
                      onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Room No (e.g. LH-201)"
                      value={formData.roomNo || ''}
                      onChange={e => setFormData({ ...formData, roomNo: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {crudTab === 'departments' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Dept Code (e.g. CSE)"
                      value={formData.code || ''}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Department Name"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="HOD Name"
                      value={formData.hodName || ''}
                      onChange={e => setFormData({ ...formData, hodName: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setModalMode(null)} className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-sm">Save Record</button>
                </div>
              </form>
            </div>
          )}

          {/* CRUD Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center justify-between">
              <span>{crudTab} Directory ({crudTab === 'subjects' ? subjects.length : crudTab === 'faculty' ? faculty.length : crudTab === 'students' ? students.length : crudTab === 'parents' ? parents.length : crudTab === 'timetable' ? timetable.length : departments.length})</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">ID / Code</th>
                    <th className="p-3">Name / Details</th>
                    <th className="p-3">Info</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {crudTab === 'subjects' && subjects.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{sub.code}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{sub.name}</td>
                      <td className="p-3 text-slate-500">{sub.type} • {sub.credits} Credits</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => openEditModal(sub)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteEntity('subject', sub.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'faculty' && faculty.map(fac => (
                    <tr key={fac.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{fac.facultyCode}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{fac.name}</td>
                      <td className="p-3 text-slate-500">{fac.department} • {fac.designation}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => openEditModal(fac)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteEntity('faculty', fac.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'students' && students.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{st.rollNo}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="p-3 text-slate-500">{st.department} • {st.year}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => openEditModal(st)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteEntity('student', st.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'parents' && parents.map(par => (
                    <tr key={par.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{par.childRollNo}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{par.name}</td>
                      <td className="p-3 text-slate-500">{par.email} • {par.phone}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => openEditModal(par)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteEntity('parent', par.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'timetable' && timetable.map(tt => (
                    <tr key={tt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{tt.dayOfWeek}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{tt.subjectCode} - {tt.subjectName}</td>
                      <td className="p-3 text-slate-500">{tt.timeSlot} ({tt.roomNo})</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => openEditModal(tt)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteEntity('timetable', tt.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'departments' && departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{dept.code}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{dept.name}</td>
                      <td className="p-3 text-slate-500">HOD: {dept.hodName || 'Dr. Arthur Vance'}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => openEditModal(dept)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteEntity('department', dept.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
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
