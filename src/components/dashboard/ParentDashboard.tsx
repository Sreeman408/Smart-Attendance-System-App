import React from 'react';
import { User, Student, Subject, AttendanceRecord, Faculty, TimetableSlot } from '../../types';
import { AttendanceCalendar } from '../calendar/AttendanceCalendar';
import { LeaveManager } from '../leaves/LeaveManager';
import { ShortageAlertBanner } from '../common/ShortageAlertBanner';
import { HeartHandshake, PhoneCall, Mail, Clock, Calendar } from 'lucide-react';
import { calculateOverallAttendance } from '../../utils/attendance';
import { sortStudentsByRollNumber } from '../../utils/sortingUtils';

interface Props {
  parentUser: User;
  students: Student[];
  subjects: Subject[];
  faculty: Faculty[];
  attendanceRecords: AttendanceRecord[];
  selectedChildId: string;
  onSelectChild: (studentId: string) => void;
  activeTab: string;
  timetable?: TimetableSlot[];
}

export const ParentDashboard: React.FC<Props> = ({
  parentUser,
  students,
  subjects,
  faculty,
  attendanceRecords,
  selectedChildId,
  onSelectChild,
  activeTab,
  timetable = []
}) => {
  const currentChild = students.find(s => s.id === selectedChildId) || students[0];

  if (!currentChild) {
    return <div className="p-8 text-center text-slate-500 font-bold">No linked child profile found.</div>;
  }

  const childAtts = attendanceRecords.filter(a => a.studentId === currentChild.id);
  const summary = calculateOverallAttendance(childAtts, subjects);

  // 1. Faculty Contact Directory Tab
  if (activeTab === 'faculty') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in pb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Faculty Contact Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct contact details for {currentChild.name}&apos;s professors.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faculty.map(f => (
              <div
                key={f.id}
                className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {f.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {f.designation} • {f.department}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span>{f.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{f.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Ward Timetable Schedule Tab
  if (activeTab === 'timetable') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in pb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ward Class Timetable ({currentChild.name})
              </h3>
              <p className="text-xs text-slate-500">
                Department: {currentChild.department} • Year: {currentChild.year || '2nd Year'} • Sem {currentChild.semester}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {timetable.map(slot => (
              <div key={slot.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-md">
                    {slot.dayOfWeek} • {slot.timeSlot}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Room: {slot.roomNo}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{slot.subjectName} ({slot.subjectCode})</h4>
                  <p className="text-[11px] text-slate-500">Faculty: {slot.facultyName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Ward Leaves Tab
  if (activeTab === 'leaves') {
    return (
      <LeaveManager
        user={{
          id: `usr_${currentChild.id}`,
          name: currentChild.name,
          role: 'student',
          email: currentChild.email,
          studentId: currentChild.id
        }}
        onLeaveUpdated={() => {}}
      />
    );
  }

  // 4. Ward Attendance Calendar Tab
  if (activeTab === 'calendar') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in pb-12">
        <AttendanceCalendar
          student={currentChild}
          subjects={subjects}
          attendanceRecords={attendanceRecords}
        />
      </div>
    );
  }

  // Default Overview Dashboard ('dashboard' or fallback)
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
      
      {/* Parent Welcome & Child Selector Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold font-heading">
              Parent Portal - {parentUser.name}
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Monitoring attendance for linked child: <span className="font-bold text-white">{currentChild.name}</span> ({currentChild.rollNo})
          </p>
        </div>

        {/* Multi-child dropdown */}
        <div className="bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20">
          <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-300 mb-1 px-1">
            Switch Linked Child
          </label>
          <select
            value={selectedChildId}
            onChange={e => onSelectChild(e.target.value)}
            className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
          >
            {sortStudentsByRollNumber(students).map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.rollNo}) - Sem {s.semester}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ward Attendance Shortage Risk Warning */}
      <ShortageAlertBanner summary={summary} studentName={currentChild.name} />

      {/* Child Attendance Calendar & Analytics */}
      <AttendanceCalendar
        student={currentChild}
        subjects={subjects}
        attendanceRecords={attendanceRecords}
      />

    </div>
  );
};
