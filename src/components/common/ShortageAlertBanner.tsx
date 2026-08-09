import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AttendanceSummary } from '../../types';

interface Props {
  summary: AttendanceSummary;
  studentName?: string;
}

export const ShortageAlertBanner: React.FC<Props> = ({ summary, studentName }) => {
  const isShortage = summary.percentage < 75;
  const isBorderline = summary.percentage >= 75 && summary.percentage < 85;

  // Calculate needed consecutive classes to reach 75%
  // Equation: (Attended + N) / (Total + N) >= 0.75 => N >= (0.75*Total - Attended) / 0.25
  const neededClasses = Math.max(0, Math.ceil((0.75 * summary.totalConductedUnits - summary.totalAttendedUnits) / 0.25));

  if (!isShortage && !isBorderline) {
    return (
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm">Attendance Status: Excellent ({summary.percentage}%)</h4>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              {studentName ? `${studentName}'s` : 'Your'} attendance meets university requirements ($ \ge 85\% $). Keep up the good streak!
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-500 text-white font-extrabold text-[10px] rounded-full uppercase">
          Safe Roster
        </span>
      </div>
    );
  }

  if (isBorderline) {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm">Attendance Status: Borderline ({summary.percentage}%)</h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Attendance is between 75% and 85%. Ensure you attend upcoming classes to avoid falling into shortage.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-full uppercase">
          Borderline
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl text-rose-800 dark:text-rose-200 text-xs space-y-2 shadow-md animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <h4 className="font-black text-sm text-rose-900 dark:text-rose-100">
              🚨 ATTENDANCE SHORTAGE RISK WARNING ({summary.percentage}%)
            </h4>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
              Attendance is strictly below the mandatory 75% threshold required for examination eligibility.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-rose-600 text-white font-black text-[10px] rounded-full uppercase shadow-xs">
          Shortage Risk
        </span>
      </div>

      <div className="pt-2 border-t border-rose-500/30 flex items-center justify-between text-[11px]">
        <span>Required Classes to reach 75%: <strong className="text-rose-950 dark:text-white font-extrabold text-xs">{neededClasses} consecutive classes</strong></span>
        <span className="font-bold underline cursor-pointer">Submit Medical Leave / OD Request</span>
      </div>
    </div>
  );
};
