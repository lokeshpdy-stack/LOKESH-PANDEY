import React, { useState, useMemo } from 'react';
import { Plus, Printer, CheckCircle2, Clock, X, Pencil, Trash2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  StaffAttendanceStatus,
  StaffMember,
  PayrollRecord,
  SCHOOL_CLASSES,
  SchoolClass,
} from '../../types/school';
import { formatDateIN, formatINR } from '../../utils/formatters';
import { PrintPreviewModal, SalarySlipPrint } from '../print/PrintDocuments';

const MONTHS_OPTIONS = [
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-09', label: 'September 2026' },
];

const EMPTY_STAFF: Omit<StaffMember, 'id'> = {
  empId: '',
  name: '',
  designation: '',
  department: 'Teaching',
  assignedClasses: ['Class 1'],
  qualification: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  phone: '',
  email: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  baseSalary: 30000,
  allowances: 5000,
  pfDeduction: 1800,
  clBalance: 12,
};

export function StaffPayrollModule() {
  const {
    db,
    currentUser,
    addStaff,
    updateStaff,
    deleteStaff,
    markStaffAttendance,
    generateMonthlyPayroll,
    updatePayrollRecord,
    deletePayrollRecord,
    togglePayrollStatus,
  } = useSchool();

  const isTeacher = currentUser?.role === 'teacher';
  const [tab, setTab] = useState<'payroll' | 'attendance' | 'directory'>('payroll');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [attDate, setAttDate] = useState('2026-11-12');
  const [printingSlip, setPrintingSlip] = useState<{
    staff: StaffMember;
    payroll: PayrollRecord;
  } | null>(null);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<Omit<StaffMember, 'id'>>(EMPTY_STAFF);

  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);

  const monthObj = MONTHS_OPTIONS.find((m) => m.value === selectedMonth) || MONTHS_OPTIONS[0];

  const visiblePayroll = useMemo(() => {
    if (isTeacher && currentUser?.staffId) {
      return db.payroll.filter((p) => p.staffId === currentUser.staffId);
    }
    return db.payroll.filter((p) => p.month === selectedMonth);
  }, [db.payroll, isTeacher, currentUser, selectedMonth]);

  const openAddStaff = () => {
    setEditingStaffId(null);
    setStaffForm({
      ...EMPTY_STAFF,
      empId: `EMP-RJ-00${db.staff.length + 1}`,
    });
    setStaffModalOpen(true);
  };

  const openEditStaff = (member: StaffMember) => {
    setEditingStaffId(member.id);
    const { id: _id, ...rest } = member;
    setStaffForm(rest);
    setStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaffId) {
      updateStaff({ id: editingStaffId, ...staffForm });
    } else {
      addStaff(staffForm);
    }
    setStaffModalOpen(false);
  };

  const handleSavePayrollEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;
    const netPayable = Math.max(
      0,
      Number(editingPayroll.baseSalary) +
        Number(editingPayroll.allowances) -
        Number(editingPayroll.pfDeduction) -
        Number(editingPayroll.leaveDeduction)
    );
    updatePayrollRecord({
      ...editingPayroll,
      netPayable,
    });
    setEditingPayroll(null);
  };

  const toggleClassAssignment = (cls: SchoolClass) => {
    setStaffForm((prev) => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(cls)
        ? prev.assignedClasses.filter((c) => c !== cls)
        : [...prev.assignedClasses, cls],
    }));
  };

  // Teacher personal salary slips view
  if (isTeacher) {
    const me = db.staff.find((s) => s.id === currentUser?.staffId);
    return (
      <div className="space-y-6">
        {me && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-num text-slate-500">
                {me.empId} · {me.designation}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{me.name}</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Bank: {me.bankName} ({me.accountNumber}) · IFSC:{' '}
                <span className="font-mono-num">{me.ifscCode}</span> · CL Balance:{' '}
                <span className="font-mono-num font-semibold">{me.clBalance} days</span>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500">Monthly Gross Package</div>
              <div className="text-xl font-bold font-mono-num text-slate-900">
                {formatINR(me.baseSalary + me.allowances)}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">My Monthly Salary Slips</h3>
          </div>
          {visiblePayroll.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No salary slips processed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-right">Present / Working</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">PF + Leave Ded.</th>
                    <th className="px-4 py-3 text-right">Net Payable</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Salary Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePayroll.map((pay) => {
                    const staff = db.staff.find((s) => s.id === pay.staffId);
                    return (
                      <tr key={pay.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {pay.monthLabel}
                        </td>
                        <td className="px-4 py-3 text-right font-mono-num">
                          {pay.presentDays} / {pay.workingDays}
                        </td>
                        <td className="px-4 py-3 text-right font-mono-num">
                          {formatINR(pay.baseSalary + pay.allowances)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono-num text-red-700">
                          -{formatINR(pay.pfDeduction + pay.leaveDeduction)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                          {formatINR(pay.netPayable)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              pay.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {pay.status === 'Paid' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {pay.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {staff && (
                            <button
                              type="button"
                              onClick={() => setPrintingSlip({ staff, payroll: pay })}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold inline-flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Slip</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {printingSlip && (
          <PrintPreviewModal
            title={`Salary Slip — ${printingSlip.staff.name} (${printingSlip.payroll.monthLabel})`}
            onClose={() => setPrintingSlip(null)}
          >
            <SalarySlipPrint
              school={db.schoolProfile}
              staff={printingSlip.staff}
              payroll={printingSlip.payroll}
            />
          </PrintPreviewModal>
        )}
      </div>
    );
  }

  // Principal / Admin Full Staff & Payroll View
  const totalPayrollOutflow = visiblePayroll.reduce((acc, p) => acc + p.netPayable, 0);
  const paidCount = visiblePayroll.filter((p) => p.status === 'Paid').length;

  return (
    <div className="space-y-5">
      {/* Top Tabs & Primary Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('payroll')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              tab === 'payroll'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Payroll &amp; Slips
          </button>
          <button
            type="button"
            onClick={() => setTab('attendance')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              tab === 'attendance'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Attendance &amp; Leave
          </button>
          <button
            type="button"
            onClick={() => setTab('directory')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              tab === 'directory'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Directory ({db.staff.length})
          </button>
        </div>

        <button
          type="button"
          onClick={openAddStaff}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Payroll Tab */}
      {tab === 'payroll' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="font-semibold text-slate-700">Payroll Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                {MONTHS_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <span className="text-slate-500">
                Total Net:{' '}
                <strong className="font-mono-num text-slate-900">
                  {formatINR(totalPayrollOutflow)}
                </strong>{' '}
                · {paidCount}/{visiblePayroll.length} Paid
              </span>
            </div>

            <button
              type="button"
              onClick={() => generateMonthlyPayroll(monthObj.value, monthObj.label)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              Process / Recalculate Payroll
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {visiblePayroll.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm text-slate-600">
                  Payroll has not been generated for {monthObj.label} yet.
                </p>
                <button
                  type="button"
                  onClick={() => generateMonthlyPayroll(monthObj.value, monthObj.label)}
                  className="px-4 py-2 bg-blue-800 text-white text-xs font-semibold rounded-lg"
                >
                  Generate {monthObj.label} Payroll Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="px-4 py-3">Staff Member</th>
                      <th className="px-4 py-3 text-right">Base + Allow.</th>
                      <th className="px-4 py-3 text-right">Leaves (CL / Half / LWP)</th>
                      <th className="px-4 py-3 text-right">PF + Leave Ded.</th>
                      <th className="px-4 py-3 text-right">Net Payable</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visiblePayroll.map((pay) => {
                      const member = db.staff.find((s) => s.id === pay.staffId);
                      if (!member) return null;
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{member.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono-num">
                              {member.empId} · {member.designation}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num">
                            {formatINR(pay.baseSalary + pay.allowances)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num text-slate-600">
                            {pay.clDays} / {pay.halfDays} / {pay.unpaidLeaveDays}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num text-red-700">
                            -{formatINR(pay.pfDeduction + pay.leaveDeduction)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                            {formatINR(pay.netPayable)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => togglePayrollStatus(pay.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors ${
                                pay.status === 'Paid'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                              }`}
                            >
                              {pay.status === 'Paid' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              <span>{pay.status}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingPayroll(pay)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                                title="Edit Payroll Amounts"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPrintingSlip({ staff: member, payroll: pay })}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold inline-flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Slip</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePayrollRecord(pay.id)}
                                className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50"
                                title="Delete Payroll Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      )}

      {/* Staff Attendance & Leave Tab */}
      {tab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Staff Attendance &amp; Leave</h3>
              <p className="text-xs text-slate-500">
                Unpaid Leaves &amp; Half Days automatically calculate per-day salary deductions in
                Payroll.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="font-semibold text-slate-700">Date:</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono-num"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">CL Balance</th>
                  <th className="px-4 py-3 text-right">Status on {formatDateIN(attDate)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.staff.map((member) => {
                  const rec = db.staffAttendance.find(
                    (a) => a.staffId === member.id && a.date === attDate
                  );
                  const currentStatus: StaffAttendanceStatus = rec?.status || 'Present';
                  return (
                    <tr key={member.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        <div className="text-[11px] font-mono-num text-slate-500">
                          {member.empId} · {member.designation}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{member.department}</td>
                      <td className="px-4 py-3 text-right font-mono-num font-semibold">
                        {member.clBalance} days
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                          {(['Present', 'CL', 'Half Day', 'Unpaid Leave'] as StaffAttendanceStatus[]).map(
                            (st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => markStaffAttendance(member.id, attDate, st)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                  currentStatus === st
                                    ? st === 'Present'
                                      ? 'bg-emerald-700 text-white'
                                      : st === 'Unpaid Leave'
                                        ? 'bg-red-700 text-white'
                                        : 'bg-amber-600 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Directory Tab */}
      {tab === 'directory' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-3">Emp ID</th>
                  <th className="px-4 py-3">Name &amp; Qualification</th>
                  <th className="px-4 py-3">Designation &amp; Classes</th>
                  <th className="px-4 py-3">Bank / IFSC</th>
                  <th className="px-4 py-3 text-right">Base Salary</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.staff.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono-num font-semibold text-slate-800 whitespace-nowrap">
                      {m.empId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.qualification} · Joined {formatDateIN(m.joiningDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{m.designation}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.assignedClasses.length > 0 ? m.assignedClasses.join(', ') : m.department}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono-num text-[11px] text-slate-600">
                      <div>
                        {m.bankName} · {m.accountNumber}
                      </div>
                      <div className="text-slate-400">IFSC: {m.ifscCode}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold">
                      {formatINR(m.baseSalary)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditStaff(m)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Edit Staff"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {m.id !== currentUser?.staffId && (
                          <button
                            type="button"
                            onClick={() => deleteStaff(m.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50"
                            title="Delete Staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Payroll Record Modal */}
      {editingPayroll && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Edit Payroll — {editingPayroll.monthLabel}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPayroll(null)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayrollEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    value={editingPayroll.baseSalary}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        baseSalary: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allowances (₹)</label>
                  <input
                    type="number"
                    value={editingPayroll.allowances}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        allowances: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PF Deduction (₹)</label>
                  <input
                    type="number"
                    value={editingPayroll.pfDeduction}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        pfDeduction: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Leave Deduction (₹)
                  </label>
                  <input
                    type="number"
                    value={editingPayroll.leaveDeduction}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        leaveDeduction: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Present Days</label>
                  <input
                    type="number"
                    value={editingPayroll.presentDays}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        presentDays: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingPayroll.status}
                    onChange={(e) =>
                      setEditingPayroll({
                        ...editingPayroll,
                        status: e.target.value as 'Paid' | 'Pending',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between font-bold text-sm">
                <span>Recalculated Net Payable</span>
                <span className="font-mono-num text-blue-900">
                  {formatINR(
                    Math.max(
                      0,
                      editingPayroll.baseSalary +
                        editingPayroll.allowances -
                        editingPayroll.pfDeduction -
                        editingPayroll.leaveDeduction
                    )
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayroll(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold"
                >
                  Update Payroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingStaffId ? 'Edit Staff Profile' : 'Add New Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    required
                    value={staffForm.empId}
                    onChange={(e) => setStaffForm({ ...staffForm, empId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    required
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
                  <input
                    required
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={staffForm.department}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        department: e.target.value as StaffMember['department'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Teaching">Teaching</option>
                    <option value="Administration">Administration</option>
                    <option value="Support">Support</option>
                    <option value="Transport">Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    value={staffForm.qualification}
                    onChange={(e) => setStaffForm({ ...staffForm, qualification: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    value={staffForm.bankName}
                    onChange={(e) => setStaffForm({ ...staffForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    value={staffForm.accountNumber}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, accountNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    value={staffForm.ifscCode}
                    onChange={(e) => setStaffForm({ ...staffForm, ifscCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={staffForm.baseSalary}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, baseSalary: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allowances (₹)</label>
                  <input
                    type="number"
                    value={staffForm.allowances}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, allowances: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PF (₹)</label>
                  <input
                    type="number"
                    value={staffForm.pfDeduction}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, pfDeduction: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CL Balance</label>
                  <input
                    type="number"
                    value={staffForm.clBalance}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, clBalance: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number (for Login) *
                  </label>
                  <input
                    required
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="+91 94140 XXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email (for Login)
                  </label>
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="staff@rajalpublicschool.edu.in"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {staffForm.department === 'Teaching' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Assigned Classes
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SCHOOL_CLASSES.map((cls) => {
                      const active = staffForm.assignedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => toggleClassAssignment(cls)}
                          className={`px-2.5 py-1 rounded-md border text-[11px] font-medium ${
                            active
                              ? 'bg-blue-800 border-blue-800 text-white'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold"
                >
                  Save Staff Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Salary Slip Modal */}
      {printingSlip && (
        <PrintPreviewModal
          title={`Salary Slip — ${printingSlip.staff.name} (${printingSlip.payroll.monthLabel})`}
          onClose={() => setPrintingSlip(null)}
        >
          <SalarySlipPrint
            school={db.schoolProfile}
            staff={printingSlip.staff}
            payroll={printingSlip.payroll}
          />
        </PrintPreviewModal>
      )}
    </div>
  );
}
