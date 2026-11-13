import React from 'react';
import {
  Users,
  FileSpreadsheet,
  IndianRupee,
  Bus,
  AlertTriangle,
  CalendarCheck2,
  BookOpen,
  Award,
  ArrowRight,
  Phone,
  Pin,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { NavSection } from '../layout/Sidebar';
import { formatDateIN, formatINR, summarizeMarks } from '../../utils/formatters';

interface DashboardHomeProps {
  onNavigate: (section: NavSection) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { db, currentUser, getStudentAttendanceStats } = useSchool();

  if (!currentUser) return null;

  const visibleNotices = db.notices.filter((n) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'teacher') return n.audience === 'All' || n.audience === 'Teachers';
    return n.audience === 'All' || n.audience === 'Students & Parents';
  });

  if (currentUser.role === 'admin') {
    const totalStudents = db.students.length;
    const rteStudents = db.students.filter((s) => s.isRte);
    const totalSanctionedSeats = db.feeStructures.reduce((acc, f) => acc + f.sanctionedSeats, 0);
    const mandatory25Quota = Math.round(totalSanctionedSeats * 0.25);

    const totalFeeCollected = db.feePayments.reduce((acc, p) => acc + p.totalPaid, 0);
    const pendingPayroll = db.payroll.filter((p) => p.status === 'Pending');
    const pendingPayrollTotal = pendingPayroll.reduce((acc, p) => acc + p.netPayable, 0);

    const rteLowAttendance = rteStudents.filter(
      (s) => getStudentAttendanceStats(s.id).percentage < 75
    );

    const pendingReimbursementCount = rteStudents.filter(
      (s) =>
        s.rteReimbursementStatus === 'Pending Verification' ||
        s.rteReimbursementStatus === 'Claim Submitted'
    ).length;

    return (
      <div className="space-y-6">
        {/* Institutional Campus Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src="/assets/aistudio/Rajal_School_Logo_Color_JPG_200f2d07.jpg"
              alt="RAJAL PUBLIC SCHOOL RAJALDESAR Logo"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-contain border border-slate-200 p-0.5 shrink-0 bg-white"
            />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {db.schoolProfile.schoolName}
              </h2>
              <p className="text-xs text-slate-600 truncate">{db.schoolProfile.address}</p>
              <p className="text-[11px] text-slate-500 font-mono-num mt-0.5">
                UDISE: {db.schoolProfile.diseCode} · RTE Code: {db.schoolProfile.rtePortalCode} ·
                Session {db.schoolProfile.academicSession}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              Edit School Details
            </button>
            <img
              src="/assets/aistudio/rajal_19a964fb.jpg"
              alt="RAJAL PUBLIC SCHOOL RAJALDESAR Building"
              referrerPolicy="no-referrer"
              className="w-36 sm:w-44 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
            />
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Total Enrolled Students</span>
              <Users className="w-4 h-4 text-blue-700" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-num">
              {totalStudents}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {rteStudents.length} RTE Quota · {totalStudents - rteStudents.length} General / Paid
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>RTE 25% Quota Fill</span>
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-num">
              {rteStudents.length} / {mandatory25Quota}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {pendingReimbursementCount} claims awaiting disbursement
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Fees Collected (Session)</span>
              <IndianRupee className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-num">
              {formatINR(totalFeeCollected)}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {db.feePayments.length} receipts · RTE tuition auto-exempted
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Staff Payroll Pending</span>
              <Bus className="w-4 h-4 text-slate-700" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-num">
              {formatINR(pendingPayrollTotal)}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {pendingPayroll.length} pending slip · {db.busRoutes.length} active bus routes
            </div>
          </div>
        </div>

        {/* Compliance Alert & Quick Actions */}
        {rteLowAttendance.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-950">
                  RTE Reimbursement Attendance Alert (&lt;75% Attendance)
                </h3>
                <p className="text-xs text-amber-900 mt-0.5">
                  {rteLowAttendance.map((s) => `${s.name} (${s.className})`).join(', ')} — below
                  75% attendance threshold required by Rajasthan RTE Portal (rajpsp.nic.in).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('rte')}
              className="px-3.5 py-2 bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
            >
              Review in RTE Sync
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Live Transport Summary */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Live School Bus Fleet Status</h2>
                <p className="text-xs text-slate-500">
                  Real-time route progress across Jaipur pickup zones
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transport')}
                className="text-xs font-semibold text-blue-800 hover:underline flex items-center gap-1"
              >
                <span>Manage Routes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {db.busRoutes.map((route) => {
                const currentStop = route.stops[route.currentStopIndex];
                const assignedCount = db.students.filter((s) => s.busRouteId === route.id).length;
                return (
                  <div
                    key={route.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {route.routeCode} · {route.routeName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Vehicle <span className="font-mono-num">{route.vehicleNumber}</span> · Driver:{' '}
                        {route.driverName} · {assignedCount} students
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-semibold text-blue-800">{route.tripStatus}</div>
                      <div className="text-[11px] text-slate-500">
                        Stop: {currentStop?.name || '-'} ({route.lastUpdated})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notice Board */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">School Notice Board</h2>
              <button
                type="button"
                onClick={() => onNavigate('academics')}
                className="text-xs font-semibold text-blue-800 hover:underline flex items-center gap-1"
              >
                <span>Post Notice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {visibleNotices.slice(0, 3).map((notice) => (
                <div key={notice.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-1">
                    <span>
                      {notice.category} · {notice.audience}
                    </span>
                    <span className="font-mono-num flex items-center gap-1">
                      {notice.pinned && <Pin className="w-3 h-3 text-amber-600" />}
                      {formatDateIN(notice.date)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{notice.title}</div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notice.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'teacher') {
    const teacher = db.staff.find((s) => s.id === currentUser.staffId) || db.staff[1];
    const assignedStudents = db.students.filter((s) =>
      teacher.assignedClasses.includes(s.className)
    );
    const myPayrolls = db.payroll.filter((p) => p.staffId === teacher.id);
    const latestSlip = myPayrolls[0];

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">
              {teacher.empId} · {teacher.qualification}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Welcome, {teacher.name}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Assigned Classes: {teacher.assignedClasses.join(', ') || 'All Classes'} · CL Balance:{' '}
              <span className="font-mono-num font-semibold">{teacher.clBalance} days</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Mark Daily Attendance</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>Enter Exam Marks</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-500">My Assigned Students</div>
            <div className="text-2xl font-bold text-slate-900 font-mono-num mt-1">
              {assignedStudents.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="mt-2 text-xs font-semibold text-blue-800 hover:underline"
            >
              View Class Roster →
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-500">Active Homework &amp; Syllabus</div>
            <div className="text-2xl font-bold text-slate-900 font-mono-num mt-1">
              {db.homework.filter((h) => teacher.assignedClasses.includes(h.className)).length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('academics')}
              className="mt-2 text-xs font-semibold text-blue-800 hover:underline"
            >
              Update Homework / Syllabus →
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-medium text-slate-500">Latest Salary Slip</div>
            <div className="text-2xl font-bold text-slate-900 font-mono-num mt-1">
              {latestSlip ? formatINR(latestSlip.netPayable) : '-'}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('staff')}
              className="mt-2 text-xs font-semibold text-blue-800 hover:underline"
            >
              {latestSlip ? `${latestSlip.monthLabel} (${latestSlip.status})` : 'View Slips'} →
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900 mb-3">Staff &amp; School Notices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleNotices.map((notice) => (
              <div key={notice.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>{notice.category}</span>
                  <span className="font-mono-num">{formatDateIN(notice.date)}</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{notice.title}</div>
                <p className="text-xs text-slate-600 mt-1">{notice.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Student / Parent View
  const student = db.students.find((s) => s.id === currentUser.studentId) || db.students[0];
  const attStats = getStudentAttendanceStats(student.id);
  const myRoute = db.busRoutes.find((r) => r.id === student.busRouteId);
  const myStop = myRoute?.stops.find((st) => st.id === student.busStopId);
  const myPayments = db.feePayments.filter((p) => p.studentId === student.id);
  const totalPaid = myPayments.reduce((acc, p) => acc + p.totalPaid, 0);
  const myExam = db.examRecords.find((e) => e.studentId === student.id);
  const examSummary = myExam ? summarizeMarks(myExam.marks) : null;
  const myHomework = db.homework.filter((h) => h.className === student.className);

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500">
            SR No: <span className="font-mono-num text-slate-800">{student.srNo}</span> ·{' '}
            {student.className} ({student.section}) · APAAR:{' '}
            <span className="font-mono-num">{student.apaarId}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{student.name}</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Father: {student.fatherName} · Mother: {student.motherName} ·{' '}
            {student.isRte ? `RTE 25% Quota (${student.rteAppNo})` : `Category: ${student.category}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('exams')}
            className="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg"
          >
            View Report Card
          </button>
          <button
            type="button"
            onClick={() => onNavigate('fees')}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg"
          >
            Fee Receipts
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Monthly Attendance</div>
          <div
            className={`text-2xl font-bold font-mono-num mt-1 ${
              attStats.percentage < 75 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {attStats.percentage}%
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {attStats.presentDays} present of {attStats.totalDays} days
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Fee Status</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-num mt-1">
            {student.isRte && !myRoute ? 'RTE Exempt' : formatINR(totalPaid)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {student.isRte ? 'Tuition Fee 100% RTE Exempted' : `${myPayments.length} receipts paid`}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Latest Exam Result</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-num mt-1">
            {examSummary ? `${examSummary.percentage}% (${examSummary.grade})` : 'Pending'}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {myExam ? `${myExam.term} · ${examSummary?.status}` : 'Marks not published yet'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">School Bus Status</div>
          <div className="text-lg font-bold text-blue-800 mt-1 truncate">
            {myRoute ? myRoute.tripStatus : 'Self / No Bus'}
          </div>
          <div className="text-xs text-slate-600 mt-1 truncate">
            {myRoute ? `${myRoute.vehicleNumber} · ${myStop?.name}` : 'Walk / Private Drop'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Bus Progress Card for Parent */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Assigned Bus &amp; Stop Tracker</h3>
            {myRoute && (
              <button
                type="button"
                onClick={() => onNavigate('transport')}
                className="text-xs font-semibold text-blue-800 hover:underline"
              >
                Full Route View →
              </button>
            )}
          </div>

          {myRoute ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{myRoute.routeName}</span>
                  <div className="text-slate-500 mt-0.5">
                    Bus <span className="font-mono-num">{myRoute.vehicleNumber}</span> · Driver:{' '}
                    {myRoute.driverName}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono-num text-slate-800 font-medium">
                  <Phone className="w-3.5 h-3.5 text-blue-700" />
                  <span>{myRoute.driverContact}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {myRoute.stops.map((stop, idx) => {
                  const isCurrent = idx === myRoute.currentStopIndex;
                  const isMyStop = stop.id === myStop?.id;
                  const passed = idx < myRoute.currentStopIndex;
                  return (
                    <div
                      key={stop.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-300 text-blue-950 font-semibold'
                          : isMyStop
                            ? 'bg-amber-50 border-amber-200 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono-num w-5 text-center font-bold">
                          {passed ? '✓' : idx + 1}
                        </span>
                        <span className="truncate">
                          {stop.name} {isMyStop ? '(Your Stop)' : ''}
                        </span>
                      </div>
                      <span className="font-mono-num shrink-0 ml-2">
                        {stop.pickupTime} / {stop.dropTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No school bus route assigned. Contact transport office to opt into a bus route.
            </p>
          )}
        </div>

        {/* Notices & Homework */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Recent Homework</h3>
              <button
                type="button"
                onClick={() => onNavigate('academics')}
                className="text-xs font-semibold text-blue-800 hover:underline"
              >
                Timetable &amp; All Homework →
              </button>
            </div>
            {myHomework.length > 0 ? (
              <div className="space-y-2.5">
                {myHomework.map((hw) => (
                  <div key={hw.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{hw.subject}</span>
                      <span className="font-mono-num">Due {formatDateIN(hw.dueDate)}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{hw.title}</div>
                    <p className="text-xs text-slate-600 mt-0.5">{hw.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <BookOpen className="w-4 h-4" />
                <span>No pending homework for {student.className}.</span>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-base font-bold text-slate-900 mb-3">School Notices</h3>
            <div className="space-y-2.5">
              {visibleNotices.slice(0, 2).map((n) => (
                <div key={n.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{n.category}</span>
                    <span className="font-mono-num">{formatDateIN(n.date)}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">{n.title}</div>
                  <p className="text-xs text-slate-600 mt-1">{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
