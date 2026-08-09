import React, { useState } from 'react';
import { UniversityLogo } from '../common/UniversityLogo';
import { User, Role } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';
import { ProfileModal } from '../profile/ProfileModal';
import { DatabaseConfigModal } from '../common/DatabaseConfigModal';
import { CapacitorGuideModal } from '../mobile/CapacitorGuideModal';
import { LogOut, User as UserIcon, Database, Smartphone, Shield, UserCheck, GraduationCap, Users, ChevronDown } from 'lucide-react';
import { clearActiveSession } from '../../services/authService';

interface Props {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  currentUser: User;
  onUserUpdated: (u: User) => void;
  onLogout: () => void;
  selectedChildId?: string;
  onSelectChild?: (studentId: string) => void;
  studentsList?: any[];
}

export const Header: React.FC<Props> = ({
  activeRole,
  onRoleChange,
  currentUser,
  onUserUpdated,
  onLogout,
  selectedChildId,
  onSelectChild,
  studentsList = []
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [isCapacitorOpen, setIsCapacitorOpen] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Identity */}
          <UniversityLogo size="sm" showText={true} />

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Parent Child Selector */}
            {activeRole === 'parent' && onSelectChild && studentsList.length > 0 && (
              <select
                value={selectedChildId}
                onChange={e => onSelectChild(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl focus:outline-none"
              >
                {studentsList.map(s => (
                  <option key={s.id} value={s.id}>
                    Child: {s.name} ({s.rollNo})
                  </option>
                ))}
              </select>
            )}

            {/* Role Dropdown Badge */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <span className="capitalize">{activeRole} Portal</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50">
                  {(['admin', 'faculty', 'student', 'parent'] as Role[]).map(r => (
                    <button
                      key={r}
                      onClick={() => { onRoleChange(r); setShowRoleDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold capitalize hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        activeRole === r ? 'text-amber-500 font-bold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r} Portal
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Database & APK Buttons */}
            <button
              onClick={() => setIsDbOpen(true)}
              className="p-2 text-slate-500 hover:text-amber-500 rounded-xl border border-slate-200 dark:border-slate-800"
              title="Supabase Config"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsCapacitorOpen(true)}
              className="p-2 text-slate-500 hover:text-amber-500 rounded-xl border border-slate-200 dark:border-slate-800"
              title="Native Mobile APK Instructions"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            <ThemeToggle />

            {/* User Profile Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200">
                {currentUser.name}
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
      />
      <DatabaseConfigModal isOpen={isDbOpen} onClose={() => setIsDbOpen(false)} />
      <CapacitorGuideModal isOpen={isCapacitorOpen} onClose={() => setIsCapacitorOpen(false)} />
    </>
  );
};
