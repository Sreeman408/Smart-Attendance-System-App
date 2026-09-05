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
  fetchAttendanceRecordsFromDB,
  DeleteResult
} from '../../services/dbService';
import { calculateOverallAttendance } from '../../utils/attendance';
import { sortStudentsByRollNumber } from '../../utils/sortingUtils';
import { hashPassword } from '../../utils/cryptoUtils';
import * as XLSX from 'xlsx';

interface Props {
  students: Student[];
  faculty: Faculty[];
  subjects: Subject[];
  timetable: TimetableSlot[];
  leaves: LeaveRequest[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onDataChanged: () => void | Promise<void>;
}

export const AdminDashboard: React.FC<Props> = ({
  students = [],
  faculty = [],
  subjects = [],
  timetable = [],
  leaves = [],
  activeTab = 'dashboard',
  onTabChange,
  onDataChanged
}) => {
  const [subSection, setSubSection] = useState<'overview' | 'directory' | 'crud' | 'approvals' | 'saturday'>('overview');
  const [crudTab, setCrudTab] = useState<'subjects' | 'faculty' | 'students' | 'parents' | 'timetable' | 'departments'>('subjects');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShortageOnly, setFilterShortageOnly] = useState(false);
  const [directoryTab, setDirectoryTab] = useState<'students' | 'faculty' | 'parents' | 'subjects'>('students');

  // DB Extra entities
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  // Modals state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form Fields
  const [formData, setFormData] = useState<any>({});

  // Deletion Confirmation & Action Feedback
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'student' | 'faculty' | 'subject' | 'parent' | 'timetable' | 'department';
    id: string;
    title: string;
    subtitle?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  useEffect(() => {
    loadExtraAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'crud') {
      setSubSection('crud');
    } else if (activeTab === 'timetable') {
      setSubSection('crud');
      setCrudTab('timetable');
    } else if (activeTab === 'directory' || activeTab === 'dashboard') {
      setSubSection('overview');
    }
  }, [activeTab]);

  const loadExtraAdminData = async () => {
    try {
      const [pars, depts, atts] = await Promise.all([
        fetchParentsFromDB().catch(e => { console.warn('Parents load error:', e); return []; }),
        fetchDepartmentsFromDB().catch(e => { console.warn('Departments load error:', e); return []; }),
        fetchAttendanceRecordsFromDB().catch(e => { console.warn('Attendance load error:', e); return []; })
      ]);
      if (Array.isArray(pars)) setParents(pars);
      if (Array.isArray(depts)) setDepartments(depts);
      if (Array.isArray(atts)) setAttendanceList(atts);
    } catch (e) {
      console.warn('loadExtraAdminData error:', e);
    }
  };

  const safeStudents = Array.isArray(students) ? students : [];
  const safeFaculty = Array.isArray(faculty) ? faculty : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeAttendance = Array.isArray(attendanceList) ? attendanceList : [];

  const sortedStudents = sortStudentsByRollNumber(safeStudents);

  // Calculate Student Attendance Stats for Analytics
  const studentStats = sortedStudents.map(st => {
    const stAtts = safeAttendance.filter(a => a && a.studentId === st.id);
    const summary = calculateOverallAttendance(stAtts, safeSubjects);
    return {
      student: st,
      summary
    };
  });

  const safeCount = studentStats.filter(s => s.summary && s.summary.percentage >= 85).length;
  const avgCount = studentStats.filter(s => s.summary && s.summary.percentage >= 75 && s.summary.percentage < 85).length;
  const shortageCount = studentStats.filter(s => s.summary && s.summary.percentage < 75).length;
  const totalPieCount = safeCount + avgCount + shortageCount;

  const pieData = [
    { name: 'Safe (>=85%)', value: safeCount, color: '#10b981' },
    { name: 'Average (75-84%)', value: avgCount, color: '#f59e0b' },
    { name: 'Shortage Risk (<75%)', value: shortageCount, color: '#f43f5e' }
  ];

  const barData = safeSubjects.map(sub => {
    const subAtts = safeAttendance.filter(a => a && a.subjectId === sub.id);
    const presentCount = subAtts.filter(a => a.status === 'present').length;
    const totalCount = subAtts.length || 1;
    const avgPct = Math.round((presentCount / totalCount) * 100);
    return {
      subject: sub.code || sub.name || 'Subject',
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
    try {
      if (crudTab === 'subjects') {
        const assignedFac = faculty.find(f => f.id === formData.facultyId || f.facultyCode === formData.facultyId);
        const sub: Subject = {
          id: editingItem?.id || (formData.code?.trim() ? `SUB_${formData.code.trim().replace(/[^a-zA-Z0-9]/g, '_')}` : `SUB_${Date.now()}`),
          code: (formData.code || 'CS501').trim(),
          name: (formData.name || 'New Subject').trim(),
          department: formData.department || 'Department of Computer Science & Engineering',
          semester: Number(formData.semester || 5),
          type: formData.type || 'Lecture',
          credits: Number(formData.credits || 3),
          facultyId: formData.facultyId || assignedFac?.id || '',
          facultyName: assignedFac?.name || formData.facultyName || ''
        };
        const ok = await saveSubjectToDB(sub);
        if (!ok) throw new Error('Cloud database write failed for subject.');
        setActionFeedback({ type: 'success', message: `Subject "${sub.name}" saved successfully!` });
      } else if (crudTab === 'faculty') {
        let passwordHash = editingItem?.passwordHash;
        if (formData.password && formData.password.trim()) {
          passwordHash = await hashPassword(formData.password.trim());
        } else if (!passwordHash) {
          passwordHash = await hashPassword('staff123');
        }

        let subjectsHandled: string[] = [];
        if (Array.isArray(formData.subjectsHandled)) {
          subjectsHandled = formData.subjectsHandled;
        } else if (typeof formData.subjectsHandled === 'string' && formData.subjectsHandled.trim()) {
          subjectsHandled = formData.subjectsHandled.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        const fac: Faculty = {
          id: editingItem?.id || (formData.facultyCode?.trim() ? `FAC_${formData.facultyCode.trim().replace(/[^a-zA-Z0-9]/g, '_')}` : `FAC_${Date.now()}`),
          facultyCode: (formData.facultyCode || `FAC-${Math.floor(100 + Math.random() * 900)}`).trim(),
          name: (formData.name || 'New Faculty').trim(),
          email: (formData.email || 'faculty@college.edu').trim(),
          department: formData.department || 'Department of Computer Science & Engineering',
          designation: formData.designation || 'Assistant Professor',
          phone: (formData.phone || '').trim(),
          subjectsHandled,
          passwordHash,
          approvalStatus: (formData.approvalStatus as 'approved' | 'pending') || 'approved'
        };
        const ok = await saveFacultyToDB(fac);
        if (!ok) throw new Error('Cloud database write failed for faculty.');
        setActionFeedback({ type: 'success', message: `Faculty "${fac.name}" (${fac.facultyCode}) saved successfully!` });
      } else if (crudTab === 'students') {
        let passwordHash = editingItem?.passwordHash;
        if (formData.password && formData.password.trim()) {
          passwordHash = await hashPassword(formData.password.trim());
        } else if (!passwordHash) {
          passwordHash = await hashPassword('student123');
        }

        const stu: Student = {
          id: editingItem?.id || formData.rollNo?.trim() || `STU_${Date.now()}`,
          rollNo: (formData.rollNo || '').trim(),
          name: (formData.name || '').trim(),
          email: (formData.email || '').trim(),
          phone: (formData.phone || '').trim(),
          department: formData.department || 'Department of Computer Science & Engineering',
          year: formData.year || '1st Year',
          semester: Number(formData.semester || 1),
          section: formData.section || 'A',
          passwordHash,
          parentName: formData.parentName?.trim() || undefined,
          parentPhone: formData.parentPhone?.trim() || undefined,
          approvalStatus: (formData.approvalStatus as 'approved' | 'pending') || 'approved'
        };
        const ok = await saveStudentToDB(stu);
        if (!ok) throw new Error('Cloud database write failed for student.');
        setActionFeedback({ type: 'success', message: `Student "${stu.name}" (${stu.rollNo}) saved successfully!` });
      } else if (crudTab === 'parents') {
        let passwordHash = editingItem?.passwordHash;
        if (formData.password && formData.password.trim()) {
          passwordHash = await hashPassword(formData.password.trim());
        } else if (!passwordHash) {
          passwordHash = await hashPassword('parent123');
        }

        let childRollNos: string[] = [];
        if (Array.isArray(formData.childRollNos)) {
          childRollNos = formData.childRollNos;
        } else if (typeof formData.childRollNos === 'string' && formData.childRollNos.trim()) {
          childRollNos = formData.childRollNos.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else if (formData.childRollNo) {
          childRollNos = [formData.childRollNo.trim()];
        }
        const primaryRoll = childRollNos[0] || formData.childRollNo?.trim() || '';

        const par: ParentRecord = {
          id: editingItem?.id || `PAR_${Date.now()}`,
          name: (formData.name || 'New Parent').trim(),
          email: (formData.email || 'parent@gmail.com').trim(),
          phone: (formData.phone || '').trim(),
          childRollNo: primaryRoll,
          childRollNos,
          childName: (formData.childName || '').trim(),
          address: (formData.address || '').trim(),
          passwordHash
        };
        const ok = await saveParentToDB(par);
        if (!ok) throw new Error('Cloud database write failed for parent.');
        setActionFeedback({ type: 'success', message: `Parent "${par.name}" saved successfully!` });
      } else if (crudTab === 'timetable') {
        const selectedSub = subjects.find(s => s.id === formData.subjectId || s.code === formData.subjectId);
        const selectedFac = faculty.find(f => f.id === formData.facultyId || f.facultyCode === formData.facultyId);
        const tt: TimetableSlot = {
          id: editingItem?.id || `SLOT_${Date.now()}`,
          dayOfWeek: formData.dayOfWeek || 'Monday',
          timeSlot: formData.timeSlot || '09:00 AM - 10:00 AM',
          subjectId: formData.subjectId || selectedSub?.id || (subjects[0]?.id || 'SUB501'),
          subjectName: selectedSub?.name || formData.subjectName || '',
          subjectCode: selectedSub?.code || formData.subjectCode || '',
          subjectType: selectedSub?.type || formData.subjectType || 'Lecture',
          facultyId: formData.facultyId || selectedFac?.id || (faculty[0]?.id || ''),
          facultyName: selectedFac?.name || formData.facultyName || (faculty[0]?.name || ''),
          roomNo: formData.roomNo || 'LH-201',
          department: formData.department || selectedSub?.department || 'Department of Computer Science & Engineering',
          semester: Number(formData.semester || selectedSub?.semester || 5),
          section: formData.section || 'A'
        };
        const ok = await saveTimetableSlotToDB(tt);
        if (!ok) throw new Error('Cloud database write failed for timetable slot.');
        setActionFeedback({ type: 'success', message: `Timetable slot saved successfully!` });
      } else if (crudTab === 'departments') {
        const dept: Department = {
          id: editingItem?.id || `DEP_${Date.now()}`,
          code: formData.code || 'IT',
          name: formData.name || 'Information Technology',
          hodName: formData.hodName || 'Dr. Arthur Vance'
        };
        const ok = await saveDepartmentToDB(dept);
        if (!ok) throw new Error('Cloud database write failed for department.');
        setActionFeedback({ type: 'success', message: `Department "${dept.name}" saved successfully!` });
      }

      setModalMode(null);
      setEditingItem(null);
      setFormData({});
      await onDataChanged();
      await loadExtraAdminData();
    } catch (err: any) {
      console.error('Error saving entity:', err);
      setActionFeedback({ type: 'error', message: `Save failed: ${err.message || 'Database error'}` });
    }
  };

  const promptDelete = (
    type: 'student' | 'faculty' | 'subject' | 'parent' | 'timetable' | 'department',
    id: string,
    title: string,
    subtitle?: string
  ) => {
    setDeleteTarget({ type, id, title, subtitle });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    let result: DeleteResult = { success: false, message: 'Unknown error occurred during deletion.' };

    try {
      if (deleteTarget.type === 'subject') result = await deleteSubjectFromDB(deleteTarget.id);
      else if (deleteTarget.type === 'faculty') result = await deleteFacultyFromDB(deleteTarget.id);
      else if (deleteTarget.type === 'student') result = await deleteStudentFromDB(deleteTarget.id);
      else if (deleteTarget.type === 'parent') result = await deleteParentFromDB(deleteTarget.id);
      else if (deleteTarget.type === 'timetable') result = await deleteTimetableSlotFromDB(deleteTarget.id);
      else if (deleteTarget.type === 'department') result = await deleteDepartmentFromDB(deleteTarget.id);

      if (result.success) {
        setActionFeedback({ type: 'success', message: result.message });
        await loadExtraAdminData();
        onDataChanged();
      } else {
        setActionFeedback({ type: 'error', message: result.message });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: `Delete failed: ${err?.message || 'Network error'}` });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    if (crudTab === 'students') {
      setFormData({
        rollNo: '',
        name: '',
        email: '',
        phone: '',
        department: 'Department of Computer Science & Engineering',
        year: '1st Year',
        semester: 1,
        section: 'A',
        password: '',
        parentName: '',
        parentPhone: '',
        approvalStatus: 'approved'
      });
    } else if (crudTab === 'faculty') {
      setFormData({
        facultyCode: '',
        name: '',
        email: '',
        phone: '',
        department: 'Department of Computer Science & Engineering',
        designation: 'Assistant Professor',
        password: '',
        approvalStatus: 'approved',
        subjectsHandled: ''
      });
    } else if (crudTab === 'parents') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        childRollNos: '',
        address: ''
      });
    } else if (crudTab === 'subjects') {
      setFormData({
        code: '',
        name: '',
        type: 'Lecture',
        credits: 3,
        department: 'Department of Computer Science & Engineering',
        semester: 5,
        facultyId: faculty[0]?.id || ''
      });
    } else if (crudTab === 'timetable') {
      setFormData({
        dayOfWeek: 'Monday',
        timeSlot: '08.30 AM - 09.30 AM',
        subjectId: subjects[0]?.id || '',
        facultyId: faculty[0]?.id || '',
        roomNo: 'Hall - 2211',
        department: 'Department of Computer Science & Engineering',
        semester: 5,
        section: 'A'
      });
    } else if (crudTab === 'departments') {
      setFormData({
        code: '',
        name: '',
        hodName: ''
      });
    } else {
      setFormData({});
    }
    setModalMode('add');
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (crudTab === 'students') {
      setFormData({
        ...item,
        password: '', // Blank password by default so user only enters if resetting
        phone: item.phone || '',
        year: item.year || '1st Year',
        semester: item.semester || 1,
        section: item.section || 'A',
        parentName: item.parentName || '',
        parentPhone: item.parentPhone || '',
        approvalStatus: item.approvalStatus || 'approved'
      });
    } else if (crudTab === 'faculty') {
      setFormData({
        ...item,
        password: '',
        phone: item.phone || '',
        department: item.department || 'Department of Computer Science & Engineering',
        designation: item.designation || 'Assistant Professor',
        approvalStatus: item.approvalStatus || 'approved',
        subjectsHandled: Array.isArray(item.subjectsHandled) ? item.subjectsHandled.join(', ') : (item.subjectsHandled || '')
      });
    } else if (crudTab === 'parents') {
      const rollString = Array.isArray(item.childRollNos) && item.childRollNos.length > 0
        ? item.childRollNos.join(', ')
        : (item.childRollNo || '');
      setFormData({
        ...item,
        password: '',
        phone: item.phone || '',
        address: item.address || '',
        childRollNos: rollString,
        childRollNo: item.childRollNo || ''
      });
    } else if (crudTab === 'subjects') {
      setFormData({
        ...item,
        code: item.code || '',
        name: item.name || '',
        type: item.type || 'Lecture',
        credits: item.credits || 3,
        department: item.department || 'Department of Computer Science & Engineering',
        semester: item.semester || 5,
        facultyId: item.facultyId || ''
      });
    } else if (crudTab === 'timetable') {
      setFormData({
        ...item,
        dayOfWeek: item.dayOfWeek || 'Monday',
        timeSlot: item.timeSlot || '08.30 AM - 09.30 AM',
        subjectId: item.subjectId || '',
        facultyId: item.facultyId || '',
        roomNo: item.roomNo || 'Hall - 2211',
        department: item.department || 'Department of Computer Science & Engineering',
        semester: item.semester || 5,
        section: item.section || 'A'
      });
    } else {
      setFormData({ ...item });
    }
    setModalMode('edit');
  };

  if (activeTab === 'reports') return <ReportsManager students={sortedStudents} subjects={subjects} />;
  if (activeTab === 'leaves') return <LeaveManager user={{ id: 'admin', name: 'Admin', role: 'admin', email: 'admin@college.edu' }} onLeaveUpdated={onDataChanged} />;
  if (activeTab === 'approvals') return <PendingApprovalsManager onDataChanged={onDataChanged} />;
  if (activeTab === 'saturday') return <SaturdayConfigManager />;
  if (activeTab === 'bulk') return <BulkUploadModal isOpen={true} onClose={() => onTabChange('dashboard')} onSuccess={onDataChanged} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">

      {/* Global Feedback Banner */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border animate-fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold">{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold px-2 py-1 hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}
      
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
          Overview (Analytics & Directory)
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
      {subSection === 'approvals' && <PendingApprovalsManager onDataChanged={onDataChanged} />}

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
              <div className="h-64 w-full min-h-[256px] flex items-center justify-center">
                {totalPieCount > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
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
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <PieChartIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Attendance Metrics Yet</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                      Attendance distribution will calculate automatically as class sessions are recorded.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart: Subject Average Attendance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-500" />
                Subject Average Attendance %
              </h3>
              <div className="h-64 w-full min-h-[256px] flex items-center justify-center">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                    <BarChart data={barData}>
                      <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip formatter={(val) => [`${val}%`, 'Avg Attendance']} />
                      <Bar dataKey="attendance" fill="#d97706" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <BarChart2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Subjects Configured</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                      Add subjects in Management to track subject-wise attendance averages.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Attendance Shortage Filter Banner & Directory Tabs Control */}
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
                  placeholder="Search directory..."
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

          {/* Directory Tabs & Roster Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                System Directory
              </h4>

              {/* Directory Entity Sub-Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['students', 'faculty', 'parents', 'subjects'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDirectoryTab(tab)}
                    className={`px-3 py-1 text-xs font-bold capitalize rounded-lg transition-all ${
                      directoryTab === tab
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Student Directory Table */}
            {directoryTab === 'students' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Year / Sem</th>
                      <th className="p-3">Section</th>
                      <th className="p-3">Attendance %</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentStats
                      .filter(s => {
                        if (!s || !s.student) return false;
                        if (filterShortageOnly && s.summary && s.summary.percentage >= 75) return false;
                        if (searchQuery) {
                          const q = searchQuery.toLowerCase();
                          const sName = (s.student.name || '').toLowerCase();
                          const sRoll = (s.student.rollNo || '').toLowerCase();
                          const sDept = (s.student.department || '').toLowerCase();
                          if (!sName.includes(q) && !sRoll.includes(q) && !sDept.includes(q)) return false;
                        }
                        return true;
                      })
                      .map(({ student: st, summary }) => (
                        <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{st.rollNo}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">{st.email}</td>
                          <td className="p-3 text-slate-500">{st.department}</td>
                          <td className="p-3 font-semibold">{st.year || '1st Year'} (Sem {st.semester || 1})</td>
                          <td className="p-3 font-bold text-center text-slate-700 dark:text-slate-300">{st.section || 'A'}</td>
                          <td className="p-3 font-extrabold">{summary.percentage}%</td>
                          <td className="p-3">
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
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setCrudTab('students');
                                openEditModal(st);
                                setSubSection('crud');
                              }}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-all"
                              title="Edit Student"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => promptDelete('student', st.id, st.name, `Roll No: ${st.rollNo} • ${st.department}`)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Faculty Directory Table */}
            {directoryTab === 'faculty' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Faculty Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {faculty
                      .filter(f => {
                        if (!f) return false;
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        const fName = (f.name || '').toLowerCase();
                        const fCode = (f.facultyCode || '').toLowerCase();
                        const fDept = (f.department || '').toLowerCase();
                        return fName.includes(q) || fCode.includes(q) || fDept.includes(q);
                      })
                      .map(f => (
                        <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{f.facultyCode}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{f.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">{f.email}</td>
                          <td className="p-3 text-slate-500">{f.department}</td>
                          <td className="p-3 font-semibold">{f.designation}</td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">{f.phone || '—'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                              f.approvalStatus === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                            }`}>
                              {f.approvalStatus || 'approved'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setCrudTab('faculty');
                                openEditModal(f);
                                setSubSection('crud');
                              }}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-all"
                              title="Edit Faculty"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => promptDelete('faculty', f.id, f.name, `Code: ${f.facultyCode} • ${f.department}`)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                              title="Delete Faculty"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Parents Directory Table */}
            {directoryTab === 'parents' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Parent Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Linked Student(s)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parents
                      .filter(p => {
                        if (!p) return false;
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        const pName = (p.name || '').toLowerCase();
                        const pEmail = (p.email || '').toLowerCase();
                        const pPhone = (p.phone || '').toLowerCase();
                        const pRoll = (p.childRollNo || '').toLowerCase();
                        const linked = Array.isArray(p.childRollNos) ? p.childRollNos.map(r => String(r || '').toLowerCase()) : [];
                        return pName.includes(q) || pEmail.includes(q) || pPhone.includes(q) || pRoll.includes(q) || linked.some(r => r.includes(q));
                      })
                      .map(p => {
                        const linked = (p.childRollNos && p.childRollNos.length > 0)
                          ? p.childRollNos
                          : (p.childRollNo ? [p.childRollNo] : []);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">{p.email || '—'}</td>
                            <td className="p-3 font-mono font-semibold">{p.phone}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {linked.length > 0 ? (
                                  linked.map((r, i) => (
                                    <span key={i} className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                                      {r}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setCrudTab('parents');
                                  openEditModal(p);
                                  setSubSection('crud');
                                }}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-all"
                                title="Edit Parent"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => promptDelete('parent', p.id, p.name, `Child Roll: ${linked.join(', ')} • ${p.phone}`)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                                title="Delete Parent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Subjects Directory Table */}
            {directoryTab === 'subjects' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Subject Code</th>
                      <th className="p-3">Subject Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Credits</th>
                      <th className="p-3">Assigned Faculty</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subjects
                      .filter(s => {
                        if (!s) return false;
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        const sName = (s.name || '').toLowerCase();
                        const sCode = (s.code || '').toLowerCase();
                        const sDept = (s.department || '').toLowerCase();
                        return sName.includes(q) || sCode.includes(q) || sDept.includes(q);
                      })
                      .map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{s.code}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                          <td className="p-3 font-semibold">{s.type}</td>
                          <td className="p-3 text-slate-500">{s.credits} Credits</td>
                          <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">{s.facultyName || 'Prof. Robert Langdon'}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setCrudTab('subjects');
                                openEditModal(s);
                                setSubSection('crud');
                              }}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-all"
                              title="Edit Subject"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => promptDelete('subject', s.id, s.name, `${s.code} • ${s.type} • Associated timetable slots will also be deleted`)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                              title="Delete Subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Subject Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 22CSPC501"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Subject Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Theory of Computation"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Type *</label>
                      <select
                        value={formData.type || 'Lecture'}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Lecture">Lecture</option>
                        <option value="Practical">Practical (Lab)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Credits *</label>
                      <select
                        value={formData.credits || 3}
                        onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        {[1, 2, 3, 4, 5, 6].map(c => (
                          <option key={c} value={c}>{c} Credits</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Semester *</label>
                      <select
                        value={formData.semester || 5}
                        onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Department *</label>
                      <select
                        value={formData.department || 'Department of Computer Science & Engineering'}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Department of Computer Science & Engineering">Department of Computer Science & Engineering</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical & Electronics">Electrical & Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                        {departments.map(d => (
                          !['Department of Computer Science & Engineering', 'Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical', 'Civil'].includes(d.name) && (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          )
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Assigned Faculty</label>
                      <select
                        value={formData.facultyId || ''}
                        onChange={e => {
                          const fac = faculty.find(f => f.id === e.target.value);
                          setFormData({ ...formData, facultyId: e.target.value, facultyName: fac?.name || '' });
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="">-- Select Faculty --</option>
                        {faculty.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.facultyCode})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {crudTab === 'faculty' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Faculty Code / Staff Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. FAC101"
                        value={formData.facultyCode || ''}
                        onChange={e => setFormData({ ...formData, facultyCode: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. / Prof. Full Name"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="faculty@college.edu"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543212"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Department *</label>
                      <select
                        value={formData.department || 'Computer Science'}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical & Electronics">Electrical & Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                        {departments.map(d => (
                          !['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical', 'Civil'].includes(d.name) && (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          )
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Designation *</label>
                      <select
                        value={formData.designation || 'Assistant Professor'}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Visiting Faculty">Visiting Faculty</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {modalMode === 'edit' ? 'Password (leave blank to keep)' : 'Password *'}
                      </label>
                      <input
                        type="password"
                        required={modalMode === 'add'}
                        placeholder={modalMode === 'edit' ? 'Leave blank to retain current' : 'Create password'}
                        value={formData.password || ''}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Approval Status *</label>
                      <select
                        value={formData.approvalStatus || 'approved'}
                        onChange={e => setFormData({ ...formData, approvalStatus: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending Review</option>
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Subjects Handled (comma-separated codes)</label>
                      <input
                        type="text"
                        placeholder="e.g. CS501, CS502, CS503"
                        value={formData.subjectsHandled || ''}
                        onChange={e => setFormData({ ...formData, subjectsHandled: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {crudTab === 'students' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Roll Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 22CSPC501"
                        value={formData.rollNo || ''}
                        onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Student Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="student@college.edu"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Department *</label>
                      <select
                        value={formData.department || 'Computer Science'}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical & Electronics">Electrical & Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                        {departments.map(d => (
                          !['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical', 'Civil'].includes(d.name) && (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          )
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Year *</label>
                      <select
                        value={formData.year || '1st Year'}
                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Semester (1-8) *</label>
                      <select
                        value={formData.semester || 1}
                        onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Section *</label>
                      <select
                        value={formData.section || 'A'}
                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {modalMode === 'edit' ? 'Password (leave blank to keep)' : 'Password *'}
                      </label>
                      <input
                        type="password"
                        required={modalMode === 'add'}
                        placeholder={modalMode === 'edit' ? 'Leave blank to retain current' : 'Create password'}
                        value={formData.password || ''}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Approval Status *</label>
                      <select
                        value={formData.approvalStatus || 'approved'}
                        onChange={e => setFormData({ ...formData, approvalStatus: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending Review</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Parent Name</label>
                      <input
                        type="text"
                        placeholder="Parent / Guardian Name"
                        value={formData.parentName || ''}
                        onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Parent Phone</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543211"
                        value={formData.parentPhone || ''}
                        onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {crudTab === 'parents' && (() => {
                  const currentRolls: string[] = Array.isArray(formData.childRollNos)
                    ? formData.childRollNos
                    : (typeof formData.childRollNos === 'string' && formData.childRollNos.trim()
                        ? formData.childRollNos.split(',').map((s: string) => s.trim()).filter(Boolean)
                        : (formData.childRollNo ? [formData.childRollNo.trim()] : []));

                  const handleAddStudent = (roll: string) => {
                    if (!roll) return;
                    if (!currentRolls.includes(roll)) {
                      const updated = [...currentRolls, roll];
                      setFormData({
                        ...formData,
                        childRollNos: updated.join(', '),
                        childRollNo: updated[0] || ''
                      });
                    }
                  };

                  const handleRemoveStudent = (rollToRemove: string) => {
                    const updated = currentRolls.filter(r => r.toLowerCase() !== rollToRemove.toLowerCase());
                    setFormData({
                      ...formData,
                      childRollNos: updated.join(', '),
                      childRollNo: updated[0] || ''
                    });
                  };

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Parent Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Parent Full Name"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. +91 9876543210"
                            value={formData.phone || ''}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Email Address</label>
                          <input
                            type="email"
                            placeholder="parent@gmail.com"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            {modalMode === 'edit' ? 'Password (leave blank to keep)' : 'Password *'}
                          </label>
                          <input
                            type="password"
                            required={modalMode === 'add'}
                            placeholder={modalMode === 'edit' ? 'Leave blank to retain current' : 'Create password'}
                            value={formData.password || ''}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Residential Address</label>
                          <input
                            type="text"
                            placeholder="Street, City, Pin Code"
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Interactive Student Linkage Selector */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Linked Students ({currentRolls.length} Selected)
                          </label>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            Multi-child linking supported
                          </span>
                        </div>

                        {/* Student Dropdown Picker */}
                        <div className="flex gap-2">
                          <select
                            onChange={e => {
                              handleAddStudent(e.target.value);
                              e.target.value = '';
                            }}
                            defaultValue=""
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                          >
                            <option value="">+ Select a student to link...</option>
                            {sortedStudents.map(st => (
                              <option key={st.id} value={st.rollNo} disabled={currentRolls.includes(st.rollNo)}>
                                {st.rollNo} - {st.name} ({st.department}, Sem {st.semester})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selected Student Badges */}
                        {currentRolls.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {currentRolls.map(roll => {
                              const match = students.find(s => s.rollNo.toLowerCase() === roll.toLowerCase());
                              return (
                                <span
                                  key={roll}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 rounded-lg text-xs font-bold"
                                >
                                  <span>{roll} {match ? `• ${match.name}` : ''}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStudent(roll)}
                                    className="p-0.5 hover:bg-amber-500/30 rounded text-amber-800 dark:text-amber-300 hover:text-red-600 dark:hover:text-red-400"
                                    title="Remove student link"
                                  >
                                    ✕
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No students selected yet. Choose from the list above or enter roll numbers below.</p>
                        )}

                        {/* Fallback Manual Comma-Separated Input */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                            Or enter Roll Numbers manually (comma-separated):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 2436010091, 2436010094"
                            value={typeof formData.childRollNos === 'string' ? formData.childRollNos : currentRolls.join(', ')}
                            onChange={e => setFormData({ ...formData, childRollNos: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {crudTab === 'timetable' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Day of Week *</label>
                      <select
                        value={formData.dayOfWeek || 'Monday'}
                        onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Time Slot *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 08.30 AM - 09.30 AM"
                        value={formData.timeSlot || ''}
                        onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Room No *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hall - 2211"
                        value={formData.roomNo || ''}
                        onChange={e => setFormData({ ...formData, roomNo: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Subject *</label>
                      <select
                        value={formData.subjectId || ''}
                        onChange={e => {
                          const sub = subjects.find(s => s.id === e.target.value);
                          setFormData({
                            ...formData,
                            subjectId: e.target.value,
                            subjectName: sub?.name || '',
                            subjectCode: sub?.code || '',
                            subjectType: sub?.type || 'Lecture',
                            facultyId: sub?.facultyId || formData.facultyId || '',
                            facultyName: sub?.facultyName || formData.facultyName || ''
                          });
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="">-- Select Subject --</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Faculty In-Charge</label>
                      <select
                        value={formData.facultyId || ''}
                        onChange={e => {
                          const fac = faculty.find(f => f.id === e.target.value);
                          setFormData({ ...formData, facultyId: e.target.value, facultyName: fac?.name || '' });
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="">-- Select Faculty --</option>
                        {faculty.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.facultyCode})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Department *</label>
                      <select
                        value={formData.department || 'Department of Computer Science & Engineering'}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Department of Computer Science & Engineering">Department of Computer Science & Engineering</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical & Electronics">Electrical & Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Semester *</label>
                      <select
                        value={formData.semester || 5}
                        onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Section *</label>
                      <select
                        value={formData.section || 'A'}
                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="B Batch">B Batch</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>
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
                  {crudTab === 'students' && (
                    <tr>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Year / Sem</th>
                      <th className="p-3">Section</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  )}
                  {crudTab === 'faculty' && (
                    <tr>
                      <th className="p-3">Faculty Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  )}
                  {crudTab === 'parents' && (
                    <tr>
                      <th className="p-3">Parent Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Linked Student(s)</th>
                      <th className="p-3">Address</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  )}
                  {crudTab === 'subjects' && (
                    <tr>
                      <th className="p-3">Subject Code</th>
                      <th className="p-3">Subject Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Credits</th>
                      <th className="p-3">Assigned Faculty</th>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  )}
                  {crudTab === 'timetable' && (
                    <tr>
                      <th className="p-3">Day</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Faculty</th>
                      <th className="p-3">Time Slot & Room</th>
                      <th className="p-3">Department / Sem</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  )}
                  {crudTab === 'departments' && (
                    <tr>
                      <th className="p-3">Dept Code</th>
                      <th className="p-3">Department Name</th>
                      <th className="p-3">HOD Name</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {crudTab === 'subjects' && subjects.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{sub.code}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{sub.name}</td>
                      <td className="p-3 font-semibold">{sub.type}</td>
                      <td className="p-3 text-slate-500">{sub.credits} Credits</td>
                      <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">{sub.facultyName || 'Unassigned'}</td>
                      <td className="p-3 text-slate-500">{sub.department}</td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => openEditModal(sub)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => promptDelete('subject', sub.id, sub.name, `${sub.code} • ${sub.type} • Linked timetable slots will also be deleted`)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'faculty' && faculty.map(fac => (
                    <tr key={fac.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{fac.facultyCode}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{fac.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{fac.email}</td>
                      <td className="p-3 text-slate-500">{fac.department}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{fac.designation}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{fac.phone || '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                          fac.approvalStatus === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {fac.approvalStatus || 'approved'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => openEditModal(fac)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => promptDelete('faculty', fac.id, fac.name, `Code: ${fac.facultyCode} • ${fac.department}`)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'students' && sortedStudents.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{st.rollNo}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{st.email}</td>
                      <td className="p-3 text-slate-500">{st.department}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{st.year || '1st Year'} (Sem {st.semester || 1})</td>
                      <td className="p-3 font-bold text-center text-slate-700 dark:text-slate-300">{st.section || 'A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                          st.approvalStatus === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {st.approvalStatus || 'approved'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => openEditModal(st)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => promptDelete('student', st.id, st.name, `Roll No: ${st.rollNo} • ${st.department}`)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'parents' && parents.map(par => {
                    const linked = (par.childRollNos && par.childRollNos.length > 0)
                      ? par.childRollNos
                      : (par.childRollNo ? [par.childRollNo] : []);
                    return (
                      <tr key={par.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{par.name}</td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{par.email || '—'}</td>
                        <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">{par.phone}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {linked.length > 0 ? (
                              linked.map((r, i) => (
                                <span key={i} className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                                  {r}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">{par.address || '—'}</td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => openEditModal(par)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => promptDelete('parent', par.id, par.name, `Phone: ${par.phone || '—'} • Child: ${linked.join(', ') || 'None'}`)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}

                  {crudTab === 'timetable' && timetable.map(tt => (
                    <tr key={tt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{tt.dayOfWeek}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{tt.subjectCode} - {tt.subjectName}</td>
                      <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">{tt.facultyName || 'Unassigned'}</td>
                      <td className="p-3 text-slate-500">{tt.timeSlot} ({tt.roomNo})</td>
                      <td className="p-3 text-slate-500">{tt.department} • Sem {tt.semester} ({tt.section})</td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => openEditModal(tt)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => promptDelete('timetable', tt.id, `${tt.subjectCode} - ${tt.subjectName || 'Slot'}`, `${tt.dayOfWeek} • ${tt.timeSlot} (${tt.roomNo})`)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}

                  {crudTab === 'departments' && departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{dept.code}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{dept.name}</td>
                      <td className="p-3 text-slate-500">HOD: {dept.hodName || 'Dr. Arthur Vance'}</td>
                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => openEditModal(dept)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => promptDelete('department', dept.id, dept.name, `Code: ${dept.code} • HOD: ${dept.hodName || 'N/A'}`)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 shrink-0 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
                  Delete {deleteTarget.type}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent removal from database
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {deleteTarget.title}
              </div>
              {deleteTarget.subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {deleteTarget.subtitle}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This record will be permanently deleted from the shared Supabase cloud database and all connected devices. Any linked slots or dependencies will be safely cleaned up.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
