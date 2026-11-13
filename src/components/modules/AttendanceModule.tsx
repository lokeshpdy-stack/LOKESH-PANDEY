import React, { useState, useMemo } from 'react';
import { CheckCheck, Printer, AlertTriangle } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { AttendanceStatus, SCHOOL_CLASSES, SchoolClass } from '../../types/school';
import { formatDateIN } from '../../utils/formatters';

export function AttendanceModule() {
  const {
    db,
    currentUser,
    markStudentAttendance,
    markClassAllPresent,
    getStudentAttendanceStats,
  } = useSchool();

  const teacher =
    currentUser?.role === 'teacher'
      ? db.staff.find((s) => s.id === currentUser.staffId)
      : undefined;

  const availableClasses: SchoolClass[] = useMemo(() => {
    if (teacher && teacher.assignedClasses.length > 0) return teacher.assignedClasses;
    return SCHOOL_CLASSES;
  }, [teacher]);

  const [selectedClass, setSelectedClass] = useState<SchoolClass>(
    availableClasses[0] || 'Class 4'
  );
  const [selectedDate, setSelectedDate] = useState('2026-11-12');

  // Student / Parent Read-Only Attendance View
  if (currentUser?.role === 'student') {
    const student = db.students.find((s) => s.id === currentUser.studentId) || db.students[0];
    const stats = getStudentAttendanceStats(student.id);
    const records = db.studentAttendance
      .filter((r) => r.studentId === student.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Attendance Percentage</div>
            <div
              className={`text-2xl font-bold font-mono-num mt-1 ${
                stats.percentage < 75 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {stats.percentage}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {student.isRte ? 'Minimum 75% required for RTE' : 'Overall session average'}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Days Present</div>
            <div className="text-2xl font-bold text-slate-900 font-mono-num mt-1">
              {stats.presentDays}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Days Absent</div>
            <div className="text-2xl font-bold text-red-700 font-mono-num mt-1">
              {stats.absentDays}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Approved Leave</div>
            <div className="text-2xl font-bold text-amber-700 font-mono-num mt-1">
              {stats.leaveDays}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Daily Attendance Log — {student.name} ({student.className})
            </h3>
            <span className="text-xs text-slate-500 font-mono-num">
              {records.length} recorded days
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 font-mono-num text-slate-800">
                      {formatDateIN(r.date)}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-semibold ${
                        r.status === 'Present'
                          ? 'text-emerald-700'
                          : r.status === 'Absent'
                            ? 'text-red-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {r.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Teacher / Admin Marking Register
  const classStudents = db.students.filter((s) => s.className === selectedClass);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 mr-2">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as SchoolClass)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
            >
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 mr-2">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={classStudents.length === 0}
            onClick={() =>
              markClassAllPresent(
                classStudents.map((s) => s.id),
                selectedDate
              )
            }
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-40"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden print-bw-sheet">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daily Attendance Register — {selectedClass} ({formatDateIN(selectedDate)})
            </h3>
            <p className="text-xs text-slate-500">
              Automated monthly percentage tracks Rajasthan RTE 75% reimbursement eligibility.
            </p>
          </div>
          <span className="text-xs font-mono-num text-slate-600">
            {classStudents.length} Students
          </span>
        </div>

        {classStudents.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No students enrolled in {selectedClass}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-3">Roll / SR No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-right">Session Days</th>
                  <th className="px-4 py-3 text-right">Monthly %</th>
                  <th className="px-4 py-3 text-right">Mark Status ({formatDateIN(selectedDate)})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((stu) => {
                  const rec = db.studentAttendance.find(
                    (a) => a.studentId === stu.id && a.date === selectedDate
                  );
                  const status: AttendanceStatus = rec?.status || 'Present';
                  const stats = getStudentAttendanceStats(stu.id);
                  const lowRteRisk = stu.isRte && stats.percentage < 75;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono-num text-slate-700 whitespace-nowrap">
                        #{stu.rollNo} · {stu.srNo}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {stu.name}{' '}
                          {stu.isRte && (
                            <span className="text-[11px] font-medium text-amber-700">
                              (RTE Quota)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">Father: {stu.fatherName}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num text-slate-700">
                        {stats.presentDays} / {stats.totalDays}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono-num font-bold ${
                          stats.percentage < 75 ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1 justify-end">
                          {lowRteRisk && <AlertTriangle className="w-3.5 h-3.5" />}
                          {stats.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg no-print">
                          {(['Present', 'Absent', 'Leave'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => markStudentAttendance(stu.id, selectedDate, st)}
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                                status === st
                                  ? st === 'Present'
                                    ? 'bg-emerald-700 text-white'
                                    : st === 'Absent'
                                      ? 'bg-red-700 text-white'
                                      : 'bg-amber-600 text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                        <span className="hidden print:inline font-semibold">{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
