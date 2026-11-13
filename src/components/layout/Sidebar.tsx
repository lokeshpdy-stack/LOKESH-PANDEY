import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CalendarCheck2,
  IndianRupee,
  Briefcase,
  Bus,
  Award,
  BookOpenCheck,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { UserRole } from '../../types/school';
import { useSchool } from '../../context/SchoolContext';

export type NavSection =
  | 'dashboard'
  | 'students'
  | 'rte'
  | 'attendance'
  | 'fees'
  | 'staff'
  | 'transport'
  | 'exams'
  | 'academics'
  | 'settings';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.FC<{ className?: string }>;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    id: 'students',
    label: 'Students (SIS)',
    icon: Users,
    roles: ['admin', 'teacher'],
  },
  {
    id: 'rte',
    label: 'RTE Rajasthan Sync',
    icon: FileSpreadsheet,
    roles: ['admin'],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: CalendarCheck2,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    id: 'fees',
    label: 'Fee Management',
    icon: IndianRupee,
    roles: ['admin', 'student'],
  },
  {
    id: 'staff',
    label: 'Staff & Payroll',
    icon: Briefcase,
    roles: ['admin', 'teacher'],
  },
  {
    id: 'transport',
    label: 'School Bus & Routes',
    icon: Bus,
    roles: ['admin', 'student'],
  },
  {
    id: 'exams',
    label: 'Exams & Results',
    icon: Award,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    id: 'academics',
    label: 'Timetable & Notices',
    icon: BookOpenCheck,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    id: 'settings',
    label: 'School Settings',
    icon: Settings,
    roles: ['admin'],
  },
];

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { db, currentUser, logout } = useSchool();

  if (!currentUser) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role)).map(
    (item) => {
      if (currentUser.role === 'teacher' && item.id === 'staff') {
        return { ...item, label: 'My Salary Slips' };
      }
      if (currentUser.role === 'student' && item.id === 'transport') {
        return { ...item, label: 'Live Bus Tracker' };
      }
      if (currentUser.role === 'student' && item.id === 'fees') {
        return { ...item, label: 'Fee Status & Receipts' };
      }
      return item;
    }
  );

  const roleLabel =
    currentUser.role === 'admin'
      ? 'Principal / Admin'
      : currentUser.role === 'teacher'
        ? 'Teacher Portal'
        : 'Student / Parent';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-64 border-r border-slate-800">
      <div className="px-4 py-4 border-b border-slate-800 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white p-0.5 shrink-0 overflow-hidden">
            <img
              src="/assets/aistudio/Rajal_School_Logo_Color_JPG_200f2d07.jpg"
              alt="RAJAL PUBLIC SCHOOL RAJALDESAR Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tracking-tight truncate">
              {db.schoolProfile.schoolName}
            </div>
            <div className="text-[11px] text-amber-400 font-medium mt-0.5 truncate">
              {roleLabel} · {db.schoolProfile.academicSession}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1 text-slate-400 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-slate-800/70 text-xs">
          <div className="font-semibold text-white truncate">{currentUser.name}</div>
          <div className="text-slate-400 font-mono-num mt-0.5">{currentUser.identifier}</div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-300 hover:bg-red-950/50 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 no-print">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
