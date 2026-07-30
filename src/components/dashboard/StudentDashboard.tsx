import React from 'react';
import { Student, Subject, AttendanceRecord, TimetableSlot } from '../../types';
import { AttendanceCalendar } from '../calendar/AttendanceCalendar';
import { QRScanner } from '../qr/QRScanner';
import { Clock, BookOpen, MapPin, Sparkles } from 'lucide-react';

interface Props {
  student: Student;
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  timetable: TimetableSlot[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const StudentDashboard: React.FC<Props> = ({
  student,
  subjects,
  attendanceRecords,
  timetable,
  activeTab,
  onTabChange
}) => {
  // Get today's day of week timetable
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = timetable.filter(t => t.dayOfWeek === todayName || true).slice(0, 4);

  if (activeTab === 'calendar') {
    return (
      <AttendanceCalendar
        student={student}
        subjects={subjects}
        attendanceRecords={attendanceRecords}
      />
    );
  }

  if (activeTab === 'qr') {
    return (
      <QRScanner
        student={student}
        subjects={subjects}
        onAttendanceSuccess={() => onTabChange('calendar')}
      />
    );
  }

  if (activeTab === 'timetable') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Class Timetable Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Department: {student.department} • Sem {student.semester} (Sec {student.section})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {timetable.map(slot => (
              <div
                key={slot.id}
                className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {slot.dayOfWeek} • {slot.timeSlot}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    slot.subjectType === 'Practical'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                  }`}>
                    {slot.subjectType} ({slot.subjectType === 'Practical' ? '3x Weight' : '1x'})
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {slot.subjectName} ({slot.subjectCode})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Faculty: {slot.facultyName} • Room: {slot.roomNo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default Overview Dashboard
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      
      {/* Student Welcome Banner */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              Roll No: {student.rollNo}
            </span>
            <button
              onClick={() => onTabChange('qr')}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Scan Class QR
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
            Welcome back, {student.name}!
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
            {student.department} • Semester {student.semester} (Section {student.section})
          </p>
        </div>
      </div>

      {/* Embedded Calendar Analytics View */}
      <AttendanceCalendar
        student={student}
        subjects={subjects}
        attendanceRecords={attendanceRecords}
      />

    </div>
  );
};
