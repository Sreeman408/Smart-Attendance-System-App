import React, { useState, useEffect } from 'react';
import { Student, Subject, AttendanceRecord, TimetableSlot, SaturdayConfig } from '../../types';
import { AttendanceCalendar } from '../calendar/AttendanceCalendar';
import { QRScanner } from '../qr/QRScanner';
import { LeaveManager } from '../leaves/LeaveManager';
import { Clock, BookOpen, MapPin, Sparkles, Calendar, AlertCircle } from 'lucide-react';
import { fetchSaturdayConfigFromDB } from '../../services/dbService';

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
  const [saturdayConfig, setSaturdayConfig] = useState<SaturdayConfig>({ mappedDay: 'Monday', enabled: true });

  useEffect(() => {
    async function loadConfig() {
      const cfg = await fetchSaturdayConfigFromDB();
      setSaturdayConfig(cfg);
    }
    loadConfig();
  }, []);

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

  if (activeTab === 'leaves') {
    return (
      <LeaveManager
        user={{
          id: `usr_${student.id}`,
          name: student.name,
          role: 'student',
          email: student.email,
          studentId: student.id
        }}
        onLeaveUpdated={() => onTabChange('calendar')}
      />
    );
  }

  if (activeTab === 'timetable') {
    // Generate Timetable incorporating Saturday mapped schedule
    const saturdaySlots: TimetableSlot[] = saturdayConfig.enabled ? timetable
      .filter(t => t.dayOfWeek === saturdayConfig.mappedDay)
      .map((t, idx) => ({
        ...t,
        id: `sat_slot_${idx}_${t.id}`,
        dayOfWeek: 'Saturday',
        isSaturdayMapped: true
      })) : [];

    const fullTimetable = [...timetable, ...saturdaySlots];

    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in pb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Weekly Timetable & Saturday Mapping
              </h3>
              <p className="text-xs text-slate-500">
                Department: {student.department} • Year: {student.year || '2nd Year'} • Sem {student.semester} ({student.section})
              </p>
            </div>
          </div>

          {/* Saturday Mapping Alert Banner */}
          {saturdayConfig.enabled && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Saturday Class Schedule copies <strong>{saturdayConfig.mappedDay}'s</strong> Timetable.</span>
              </div>
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-extrabold rounded text-[10px] uppercase">
                Active Mapping
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fullTimetable.map(slot => (
              <div
                key={slot.id}
                className={`p-3.5 border rounded-xl space-y-2 transition-all ${
                  slot.dayOfWeek === 'Saturday'
                    ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    slot.dayOfWeek === 'Saturday'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  }`}>
                    {slot.dayOfWeek} • {slot.timeSlot}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    slot.subjectType === 'Practical'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                  }`}>
                    {slot.subjectType} ({slot.subjectType === 'Practical' ? '3x Weight' : '1x Weight'})
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {slot.subjectName} ({slot.subjectCode})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Faculty: {slot.facultyName} • Room: {slot.roomNo}
                  </p>
                  {slot.isSaturdayMapped && (
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                      * Saturday Class (Copied from {saturdayConfig.mappedDay})
                    </p>
                  )}
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
      
      {/* Student Welcome Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 text-white rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              Roll No: {student.rollNo} • {student.year || '2nd Year'}
            </span>
            <button
              onClick={() => onTabChange('qr')}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Scan Camera QR
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome back, {student.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
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
