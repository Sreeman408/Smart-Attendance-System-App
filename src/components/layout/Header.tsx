import React, { useState } from 'react';
import { UniversityLogo } from '../common/UniversityLogo';
import { User, Role } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';
import { ProfileModal } from '../profile/ProfileModal';
import { LogOut, ChevronDown, ShieldCheck } from 'lucide-react';

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
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Identity */}
          <UniversityLogo size="sm" showText={true} />

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Parent Child Selector (Only visible for parent role) */}
            {activeRole === 'parent' && onSelectChild && studentsList.length > 0 && (
              <select
                value={selectedChildId}
                onChange={e => onSelectChild(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl focus:outline-none cursor-pointer"
              >
                {studentsList.map(s => (
                  <option key={s.id} value={s.id}>
                    Child: {s.name} ({s.rollNo})
                  </option>
                ))}
              </select>
            )}

            {/* Role Badge - Locked to assigned role unless Admin */}
            <div className="relative">
              {isAdmin ? (
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="capitalize">{activeRole} Portal</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="capitalize">{currentUser.role} Portal</span>
                </div>
              )}

              {isAdmin && showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50">
                  {(['admin', 'faculty', 'student', 'parent'] as Role[]).map(r => (
                    <button
                      key={r}
                      onClick={() => { onRoleChange(r); setShowRoleDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold capitalize hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        activeRole === r ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r} Portal
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {(currentUser?.name || 'Admin').charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200">
                {currentUser?.name || 'Admin'}
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
    </>
  );
};
