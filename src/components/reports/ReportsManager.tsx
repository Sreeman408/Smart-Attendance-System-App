import React, { useState } from 'react';
import {
  FileSpreadsheet, Download, Printer, Shield, Search, RefreshCw, Filter
} from 'lucide-react';
import { Student, Subject, AttendanceRecord, AuditLog } from '../../types';
import { exportToCSV, calculateWeightedAttendance } from '../../utils/attendance';
import { getAuditLogs, getAttendanceRecords } from '../../services/storage';

interface Props {
  students: Student[];
  subjects: Subject[];
}

export const ReportsManager: React.FC<Props> = ({ students, subjects }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'audit'>('attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');

  const attendanceRecords = getAttendanceRecords();
  const auditLogs = getAuditLogs();

  const handleExportAttendanceCSV = () => {
    const reportData = students.map(st => {
      const summary = calculateWeightedAttendance(attendanceRecords, st.id);
      return {
        'Roll No': st.rollNo,
        'Student Name': st.name,
        'Department': st.department,
        'Semester': st.semester,
        'Total Conducted Units': summary.totalConductedUnits,
        'Attended Units': summary.totalAttendedUnits,
        'Weighted Percentage': `${summary.percentage}%`,
        'Eligibility Status': summary.status,
        'Presents': summary.presentsCount,
        'Absents': summary.absentsCount,
        'Lates': summary.latesCount
      };
    });

    exportToCSV(`College_Attendance_Report_${new Date().toISOString().split('T')[0]}`, reportData);
  };

  const handleExportAuditLogsCSV = () => {
    const logData = auditLogs.map(l => ({
      'Timestamp': l.timestamp,
      'User': l.userName,
      'Role': l.userRole,
      'Action': l.action,
      'Details': l.details
    }));

    exportToCSV(`Audit_Logs_${new Date().toISOString().split('T')[0]}`, logData);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === 'All' || s.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-fade-in">
      
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Reports & System Audit Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export CSV attendance sheets, print summaries, or view system logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'attendance' ? (
            <button
              onClick={handleExportAttendanceCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          ) : (
            <button
              onClick={handleExportAuditLogsCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Export Logs
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
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
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Attendance Summary
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Attendance Report Table */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name or roll no..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Table Container with smooth mobile scroll */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-center">Conducted / Attended</th>
                  <th className="p-3 text-center">Weighted %</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map(st => {
                  const summary = calculateWeightedAttendance(attendanceRecords, st.id);
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
                      <td className="p-3 text-center font-semibold">
                        {summary.totalAttendedUnits} / {summary.totalConductedUnits} units
                      </td>
                      <td className="p-3 text-center font-black font-heading text-slate-900 dark:text-white">
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
                          {summary.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            System Audit Trail
          </h4>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.map(log => (
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
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
