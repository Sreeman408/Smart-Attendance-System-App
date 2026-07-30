import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Users, UserCheck, Shield, HeartHandshake,
  Database, Smartphone, ChevronDown, Bell
} from 'lucide-react';
import { User, Role } from '../../types';
import { getCurrentUser, setCurrentUser, getAllUsers, subscribeToStore, getStudents } from '../../services/storage';
import { getSupabaseCredentials } from '../../services/supabase';
import { ThemeToggle } from '../common/ThemeToggle';
import { DatabaseConfigModal } from '../common/DatabaseConfigModal';
import { CapacitorGuideModal } from '../mobile/CapacitorGuideModal';

interface Props {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  selectedChildId: string;
  onSelectChild: (studentId: string) => void;
}

export const Header: React.FC<Props> = ({
  activeRole,
  onRoleChange,
  selectedChildId,
  onSelectChild
}) => {
  const [currentUser, setUser] = useState<User>(getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(getAllUsers());
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isCapacitorModalOpen, setIsCapacitorModalOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const dbCreds = getSupabaseCredentials();
  const students = getStudents();

  useEffect(() => {
    return subscribeToStore(() => {
      setUser(getCurrentUser());
      setAllUsers(getAllUsers());
    });
  }, []);

  const handleSwitchUserRole = (targetRole: Role) => {
    onRoleChange(targetRole);
    const matchedUser = allUsers.find(u => u.role === targetRole);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }
    setShowRoleMenu(false);
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin': return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
      case 'faculty': return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'student': return <GraduationCap className="w-3.5 h-3.5 text-sky-400" />;
      case 'parent': return <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'admin': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'faculty': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'student': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'parent': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/30 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white tracking-tight leading-none">
                  Academia
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Mobile
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                College Attendance Management System
              </p>
            </div>
          </div>

          {/* Middle/Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">

            {/* Parent Child Switcher (Visible only in Parent Role) */}
            {activeRole === 'parent' && (
              <div className="relative">
                <select
                  value={selectedChildId}
                  onChange={(e) => onSelectChild(e.target.value)}
                  className="pl-2.5 pr-7 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      Child: {s.name} ({s.rollNo})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-rose-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Role Portal Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${getRoleBadgeStyle(activeRole)}`}
                title="Switch Portal Role"
              >
                {getRoleIcon(activeRole)}
                <span className="capitalize">{activeRole}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-scale-up">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Portal Role
                  </div>
                  {(['admin', 'faculty', 'student', 'parent'] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleSwitchUserRole(r)}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeRole === r
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getRoleIcon(r)}
                        <span className="capitalize">{r} Portal</span>
                      </div>
                      {activeRole === r && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Database / Supabase Badge */}
            <button
              onClick={() => setIsDbModalOpen(true)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                dbCreds.isConfigured
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Database Connection Settings"
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">
                {dbCreds.isConfigured ? 'Supabase' : 'Database'}
              </span>
            </button>

            {/* Mobile Capacitor Build Guide Button */}
            <button
              onClick={() => setIsCapacitorModalOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Native Mobile Build Instructions"
            >
              <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">APK / iOS</span>
            </button>

            {/* Dark/Light Theme Switcher */}
            <ThemeToggle />

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                  {currentUser.email}
                </p>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Modals */}
      <DatabaseConfigModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} />
      <CapacitorGuideModal isOpen={isCapacitorModalOpen} onClose={() => setIsCapacitorModalOpen(false)} />
    </>
  );
};
