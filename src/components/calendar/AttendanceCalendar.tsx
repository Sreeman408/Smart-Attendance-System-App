import React, { useState } from 'react';
import {
  Calendar as CalendarIcon, Flame, AlertTriangle, CheckCircle,
  XCircle, Clock, ChevronLeft, ChevronRight, BookOpen, Target, ArrowRight, Info
} from 'lucide-react';
import { Student, Subject, AttendanceRecord, AttendanceStatus } from '../../types';
import { calculateWeightedAttendance, predictClassesToTarget } from '../../utils/attendance';

interface Props {
  student: Student;
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
}

export const AttendanceCalendar: React.FC<Props> = ({
  student,
  subjects,
  attendanceRecords
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Overall attendance calculation
  const overallSummary = calculateWeightedAttendance(attendanceRecords, student.id);
  const predictor = predictClassesToTarget(overallSummary, 75);

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Month navigation
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Map attendance records by date for easy lookup
  const recordsByDate = new Map<string, AttendanceRecord[]>();
  attendanceRecords
    .filter(r => r.studentId === student.id)
    .forEach(r => {
      if (!recordsByDate.has(r.date)) recordsByDate.set(r.date, []);
      recordsByDate.get(r.date)!.push(r);
    });

  // Selected Date Records
  const selectedDayRecords = recordsByDate.get(selectedDateStr) || [];

  const getDayStatusColor = (records: AttendanceRecord[] | undefined) => {
    if (!records || records.length === 0) return null;
    const hasAbsent = records.some(r => r.status === 'absent');
    const hasLate = records.some(r => r.status === 'late');
    const hasPresent = records.some(r => r.status === 'present' || r.status === 'excused');

    if (hasAbsent && !hasPresent) return 'bg-rose-500 text-white';
    if (hasAbsent && hasPresent) return 'bg-amber-500 text-white'; // Mixed
    if (hasLate) return 'bg-amber-400 text-slate-900';
    if (hasPresent) return 'bg-emerald-500 text-white';
    return 'bg-slate-300 dark:bg-slate-700';
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">

      {/* Top Banner & Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* 1. Overall Attendance % Card */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Weighted Attendance</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              overallSummary.status === 'Safe'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : overallSummary.status === 'Borderline'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
            }`}>
              {overallSummary.status}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
              {overallSummary.percentage}%
            </span>
            <span className="text-[11px] text-slate-400">Target 75%</span>
          </div>

          {/* Mini progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                overallSummary.percentage >= 75
                  ? 'bg-emerald-500'
                  : overallSummary.percentage >= 65
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(overallSummary.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* 2. Streak Counter Card */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
            <span>Present Streak</span>
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-900 dark:text-amber-100">
              {overallSummary.streakDays}
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Days</span>
          </div>
          <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1 truncate">
            {overallSummary.streakDays > 0 ? 'Consecutive attendances! 🔥' : 'Keep attending classes!'}
          </p>
        </div>

        {/* 3. Attended vs Conducted Classes */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Classes Breakdown
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
              {overallSummary.presentsCount}
            </span>
            <span className="text-xs text-slate-400">/ {overallSummary.totalClassesConducted} Attended</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold mt-1">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <CheckCircle className="w-3 h-3" /> {overallSummary.presentsCount}
            </span>
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
              <XCircle className="w-3 h-3" /> {overallSummary.absentsCount}
            </span>
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> {overallSummary.latesCount}
            </span>
          </div>
        </div>

        {/* 4. Attendance Predictor Widget */}
        <div className="p-3.5 sm:p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-xs col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Attendance Predictor</span>
          </div>
          <p className="text-xs text-indigo-800 dark:text-indigo-200 mt-1 leading-relaxed font-medium">
            {predictor.message}
          </p>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold flex items-center gap-1">
            <span>Rule: 1 Lab = 3 Lecture Weight</span>
            <Info className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* Main Calendar Section & Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Calendar Month Grid (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">

          {/* Month Header controls */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">

            {/* Blank padding cells before day 1 */}
            {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
              <div key={`blank_${idx}`} className="h-10 sm:h-12 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 opacity-30" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateObj = new Date(year, month, dayNum);
              const dateStr = dateObj.toISOString().split('T')[0];
              const dayRecords = recordsByDate.get(dateStr) || [];
              const isSelected = selectedDateStr === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const statusColor = getDayStatusColor(dayRecords);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`relative h-11 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between border transition-all ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/30 font-bold'
                      : isToday
                      ? 'border-indigo-400 bg-slate-50 dark:bg-slate-800/80 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {dayNum}
                  </span>

                  {/* Status Indicator Pill / Dots */}
                  {statusColor ? (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${statusColor}`}>
                      {dayRecords.length > 0 ? `${dayRecords.filter(r => r.status === 'present').length}/${dayRecords.length}` : '•'}
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  )}
                </button>
              );
            })}

          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Late / Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Excused / Duty Leave</span>
            </div>
          </div>

        </div>

        {/* Selected Date Inspector Panel (Right side) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
              Day Breakdown
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {selectedDayRecords.length === 0 ? (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs">No classes logged for this selected date.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {selectedDayRecords.map(rec => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {rec.subjectName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rec.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : rec.status === 'absent'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      Type: {rec.subjectType} ({rec.subjectType === 'Practical' ? '3x Weight' : '1x Weight'})
                    </span>
                    <span>
                      Method: {rec.method === 'qr_code' ? '⚡ QR Scan' : 'Faculty Log'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Subject-Wise Breakdown List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Subject-Wise Attendance Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjects.map(sub => {
            const subSummary = calculateWeightedAttendance(attendanceRecords, student.id, sub.id);
            return (
              <div
                key={sub.id}
                className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {sub.code} • {sub.type} ({sub.type === 'Practical' ? '3x Weight' : '1x Weight'})
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {sub.name}
                    </h4>
                  </div>
                  <span className="text-base font-black font-heading text-slate-900 dark:text-white">
                    {subSummary.percentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      subSummary.percentage >= 75
                        ? 'bg-emerald-500'
                        : subSummary.percentage >= 65
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(subSummary.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>
                    Attended: {subSummary.presentsCount} / {subSummary.totalClassesConducted} Classes
                  </span>
                  <span className={`font-bold ${
                    subSummary.status === 'Safe' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {subSummary.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
