import React, { useState } from 'react';
import {
  ShieldCheck,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student, UserRole } from '../../types/school';
import { PWAInstallButton } from '../pwa/PWAComponents';

export function LoginScreen() {
  const { db, loginWithCredentials } = useSchool();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState('');
  const [siblingMatches, setSiblingMatches] = useState<Student[]>([]);

  const handleRoleSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setIdentifier('');
    setPassword('');
    setSiblingMatches([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSiblingMatches([]);
    const result = loginWithCredentials(selectedRole, identifier, password);
    if (!result.ok) {
      if (result.multipleMatches && result.multipleMatches.length > 1) {
        setSiblingMatches(result.multipleMatches);
      } else {
        setError(result.error || 'Invalid credentials.');
      }
    }
  };

  const handleSelectStudentMatch = (studentId: string) => {
    setError('');
    const result = loginWithCredentials('student', identifier, password, studentId);
    if (!result.ok) {
      setError(result.error || 'Unable to sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Left Institutional Context Panel */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-14 h-14 rounded-full bg-white p-1 shrink-0 overflow-hidden border border-slate-700">
                <img
                  src="/assets/aistudio/Rajal_School_Logo_Color_JPG_200f2d07.jpg"
                  alt="RAJAL PUBLIC SCHOOL RAJALDESAR Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <span className="text-xs font-medium text-amber-400 tracking-wide block">
                  An English Medium School · Churu
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white text-balance leading-snug">
                  {db.schoolProfile.schoolName}
                </h1>
              </div>
            </div>

            <div className="mb-5 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
              <img
                src="/assets/aistudio/rajal_19a964fb.jpg"
                alt="RAJAL PUBLIC SCHOOL RAJALDESAR Campus Building"
                referrerPolicy="no-referrer"
                className="w-full h-44 object-cover"
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              {db.schoolProfile.address}
            </p>

            <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">UDISE+ Code</span>
                <span className="font-mono-num text-white">{db.schoolProfile.diseCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">RTE Portal Code</span>
                <span className="font-mono-num text-white">{db.schoolProfile.rtePortalCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Academic Session</span>
                <span className="font-mono-num text-white">{db.schoolProfile.academicSession}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Affiliation</span>
                <span className="text-right text-slate-200">{db.schoolProfile.affiliation}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            Office Helpline: <span className="font-mono-num text-slate-200">{db.schoolProfile.contactPhone}</span> ·{' '}
            <span>{db.schoolProfile.contactEmail}</span>
          </div>
        </div>

        {/* Right Sign-In Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">School ERP &amp; RTE Portal Login</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select your portal role and sign in with your registered Mobile Number, Email, or School ID.
            </p>
          </div>

          {/* Segmented Role Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedRole === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Principal / Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch('teacher')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedRole === 'teacher'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Teacher</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch('student')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedRole === 'student'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Student / Parent</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {selectedRole === 'student'
                    ? 'Parent Mobile Number, Email, or Student SR No'
                    : 'Mobile Number, Email, or Employee ID'}
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Mobile / <Mail className="w-3 h-3" /> Email
                </span>
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setSiblingMatches([]);
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder={
                  selectedRole === 'admin'
                    ? 'e.g. 9829010001, principal@rajalpublicschool.edu.in, or EMP-RJ-001'
                    : selectedRole === 'teacher'
                      ? 'e.g. 9414022314, sunita.sharma@rajalpublicschool.edu.in, or EMP-RJ-002'
                      : 'e.g. 9829044112, mahesh.sharma@gmail.com, or SR-2024-0101'
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSiblingMatches([]);
                  }}
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter your portal password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {siblingMatches.length > 1 && (
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                <p className="text-xs font-semibold text-blue-900">
                  Multiple students are linked to this Mobile / Email. Select a student profile:
                </p>
                <div className="space-y-1.5">
                  {siblingMatches.map((stu) => (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => handleSelectStudentMatch(stu.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-blue-100/60 border border-blue-200 rounded-md text-xs text-left transition-colors"
                    >
                      <span className="font-semibold text-slate-900">
                        {stu.name} ({stu.className})
                      </span>
                      <span className="font-mono-num text-blue-800">{stu.srNo} →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowHelp((prev) => !prev)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {showHelp ? 'Hide First-Time Access Details' : 'First-Time Login / Default Credentials'}
                </span>
              </button>

              <PWAInstallButton />
            </div>

            {showHelp && (
              <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <div>
                  <strong>Principal / Admin:</strong> Mobile <code className="font-mono-num">9829010001</code>, Email{' '}
                  <code className="font-mono-num">principal@rajalpublicschool.edu.in</code> (or{' '}
                  <code className="font-mono-num">office@rajalpublicschool.edu.in</code> / <code className="font-mono-num">EMP-RJ-001</code>) · Password{' '}
                  <code className="font-mono-num">rajal@123</code>
                </div>
                <div>
                  <strong>Teacher:</strong> Mobile <code className="font-mono-num">9414022314</code>, Email{' '}
                  <code className="font-mono-num">sunita.sharma@rajalpublicschool.edu.in</code> (or <code className="font-mono-num">EMP-RJ-002</code>) · Default Password{' '}
                  <code className="font-mono-num">teacher@123</code>
                </div>
                <div>
                  <strong>Student / Parent:</strong> Mobile <code className="font-mono-num">9829044112</code>, Email{' '}
                  <code className="font-mono-num">mahesh.sharma@gmail.com</code> (or <code className="font-mono-num">SR-2024-0101</code>) · Default Password{' '}
                  <code className="font-mono-num">student@123</code>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  You can update staff/student mobile numbers &amp; emails in their profiles and change passwords inside{' '}
                  <strong>Timetable &amp; Notices → School Settings</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
