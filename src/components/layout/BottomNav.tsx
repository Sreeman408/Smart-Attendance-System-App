import React from 'react';
import {
  Calendar, LayoutDashboard, QrCode, Clock, FileText,
  Users, CheckSquare, FileSpreadsheet, Settings, Upload, Shield
} from 'lucide-react';
import { Role } from '../../types';

export interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

interface Props {
  activeRole: Role;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pendingLeavesCount?: number;
  pendingApprovalsCount?: number;
}

export const BottomNav: React.FC<Props> = ({
  activeRole,
  activeTab,
  onTabChange,
  pendingLeavesCount = 0,
  pendingApprovalsCount = 0
}) => {
  const getNavItems = (): NavItem[] => {
    switch (activeRole) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'qr', label: 'Scan QR', icon: QrCode },
          { id: 'timetable', label: 'Schedule', icon: Clock },
          { id: 'leaves', label: 'Leaves', icon: FileText }
        ];

      case 'faculty':
        return [
          { id: 'dashboard', label: 'Roster', icon: LayoutDashboard },
          { id: 'mark', label: 'Mark Class', icon: CheckSquare },
          { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
          { id: 'qr_gen', label: 'QR Generator', icon: QrCode },
          { id: 'timetable', label: 'Schedule', icon: Clock },
          { id: 'leaves', label: 'Leaves', icon: FileText }
        ];

      case 'parent':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'calendar', label: 'Ward Calendar', icon: Calendar },
          { id: 'timetable', label: 'Schedule', icon: Clock },
          { id: 'leaves', label: 'Leaves', icon: FileText }
        ];

      case 'admin':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'crud', label: 'Management', icon: Settings },
          { id: 'approvals', label: 'Approvals', icon: Shield, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined },
          { id: 'timetable', label: 'Timetable', icon: Clock },
          { id: 'saturday', label: 'Saturday', icon: Calendar },
          { id: 'bulk', label: 'Bulk Upload', icon: Upload }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Fixed at Bottom on mobile screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe md:hidden transition-colors shadow-lg">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-red-900 to-amber-500 rounded-b-full shadow-xs" />
                )}

                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] mt-1 tracking-tight truncate max-w-[68px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar (Rendered on md+ screens) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-2 shrink-0 min-h-[calc(100vh-65px)]">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {activeRole} Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-red-900 via-red-800 to-amber-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </aside>
    </>
  );
};
