import React, { useState, useEffect } from 'react';
import { RegistrationRequest } from '../../types';
import { fetchRegistrationRequestsFromDB, updateRegistrationStatusDB } from '../../services/dbService';
import { CheckCircle2, XCircle, Clock, Search, RefreshCw, UserCheck, GraduationCap, Building2, Calendar, Phone, Mail } from 'lucide-react';

interface PendingApprovalsManagerProps {
  onDataChanged?: () => void;
}

export const PendingApprovalsManager: React.FC<PendingApprovalsManagerProps> = ({ onDataChanged }) => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'faculty'>('all');
  const [actionMsg, setActionMsg] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    const data = await fetchRegistrationRequestsFromDB();
    setRequests(data);
    setLoading(false);
    if (onDataChanged) onDataChanged();
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
    const success = await updateRegistrationStatusDB(requestId, status);
    if (success) {
      setActionMsg(`Request ${status === 'approved' ? 'Approved' : 'Rejected'} successfully!`);
      setTimeout(() => setActionMsg(''), 4000);
      await loadRequests();
      if (onDataChanged) onDataChanged();
    }
  };

  const filtered = requests.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.rollNo && r.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.facultyCode && r.facultyCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === 'all' || r.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-full">
              Registration Registry
            </span>
            <span className="text-xs text-slate-400">Total Pending: {pendingCount}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Pending User Approvals</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Accept or reject self-registered Student and Faculty applications before granting system access.
          </p>
        </div>

        <button
          onClick={loadRequests}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-sm font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Roll No, Code..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterRole === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setFilterRole('student')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              filterRole === 'student' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Students ({requests.filter(r => r.role === 'student').length})
          </button>
          <button
            onClick={() => setFilterRole('faculty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              filterRole === 'faculty' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Faculty ({requests.filter(r => r.role === 'faculty').length})
          </button>
        </div>

      </div>

      {/* Cards List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading registration applications...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No Pending Applications Found</h3>
          <p className="text-xs text-slate-500">All student and faculty registrations have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(req => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Status & Role Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${
                    req.role === 'student' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                  }`}>
                    {req.role === 'student' ? <GraduationCap className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {req.role} Application
                  </span>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    req.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                    req.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                    'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                  }`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>

                {/* Main Details */}
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">{req.name}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{req.email}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{req.department}</span>
                  </div>

                  {req.role === 'student' && (
                    <>
                      <div>
                        <strong className="text-slate-700 dark:text-slate-300">Roll No:</strong> {req.rollNo}
                      </div>
                      <div>
                        <strong className="text-slate-700 dark:text-slate-300">Year / Sem:</strong> {req.year} (Sem {req.semester})
                      </div>
                      {req.parentName && (
                        <div className="col-span-2 text-slate-500 pt-1">
                          Parent: {req.parentName} ({req.parentPhone || 'No Phone'})
                        </div>
                      )}
                    </>
                  )}

                  {req.role === 'faculty' && (
                    <>
                      <div>
                        <strong className="text-slate-700 dark:text-slate-300">Staff Code:</strong> {req.facultyCode}
                      </div>
                      <div>
                        <strong className="text-slate-700 dark:text-slate-300">Designation:</strong> {req.designation}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {req.status === 'pending' && (
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="flex-1 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'approved')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Account
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
