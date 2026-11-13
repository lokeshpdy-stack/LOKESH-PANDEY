import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { NAV_ITEMS, NavSection } from './Sidebar';
import { PWAInstallButton } from '../pwa/PWAComponents';

interface TopbarProps {
  activeSection: NavSection;
  onOpenMobile: () => void;
}

export function Topbar({ activeSection, onOpenMobile }: TopbarProps) {
  const { db, currentUser, logout } = useSchool();

  if (!currentUser) return null;

  const currentNav = NAV_ITEMS.find((i) => i.id === activeSection);
  const title =
    currentUser.role === 'teacher' && activeSection === 'staff'
      ? 'My Salary Slips'
      : currentUser.role === 'student' && activeSection === 'transport'
        ? 'Live Bus Tracker'
        : currentNav?.label || 'Dashboard';

  const roleBadge =
    currentUser.role === 'admin'
      ? 'Principal / Admin'
      : currentUser.role === 'teacher'
        ? 'Teacher'
        : 'Student / Parent';

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src="/assets/aistudio/Rajal_School_Logo_Color_JPG_200f2d07.jpg"
          alt="RAJAL PUBLIC SCHOOL RAJALDESAR Logo"
          referrerPolicy="no-referrer"
          className="lg:hidden w-8 h-8 rounded-full object-contain border border-slate-200 bg-white shrink-0"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate">{db.schoolProfile.schoolName}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-700 font-medium whitespace-nowrap">
              UDISE {db.schoolProfile.diseCode}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <PWAInstallButton compact />

        <div className="hidden sm:block text-right">
          <div className="text-xs font-semibold text-slate-900">{currentUser.name}</div>
          <div className="text-[11px] text-slate-500 font-mono-num">
            {roleBadge} · {currentUser.identifier}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
