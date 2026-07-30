import React, { useState } from 'react';
import { Faculty, Subject, Student, AttendanceRecord, TimetableSlot, AttendanceStatus } from '../../types';
import { QRGenerator } from '../qr/QRGenerator';
import { CheckSquare, QrCode, Clock, Users, CheckCircle2, XCircle, AlertCircle, Save, Sparkles } from 'lucide-react';
import { addAttendanceRecord, getAttendanceRecords, logAuditAction, getCurrentUser } from '../../services/storage';

interface Props {
  faculty: Faculty;
  subjects: Subject[];
  students: Student[];
  timetable: TimetableSlot[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const FacultyDashboard: React.FC<Props> = ({
  faculty,
  subjects,
  students,
  timetable,
  activeTab,
  onTabChange
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Faculty subjects
  const facultySubjects = subjects.filter(s => s.facultyId === faculty.id || faculty.subjectsHandled.includes(s.id));
  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  // In-memory attendance grid state for current class marking
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    students.forEach(st => {
      initial[st.id] = 'present';
    });
    return initial;
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleStatusToggle = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(st => {
      updated[st.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = () => {
    if (!currentSubject) return;

    students.forEach(st => {
      const status = attendanceMap[st.id] || 'present';
      const record: AttendanceRecord = {
        id: `att_${selectedDate}_${currentSubject.id}_${st.id}`,
        date: selectedDate,
        studentId: st.id,
        studentName: st.name,
        subjectId: currentSubject.id,
        subjectName: currentSubject.name,
        subjectType: currentSubject.type,
        status,
        markedByFacultyId: faculty.id,
        markedAt: new Date().toISOString(),
        method: 'manual'
      };
      addAttendanceRecord(record);
    });

    logAuditAction(
      getCurrentUser(),
      'Class Attendance Marked',
      `Marked attendance for ${students.length} students in ${currentSubject.name} (${currentSubject.type}) on ${selectedDate}`
    );

    setSaveSuccessMsg(`✅ Successfully saved attendance for ${currentSubject.name} on ${selectedDate}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  if (activeTab === 'qr_gen') {
    return <QRGenerator faculty={faculty} subjects={subjects} timetable={timetable} />;
  }

  if (activeTab === 'mark' || activeTab === 'dashboard') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in">
        
        {/* Class Selector Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                  Mark Class Attendance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {faculty.name} ({faculty.designation})
                </p>
              </div>
            </div>

            <button
              onClick={() => onTabChange('qr_gen')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              Generate Live Class QR
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Course / Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {facultySubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {currentSubject && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
              <span className="font-semibold">
                Class Type: <span className="font-bold">{currentSubject.type}</span> ({currentSubject.type === 'Practical' ? '3x Weight per student' : '1x Weight'})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkMark('present')}
                  className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow-2xs"
                >
                  All Present
                </button>
                <button
                  onClick={() => handleBulkMark('absent')}
                  className="px-2 py-1 bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow-2xs"
                >
                  All Absent
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Success Banner */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold animate-fade-in">
            {saveSuccessMsg}
          </div>
        )}

        {/* Student Attendance Marking Roster */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Student Roster ({students.length} Enrolled)
            </h4>

            <button
              onClick={handleSaveAttendance}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save Attendance
            </button>
          </div>

          <div className="space-y-2">
            {students.map(st => {
              const currentStatus = attendanceMap[st.id] || 'present';
              return (
                <div
                  key={st.id}
                  className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={st.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={st.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        {st.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {st.rollNo} • Sem {st.semester} ({st.section})
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Status Selector Pill Group */}
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(stt => (
                      <button
                        key={stt}
                        onClick={() => handleStatusToggle(st.id, stt)}
                        className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          currentStatus === stt
                            ? stt === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : stt === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : stt === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {stt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveAttendance}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save Attendance Roster
            </button>
          </div>
        </div>

      </div>
    );
  }

  return null;
};
