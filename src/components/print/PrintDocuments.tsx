import React from 'react';
import { Printer, X } from 'lucide-react';
import {
  FeePayment,
  PayrollRecord,
  SchoolProfile,
  StaffMember,
  Student,
  ExamRecord,
} from '../../types/school';
import { formatDateIN, formatINR, summarizeMarks } from '../../utils/formatters';

interface PrintModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function PrintPreviewModal({ title, onClose, children }: PrintModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
      <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col print:max-w-none print:max-h-none print:border-none print:rounded-none">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 no-print">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (B&amp;W Ink-Efficient)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Close print preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto print-only-container">{children}</div>
      </div>
    </div>
  );
}

export function FeeReceiptPrint({
  school,
  student,
  payment,
}: {
  school: SchoolProfile;
  student: Student;
  payment: FeePayment;
}) {
  return (
    <div className="print-bw-sheet border border-slate-900 p-6 text-black bg-white text-sm">
      <div className="border-b border-black pb-3 mb-4 flex items-center gap-4">
        <img
          src="/assets/aistudio/Rajal_School_Logo_Color_JPG_200f2d07.jpg"
          alt="School Logo"
          referrerPolicy="no-referrer"
          className="w-16 h-16 object-contain shrink-0 grayscale"
        />
        <div className="flex-1 text-center pr-12">
          <h2 className="text-lg font-bold uppercase tracking-wide">{school.schoolName}</h2>
          <p className="text-xs mt-0.5">{school.address}</p>
          <p className="text-xs mt-0.5">
            UDISE: {school.diseCode} · RTE Code: {school.rtePortalCode} · Ph: {school.contactPhone}
          </p>
          <div className="mt-2 inline-block border border-black px-3 py-0.5 text-xs font-bold uppercase">
            Official Fee Receipt
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-1.5 gap-x-6 text-xs mb-4">
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Receipt No:</span>
          <span className="font-mono-num">{payment.receiptNo}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Date:</span>
          <span className="font-mono-num">{formatDateIN(payment.date)}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Student Name:</span>
          <span>{student.name}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">SR Number:</span>
          <span className="font-mono-num">{student.srNo}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Father&apos;s Name:</span>
          <span>{student.fatherName}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Class &amp; Section:</span>
          <span>
            {student.className} ({student.section})
          </span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Fee Period:</span>
          <span>{payment.feePeriod}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Payment Mode:</span>
          <span>{payment.paymentMode}</span>
        </div>
      </div>

      <table className="w-full border-collapse border border-black text-xs mb-4">
        <thead>
          <tr>
            <th className="border border-black px-3 py-2 text-left">Fee Particulars</th>
            <th className="border border-black px-3 py-2 text-right">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-3 py-2">
              Tuition Fee {payment.rteExempted ? '(RTE 25% Quota — 100% Exempted)' : ''}
            </td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(payment.tuitionAmount)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-3 py-2">School Bus / Transport Fee</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(payment.transportAmount)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-3 py-2">Exam / Activity / Other Charges</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(payment.otherAmount)}
            </td>
          </tr>
          <tr className="font-bold">
            <td className="border border-black px-3 py-2 text-right">Total Paid</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(payment.totalPaid)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex items-end justify-between text-xs pt-6">
        <div>
          <p className="font-semibold">Remarks:</p>
          <p>{payment.remarks || 'Fee received with thanks.'}</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-black mb-1" />
          <p className="font-semibold">Authorized Signatory / Cashier</p>
        </div>
      </div>
    </div>
  );
}

export function SalarySlipPrint({
  school,
  staff,
  payroll,
}: {
  school: SchoolProfile;
  staff: StaffMember;
  payroll: PayrollRecord;
}) {
  const grossEarnings = payroll.baseSalary + payroll.allowances;
  const totalDeductions = payroll.pfDeduction + payroll.leaveDeduction;

  return (
    <div className="print-bw-sheet border border-black p-6 text-black bg-white text-sm">
      <div className="border-b border-black pb-3 mb-4 flex items-center gap-4">
        <img
          src="/assets/aistudio/Rajal_School_Logo_Color_JPG_200f2d07.jpg"
          alt="School Logo"
          referrerPolicy="no-referrer"
          className="w-16 h-16 object-contain shrink-0 grayscale"
        />
        <div className="flex-1 text-center pr-12">
          <h2 className="text-lg font-bold uppercase tracking-wide">{school.schoolName}</h2>
          <p className="text-xs mt-0.5">{school.address}</p>
          <div className="mt-2 inline-block border border-black px-3 py-0.5 text-xs font-bold uppercase">
            Salary Slip — {payroll.monthLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-1.5 gap-x-6 text-xs mb-4">
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Employee ID:</span>
          <span className="font-mono-num">{staff.empId}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Employee Name:</span>
          <span>{staff.name}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Designation:</span>
          <span>{staff.designation}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Joining Date:</span>
          <span className="font-mono-num">{formatDateIN(staff.joiningDate)}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Bank &amp; A/C No:</span>
          <span className="font-mono-num">
            {staff.bankName} · {staff.accountNumber}
          </span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">IFSC Code:</span>
          <span className="font-mono-num">{staff.ifscCode}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Attendance Summary:</span>
          <span className="font-mono-num">
            {payroll.presentDays}/{payroll.workingDays} Days (CL: {payroll.clDays}, Half:{' '}
            {payroll.halfDays}, LWP: {payroll.unpaidLeaveDays})
          </span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Payment Status:</span>
          <span>
            {payroll.status} {payroll.paidOn ? `(${formatDateIN(payroll.paidOn)})` : ''}
          </span>
        </div>
      </div>

      <table className="w-full border-collapse border border-black text-xs mb-4">
        <thead>
          <tr>
            <th className="border border-black px-3 py-2 text-left">Earnings</th>
            <th className="border border-black px-3 py-2 text-right">Amount</th>
            <th className="border border-black px-3 py-2 text-left">Deductions</th>
            <th className="border border-black px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-3 py-2">Basic Salary</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(payroll.baseSalary)}
            </td>
            <td className="border border-black px-3 py-2">Provident Fund (PF)</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(payroll.pfDeduction)}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-3 py-2">DA / HRA / Teaching Allowance</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(payroll.allowances)}
            </td>
            <td className="border border-black px-3 py-2">Unpaid Leave / Half-Day Deduction</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(payroll.leaveDeduction)}
            </td>
          </tr>
          <tr className="font-bold">
            <td className="border border-black px-3 py-2">Gross Earnings</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(grossEarnings)}
            </td>
            <td className="border border-black px-3 py-2">Total Deductions</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {formatINR(totalDeductions)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="border border-black px-4 py-2.5 flex items-center justify-between font-bold text-sm mb-8">
        <span>Net Salary Payable</span>
        <span className="font-mono-num">{formatINR(payroll.netPayable)}</span>
      </div>

      <div className="flex items-end justify-between text-xs pt-4">
        <div className="text-center">
          <div className="w-36 border-b border-black mb-1" />
          <span>Employee Signature</span>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-black mb-1" />
          <span>Principal / DDO Signature</span>
        </div>
      </div>
    </div>
  );
}

export function MarksheetPrint({
  school,
  student,
  exam,
  attendancePct,
}: {
  school: SchoolProfile;
  student: Student;
  exam: ExamRecord;
  attendancePct: number;
}) {
  const summary = summarizeMarks(exam.marks);

  return (
    <div className="print-bw-sheet border border-black p-6 text-black bg-white text-sm">
      <div className="border-b border-black pb-3 mb-4 flex items-center gap-4">
        <img
          src="/assets/aistudio/Rajal_School_Logo_Color_JPG_200f2d07.jpg"
          alt="School Logo"
          referrerPolicy="no-referrer"
          className="w-16 h-16 object-contain shrink-0 grayscale"
        />
        <div className="flex-1 text-center pr-12">
          <h2 className="text-lg font-bold uppercase tracking-wide">{school.schoolName}</h2>
          <p className="text-xs mt-0.5">{school.address}</p>
          <p className="text-xs mt-0.5">
            UDISE: {school.diseCode} · Affiliation: {school.affiliation}
          </p>
          <div className="mt-2 inline-block border border-black px-3 py-0.5 text-xs font-bold uppercase">
            Progress Report / Marksheet — {exam.term} ({exam.academicYear})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-1.5 gap-x-6 text-xs mb-4">
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Student Name:</span>
          <span>{student.name}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">SR Number:</span>
          <span className="font-mono-num">{student.srNo}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Father&apos;s Name:</span>
          <span>{student.fatherName}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Mother&apos;s Name:</span>
          <span>{student.motherName}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">Class &amp; Roll No:</span>
          <span>
            {student.className} ({student.section}) · Roll {student.rollNo}
          </span>
        </div>
        <div className="flex justify-between border-b border-dotted border-slate-400 pb-1">
          <span className="font-semibold">APAAR ID / DOB:</span>
          <span className="font-mono-num">
            {student.apaarId} · {formatDateIN(student.dob)}
          </span>
        </div>
      </div>

      <table className="w-full border-collapse border border-black text-xs mb-4">
        <thead>
          <tr>
            <th className="border border-black px-3 py-2 text-left">Subject</th>
            <th className="border border-black px-3 py-2 text-right">Max Marks</th>
            <th className="border border-black px-3 py-2 text-right">Marks Obtained</th>
            <th className="border border-black px-3 py-2 text-right">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {exam.marks.map((m) => {
            const pct = m.maxMarks > 0 ? ((m.obtainedMarks / m.maxMarks) * 100).toFixed(1) : '0.0';
            return (
              <tr key={m.subject}>
                <td className="border border-black px-3 py-2">{m.subject}</td>
                <td className="border border-black px-3 py-2 text-right font-mono-num">
                  {m.maxMarks}
                </td>
                <td className="border border-black px-3 py-2 text-right font-mono-num">
                  {m.obtainedMarks}
                </td>
                <td className="border border-black px-3 py-2 text-right font-mono-num">{pct}%</td>
              </tr>
            );
          })}
          <tr className="font-bold">
            <td className="border border-black px-3 py-2">Grand Total</td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {summary.totalMax}
            </td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {summary.totalObtained}
            </td>
            <td className="border border-black px-3 py-2 text-right font-mono-num">
              {summary.percentage}%
            </td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-3 border border-black p-3 text-xs mb-4">
        <div>
          <span className="font-semibold">Overall Grade:</span>{' '}
          <span className="font-mono-num font-bold">{summary.grade}</span>
        </div>
        <div>
          <span className="font-semibold">Result Status:</span> <span>{summary.status}</span>
        </div>
        <div>
          <span className="font-semibold">Attendance:</span>{' '}
          <span className="font-mono-num">{attendancePct}%</span>
        </div>
      </div>

      <div className="text-xs mb-8">
        <span className="font-semibold">Class Teacher&apos;s Remarks: </span>
        <span>{exam.teacherRemarks || 'Good academic progress.'}</span>
      </div>

      <div className="flex items-end justify-between text-xs pt-6">
        <div className="text-center">
          <div className="w-36 border-b border-black mb-1" />
          <span>Class Teacher</span>
        </div>
        <div className="text-center">
          <div className="w-36 border-b border-black mb-1" />
          <span>Parent&apos;s Signature</span>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-black mb-1" />
          <span>
            {school.principalName?.trim()
              ? `Principal (${school.principalName.trim()})`
              : 'Principal'}
          </span>
        </div>
      </div>
    </div>
  );
}
