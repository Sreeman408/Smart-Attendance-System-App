import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Download, Printer, Shield, Search, Database, FileText
} from 'lucide-react';
import { Student, Subject, AttendanceRecord, AuditLog } from '../../types';
import { calculateOverallAttendance } from '../../utils/attendance';
import { fetchAttendanceRecordsFromDB, fetchAuditLogsFromDB } from '../../services/dbService';
import { sortStudentsByRollNumber } from '../../utils/sortingUtils';
import { ExportPreviewModal, ColumnDef, MetricBadge } from '../common/ExportPreviewModal';

interface Props {
  students: Student[];
  subjects: Subject[];
  attendanceRecords?: AttendanceRecord[];
  auditLogs?: AuditLog[];
}

export const ReportsManager: React.FC<Props> = ({
  students,
  subjects,
  attendanceRecords: propAttendance,
  auditLogs: propLogs
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'audit'>('attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(propAttendance || []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(propLogs || []);
  const [previewConfig, setPreviewConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    filenameBase: string;
    columns: ColumnDef[];
    data: Record<string, any>[];
    metrics?: MetricBadge[];
    sheetName?: string;
  } | null>(null);

  useEffect(() => {
    if (propAttendance && propAttendance.length > 0) {
      setAttendanceRecords(propAttendance);
    } else {
      fetchAttendanceRecordsFromDB().then(recs => setAttendanceRecords(recs)).catch(() => {});
    }

    if (propLogs && propLogs.length > 0) {
      setAuditLogs(propLogs);
    } else {
      fetchAuditLogsFromDB().then(logs => setAuditLogs(logs)).catch(() => {});
    }
  }, [propAttendance, propLogs]);

  const sortedStudents = sortStudentsByRollNumber(students);

  // 1. Generate Aggregated Student Attendance Roster
  const openAttendanceSummaryPreview = () => {
    let totalPctSum = 0;
    let safeCount = 0;
    let shortageCount = 0;
    let borderlineCount = 0;

    const reportRows = sortedStudents.map(st => {
      const stAtts = attendanceRecords.filter(a => a.studentId === st.id);
      const summary = calculateOverallAttendance(stAtts, subjects);
      totalPctSum += summary.percentage;

      if (summary.status === 'Shortage') shortageCount++;
      else if (summary.status === 'Borderline') borderlineCount++;
      else safeCount++;

      const row: Record<string, any> = {
        rollNo: st.rollNo,
        name: st.name,
        department: st.department,
        semesterSection: `Sem ${st.semester} (${st.section})`,
        classesHeld: summary.totalClassesConducted,
        classesAttended: summary.totalClassesAttended,
        overallPercentage: `${summary.percentage}%`,
        status: summary.status === 'Shortage' ? 'Shortage Risk (<75%)' : summary.status
      };

      // Add each subject's individual percentage
      subjects.forEach(sub => {
        const subAtts = stAtts.filter(a => a.subjectId === sub.id);
        const presentCount = subAtts.filter(a => a.status === 'present' || a.status === 'excused').length;
        const totalCount = subAtts.length || 0;
        const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;
        row[`sub_${sub.code}`] = `${pct}% (${presentCount}/${totalCount})`;
      });

      return row;
    });

    const avgPct = sortedStudents.length > 0 ? Math.round(totalPctSum / sortedStudents.length) : 100;

    const dynamicColumns: ColumnDef[] = [
      { key: 'rollNo', label: 'Roll Number' },
      { key: 'name', label: 'Student Name' },
      { key: 'department', label: 'Department' },
      { key: 'semesterSection', label: 'Semester' },
      { key: 'classesHeld', label: 'Total Held', align: 'center' },
      { key: 'classesAttended', label: 'Attended', align: 'center' },
      { key: 'overallPercentage', label: 'Overall %', align: 'center' },
      { key: 'status', label: 'Status' }
    ];

    // Append subjects
    subjects.forEach(sub => {
      dynamicColumns.push({
        key: `sub_${sub.code}`,
        label: `${sub.code} (${sub.type}) %`,
        align: 'center'
      });
    });

    setPreviewConfig({
      isOpen: true,
      title: 'Overall Attendance Roster Preview',
      subtitle: 'Complete student percentage summary with subject breakdown',
      filenameBase: 'Annamalai_Overall_Attendance_Report',
      sheetName: 'Attendance_Summary',
      columns: dynamicColumns,
      data: reportRows,
      metrics: [
        { label: 'Total Students', value: sortedStudents.length, color: 'blue' },
        { label: 'Average Attendance', value: `${avgPct}%`, color: 'emerald' },
        { label: 'Safe (>75%)', value: safeCount, color: 'emerald' },
        { label: 'Borderline', value: borderlineCount, color: 'amber' },
        { label: 'Shortage Risk', value: shortageCount, color: 'red' }
      ]
    });
  };

  // 2. Export All Raw Attendance Logs
  const openRawAttendanceLogsPreview = () => {
    if (attendanceRecords.length === 0) {
      alert('No attendance records logged yet in the database.');
      return;
    }

    const reportRows = attendanceRecords.map(rec => {
      const matchedStudent = students.find(s => s.id === rec.studentId);
      return {
        date: rec.date,
        rollNo: matchedStudent?.rollNo || rec.studentId,
        studentName: rec.studentName || matchedStudent?.name || 'Student',
        department: matchedStudent?.department || 'Computer Science',
        subjectCode: rec.subjectId,
        subjectName: rec.subjectName || subjects.find(s => s.id === rec.subjectId)?.name || rec.subjectId,
        subjectType: rec.subjectType || 'Lecture',
        status: (rec.status || 'present').toUpperCase(),
        method: rec.method || 'manual',
        isSaturday: rec.isSaturday ? 'Yes' : 'No',
        markedBy: rec.markedByFacultyId || 'Faculty',
        timestamp: rec.markedAt ? new Date(rec.markedAt).toLocaleString() : rec.date
      };
    });

    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const overallRate = attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : 100;

    setPreviewConfig({
      isOpen: true,
      title: 'All Raw Attendance Records Log',
      subtitle: 'Full unaggregated audit records of every marked session',
      filenameBase: 'All_Raw_Attendance_Records',
      sheetName: 'All_Records',
      columns: [
        { key: 'date', label: 'Session Date' },
        { key: 'rollNo', label: 'Roll Number' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'subjectName', label: 'Course / Subject' },
        { key: 'subjectType', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'method', label: 'Method' },
        { key: 'markedBy', label: 'Faculty ID' },
        { key: 'timestamp', label: 'Logged At' }
      ],
      data: reportRows,
      metrics: [
        { label: 'Total Records', value: attendanceRecords.length, color: 'blue' },
        { label: 'Present Logged', value: presentCount, color: 'emerald' },
        { label: 'Overall Rate', value: `${overallRate}%`, color: 'purple' },
        { label: 'Subjects Covered', value: subjects.length, color: 'slate' }
      ]
    });
  };

  // 3. Export System Audit Trail Logs
  const openAuditLogsPreview = () => {
    const reportRows = auditLogs.map(l => ({
      timestamp: new Date(l.timestamp).toLocaleString(),
      userName: l.userName,
      userRole: l.userRole,
      action: l.action,
      details: l.details
    }));

    setPreviewConfig({
      isOpen: true,
      title: 'System Audit Trail Logs Preview',
      subtitle: 'Complete history of system security and attendance actions',
      filenameBase: 'System_Audit_Logs',
      sheetName: 'Audit_Logs',
      columns: [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'userName', label: 'User / Faculty' },
        { key: 'userRole', label: 'Role' },
        { key: 'action', label: 'Action Performed' },
        { key: 'details', label: 'Audit Details' }
      ],
      data: reportRows,
      metrics: [
        { label: 'Total Events', value: auditLogs.length, color: 'purple' }
      ]
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = sortedStudents.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-fade-in pb-12">
      
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reports & Data Export Center
            </h3>
            <p className="text-xs text-slate-500">
              Preview and export attendance rosters, percentages, and full raw logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'attendance' ? (
            <>
              <button
                type="button"
                onClick={openAttendanceSummaryPreview}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Preview Attendance Report
              </button>

              <button
                type="button"
                onClick={openRawAttendanceLogsPreview}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Database className="w-4 h-4" />
                Download All Records (Raw Logs)
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openAuditLogsPreview}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Preview & Export Logs
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl max-w-xs">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'attendance'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Attendance Roster
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Attendance Report Table */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
          
          {/* Filters & Actions */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name or roll no..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
              {attendanceRecords.length} total attendance logs recorded
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-center">Overall Attendance %</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No matching students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(st => {
                    const stAtts = attendanceRecords.filter(a => a.studentId === st.id);
                    const summary = calculateOverallAttendance(stAtts, subjects);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {st.rollNo}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {st.name}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">
                          {st.department} (Sem {st.semester})
                        </td>
                        <td className="p-3 text-center font-extrabold text-slate-900 dark:text-white">
                          {summary.percentage}%
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            summary.status === 'Safe'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : summary.status === 'Borderline'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {summary.status === 'Shortage' ? 'Shortage Risk' : summary.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            System Audit Trail
          </h4>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="py-8 text-center text-slate-400 italic text-xs">No audit logs found.</p>
            ) : (
              auditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {log.details}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    User: <span className="font-semibold text-slate-700 dark:text-slate-200">{log.userName}</span> ({log.userRole})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Export Preview Modal */}
      {previewConfig && (
        <ExportPreviewModal
          isOpen={previewConfig.isOpen}
          onClose={() => setPreviewConfig(null)}
          title={previewConfig.title}
          subtitle={previewConfig.subtitle}
          filenameBase={previewConfig.filenameBase}
          sheetName={previewConfig.sheetName}
          columns={previewConfig.columns}
          data={previewConfig.data}
          metrics={previewConfig.metrics}
        />
      )}

    </div>
  );
};
