/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { NAV_ITEMS, NavSection, Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardHome } from './components/modules/DashboardHome';
import { StudentsModule } from './components/modules/StudentsModule';
import { RteComplianceModule } from './components/modules/RteComplianceModule';
import { AttendanceModule } from './components/modules/AttendanceModule';
import { FeesModule } from './components/modules/FeesModule';
import { StaffPayrollModule } from './components/modules/StaffPayrollModule';
import { TransportModule } from './components/modules/TransportModule';
import { ExamsModule } from './components/modules/ExamsModule';
import { AcademicsNoticesModule } from './components/modules/AcademicsNoticesModule';
import { OfflineIndicator } from './components/pwa/PWAComponents';

function SchoolShell() {
  const { currentUser } = useSchool();
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ensure activeSection is valid for the current role
  useEffect(() => {
    if (!currentUser) return;
    const allowed = NAV_ITEMS.some(
      (item) => item.id === activeSection && item.roles.includes(currentUser.role)
    );
    if (!allowed) {
      setActiveSection('dashboard');
    }
  }, [currentUser, activeSection]);

  if (!currentUser) {
    return (
      <>
        <LoginScreen />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          activeSection={activeSection}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          {activeSection === 'dashboard' && <DashboardHome onNavigate={setActiveSection} />}
          {activeSection === 'students' && <StudentsModule />}
          {activeSection === 'rte' && <RteComplianceModule />}
          {activeSection === 'attendance' && <AttendanceModule />}
          {activeSection === 'fees' && <FeesModule />}
          {activeSection === 'staff' && <StaffPayrollModule />}
          {activeSection === 'transport' && <TransportModule />}
          {activeSection === 'exams' && <ExamsModule />}
          {activeSection === 'academics' && <AcademicsNoticesModule initialTab="notices" />}
          {activeSection === 'settings' && <AcademicsNoticesModule initialTab="settings" />}
        </main>
      </div>
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <SchoolProvider>
      <SchoolShell />
    </SchoolProvider>
  );
}
