import React, { useState } from 'react';
import {
  FileText, Plus, CheckCircle, XCircle, Clock, Calendar, AlertCircle
} from 'lucide-react';
import { LeaveRequest, User, Role } from '../../types';
import { getLeaves, addLeave, updateLeaveStatus, logAuditAction, getCurrentUser } from '../../services/storage';

interface Props {
  user: User;
  onLeaveUpdated?: () => void;
}

export const LeaveManager: React.FC<Props> = ({ user, onLeaveUpdated }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(getLeaves());
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveType, setLeaveType] = useState<'Medical' | 'Personal' | 'On Duty / Event' | 'Other'>('Medical');
  const [reason, setReason] = useState('');

  const refreshLeaves = () => {
    setLeaves(getLeaves());
    if (onLeaveUpdated) onLeaveUpdated();
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const newLeave: LeaveRequest = {
      id: `LV_${Date.now()}`,
      applicantId: user.id,
      applicantName: user.name,
      applicantRole: user.role,
      studentId: user.studentId || 'STU202401',
      startDate,
      endDate,
      leaveType,
      reason,
      status: 'pending',
      appliedOn: new Date().toISOString()
    };

    addLeave(newLeave);
    logAuditAction(user, 'Leave Applied', `Applied for ${leaveType} leave from ${startDate} to ${endDate}`);
    refreshLeaves();
    setShowApplyModal(false);
    setReason('');
  };

  const handleStatusUpdate = (leaveId: string, status: 'approved' | 'rejected') => {
    updateLeaveStatus(leaveId, status, user.name);
    logAuditAction(user, `Leave ${status}`, `Leave request ${leaveId} was ${status} by ${user.name}`);
    refreshLeaves();
  };

  // Filter leaves based on user role
  const displayLeaves = user.role === 'admin' || user.role === 'faculty'
    ? leaves
    : leaves.filter(l => l.applicantId === user.id || l.studentId === user.studentId);

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-fade-in">
      
      {/* Header & Apply Button */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Leave Applications & Approvals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apply for medical, personal, or duty leaves with status tracking.
            </p>
          </div>
        </div>

        {(user.role === 'student' || user.role === 'faculty' || user.role === 'parent') && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Apply Leave
          </button>
        )}
      </div>

      {/* Apply Leave Modal Form */}
      {showApplyModal && (
        <div className="p-5 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">New Leave Request</h4>
          <form onSubmit={handleApplyLeave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Leave Type
              </label>
              <select
                value={leaveType}
                onChange={e => setLeaveType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="Medical">Medical Leave</option>
                <option value="Personal">Personal Leave</option>
                <option value="On Duty / Event">On Duty / Official Event</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason / Explanation
              </label>
              <textarea
                rows={3}
                placeholder="State the reason clearly..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leaves List */}
      <div className="space-y-3">
        {displayLeaves.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs">No leave requests found.</p>
          </div>
        ) : (
          displayLeaves.map(leave => (
            <div
              key={leave.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {leave.applicantName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                      {leave.applicantRole}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {leave.leaveType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {leave.reason}
                  </p>
                </div>

                {/* Status Badge */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                  leave.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : leave.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {leave.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Dates: {leave.startDate} to {leave.endDate}
                </span>

                {/* Admin / Faculty Approval Action Controls */}
                {(user.role === 'admin' || user.role === 'faculty') && leave.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                    <button
                      onClick={() => handleStatusUpdate(leave.id, 'approved')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
