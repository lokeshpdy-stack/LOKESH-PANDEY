import React, { useState, useMemo } from 'react';
import { IndianRupee, Printer, Plus, AlertCircle, X, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { FeePayment, Student } from '../../types/school';
import { formatDateIN, formatINR } from '../../utils/formatters';
import { FeeReceiptPrint, PrintPreviewModal } from '../print/PrintDocuments';

export function FeesModule() {
  const {
    db,
    currentUser,
    recordFeePayment,
    updateFeePayment,
    deleteFeePayment,
    updateFeeStructure,
  } = useSchool();

  const isStudent = currentUser?.role === 'student';
  const [tab, setTab] = useState<'ledger' | 'receipts' | 'structure'>('ledger');
  const [printingPayment, setPrintingPayment] = useState<{
    student: Student;
    payment: FeePayment;
  } | null>(null);

  const [collectModalStudent, setCollectModalStudent] = useState<Student | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [collectForm, setCollectForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    feePeriod: 'Oct - Dec 2026 (Q3)',
    tuitionAmount: 0,
    transportAmount: 0,
    otherAmount: 0,
    paymentMode: 'UPI' as FeePayment['paymentMode'],
    remarks: '',
  });

  // Compute expected annual & paid per student
  const studentLedgers = useMemo(() => {
    return db.students.map((stu) => {
      const fs = db.feeStructures.find((f) => f.className === stu.className);
      const bus = db.busRoutes.find((r) => r.id === stu.busRouteId);

      // RTE students receive automatic 100% tuition & exam fee exemption
      const annualTuitionDue = stu.isRte
        ? 0
        : (fs?.annualTuitionFee || 0) + (fs?.annualExamAndActivityFee || 0);
      // Transport is optional service: applies if assigned to a bus route (10 academic months)
      const annualTransportDue = bus ? bus.monthlyFee * 10 : 0;
      const totalAnnualDue = annualTuitionDue + annualTransportDue;

      const payments = db.feePayments.filter((p) => p.studentId === stu.id);
      const totalPaid = payments.reduce((acc, p) => acc + p.totalPaid, 0);
      const balanceDue = Math.max(0, totalAnnualDue - totalPaid);

      return {
        student: stu,
        bus,
        annualTuitionDue,
        annualTransportDue,
        totalAnnualDue,
        totalPaid,
        balanceDue,
        payments,
      };
    });
  }, [db.students, db.feeStructures, db.busRoutes, db.feePayments]);

  const openCollectModal = (stu: Student) => {
    const fs = db.feeStructures.find((f) => f.className === stu.className);
    const bus = db.busRoutes.find((r) => r.id === stu.busRouteId);
    const quarterlyTuition = stu.isRte ? 0 : (fs?.monthlyTuitionFee || 0) * 3;
    const quarterlyBus = bus ? bus.monthlyFee * 3 : 0;

    setEditingPaymentId(null);
    setCollectModalStudent(stu);
    setCollectForm({
      date: new Date().toISOString().slice(0, 10),
      feePeriod: 'Oct - Dec 2026 (Q3)',
      tuitionAmount: quarterlyTuition,
      transportAmount: quarterlyBus,
      otherAmount: 0,
      paymentMode: 'UPI',
      remarks: stu.isRte
        ? `RTE Quota — Tuition Exempted${bus ? `, Bus ${bus.routeCode} charges` : ''}`
        : `Quarterly Fee${bus ? ` + Bus ${bus.routeCode}` : ''}`,
    });
  };

  const openEditPaymentModal = (stu: Student, pay: FeePayment) => {
    setEditingPaymentId(pay.id);
    setCollectModalStudent(stu);
    setCollectForm({
      date: pay.date,
      feePeriod: pay.feePeriod,
      tuitionAmount: pay.tuitionAmount,
      transportAmount: pay.transportAmount,
      otherAmount: pay.otherAmount,
      paymentMode: pay.paymentMode,
      remarks: pay.remarks,
    });
  };

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectModalStudent) return;
    const totalPaid =
      Number(collectForm.tuitionAmount) +
      Number(collectForm.transportAmount) +
      Number(collectForm.otherAmount);

    if (editingPaymentId) {
      const existing = db.feePayments.find((p) => p.id === editingPaymentId);
      if (existing) {
        updateFeePayment({
          ...existing,
          date: collectForm.date,
          feePeriod: collectForm.feePeriod,
          tuitionAmount: Number(collectForm.tuitionAmount),
          transportAmount: Number(collectForm.transportAmount),
          otherAmount: Number(collectForm.otherAmount),
          totalPaid,
          paymentMode: collectForm.paymentMode,
          remarks: collectForm.remarks,
        });
      }
      setCollectModalStudent(null);
      setEditingPaymentId(null);
      return;
    }

    const created = recordFeePayment({
      studentId: collectModalStudent.id,
      date: collectForm.date,
      feePeriod: collectForm.feePeriod,
      tuitionAmount: Number(collectForm.tuitionAmount),
      transportAmount: Number(collectForm.transportAmount),
      otherAmount: Number(collectForm.otherAmount),
      totalPaid,
      paymentMode: collectForm.paymentMode,
      rteExempted: collectModalStudent.isRte,
      remarks: collectForm.remarks,
    });

    setPrintingPayment({ student: collectModalStudent, payment: created });
    setCollectModalStudent(null);
  };

  // Student / Parent View
  if (isStudent) {
    const myLedger =
      studentLedgers.find((l) => l.student.id === currentUser?.studentId) || studentLedgers[0];
    if (!myLedger) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Annual Fee Payable</div>
            <div className="text-2xl font-bold font-mono-num text-slate-900 mt-1">
              {formatINR(myLedger.totalAnnualDue)}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {myLedger.student.isRte
                ? 'Tuition 100% RTE Exempted'
                : `Tuition: ${formatINR(myLedger.annualTuitionDue)}`}{' '}
              {myLedger.bus ? `· Bus: ${formatINR(myLedger.annualTransportDue)}` : ''}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Total Paid</div>
            <div className="text-2xl font-bold font-mono-num text-emerald-700 mt-1">
              {formatINR(myLedger.totalPaid)}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {myLedger.payments.length} receipt(s) recorded
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Remaining Balance</div>
            <div
              className={`text-2xl font-bold font-mono-num mt-1 ${
                myLedger.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {formatINR(myLedger.balanceDue)}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {myLedger.balanceDue === 0 ? 'All dues cleared' : 'Payable at school accounts desk'}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Payment History &amp; Receipts</h3>
          </div>
          {myLedger.payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No fee payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Amount Paid</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myLedger.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-mono-num font-semibold">{p.receiptNo}</td>
                      <td className="px-4 py-3 font-mono-num">{formatDateIN(p.date)}</td>
                      <td className="px-4 py-3">{p.feePeriod}</td>
                      <td className="px-4 py-3">{p.paymentMode}</td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold">
                        {formatINR(p.totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setPrintingPayment({ student: myLedger.student, payment: p })
                          }
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold inline-flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {printingPayment && (
          <PrintPreviewModal
            title={`Fee Receipt — ${printingPayment.payment.receiptNo}`}
            onClose={() => setPrintingPayment(null)}
          >
            <FeeReceiptPrint
              school={db.schoolProfile}
              student={printingPayment.student}
              payment={printingPayment.payment}
            />
          </PrintPreviewModal>
        )}
      </div>
    );
  }

  // Admin Fee Management Console
  const pendingAlerts = studentLedgers.filter((l) => l.balanceDue > 0);
  const totalCollected = db.feePayments.reduce((acc, p) => acc + p.totalPaid, 0);

  return (
    <div className="space-y-5">
      {/* Sub-Nav + Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('ledger')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'ledger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Student Fee Ledger
          </button>
          <button
            type="button"
            onClick={() => setTab('receipts')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'receipts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Receipts ({db.feePayments.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('structure')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'structure' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Class Fee Structure
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span>
            Collected:{' '}
            <strong className="font-mono-num text-emerald-700">{formatINR(totalCollected)}</strong>
          </span>
          <span className="flex items-center gap-1 text-amber-800 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{pendingAlerts.length} students with pending balance</span>
          </span>
        </div>
      </div>

      {/* Student Ledger Tab */}
      {tab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {studentLedgers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No students enrolled yet. Add students in Students (SIS) to manage fees.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Class &amp; RTE Status</th>
                    <th className="px-4 py-3 text-right">Tuition Due</th>
                    <th className="px-4 py-3 text-right">Transport Due</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentLedgers.map((l) => (
                    <tr key={l.student.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{l.student.name}</div>
                        <div className="text-[11px] font-mono-num text-slate-500">
                          {l.student.srNo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800">{l.student.className}</div>
                        {l.student.isRte ? (
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            RTE Exempt (Tuition ₹0)
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500">Regular Paid</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num">
                        {formatINR(l.annualTuitionDue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num">
                        {l.bus ? formatINR(l.annualTransportDue) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num text-emerald-700 font-semibold">
                        {formatINR(l.totalPaid)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono-num font-bold ${
                          l.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {l.balanceDue === 0 ? (
                          <span className="inline-flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cleared
                          </span>
                        ) : (
                          formatINR(l.balanceDue)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openCollectModal(l.student)}
                          className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-md font-semibold inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Collect Fee</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Receipts Tab */}
      {tab === 'receipts' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {db.feePayments.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No fee receipts recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Date &amp; Period</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Total Paid</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.feePayments.map((pay) => {
                    const stu = db.students.find((s) => s.id === pay.studentId);
                    if (!stu) return null;
                    return (
                      <tr key={pay.id}>
                        <td className="px-4 py-3 font-mono-num font-semibold text-slate-900">
                          {pay.receiptNo}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{stu.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {stu.srNo} · {stu.className}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono-num">{formatDateIN(pay.date)}</div>
                          <div className="text-[11px] text-slate-500">{pay.feePeriod}</div>
                        </td>
                        <td className="px-4 py-3">{pay.paymentMode}</td>
                        <td className="px-4 py-3 text-right font-mono-num font-bold">
                          {formatINR(pay.totalPaid)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditPaymentModal(stu, pay)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                              title="Edit Fee Receipt"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPrintingPayment({ student: stu, payment: pay })}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold inline-flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFeePayment(pay.id)}
                              className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50"
                              title="Delete Receipt"
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
      )}

      {/* Class Fee Structure Tab */}
      {tab === 'structure' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Class-Wise Tuition &amp; Seat Capacity Configuration (Nursery/PP to Class 8)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 text-right">Monthly Tuition (₹)</th>
                  <th className="px-4 py-3 text-right">Annual Tuition (₹)</th>
                  <th className="px-4 py-3 text-right">Exam &amp; Activity (₹)</th>
                  <th className="px-4 py-3 text-right">Sanctioned Seats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.feeStructures.map((fs) => (
                  <tr key={fs.className}>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{fs.className}</td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        value={fs.monthlyTuitionFee}
                        onChange={(e) => {
                          const monthly = Number(e.target.value) || 0;
                          updateFeeStructure({
                            ...fs,
                            monthlyTuitionFee: monthly,
                            annualTuitionFee: monthly * 12,
                          });
                        }}
                        className="w-24 px-2 py-1 text-right font-mono-num border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-num text-slate-700">
                      {formatINR(fs.annualTuitionFee)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        value={fs.annualExamAndActivityFee}
                        onChange={(e) =>
                          updateFeeStructure({
                            ...fs,
                            annualExamAndActivityFee: Number(e.target.value) || 0,
                          })
                        }
                        className="w-24 px-2 py-1 text-right font-mono-num border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        value={fs.sanctionedSeats}
                        onChange={(e) =>
                          updateFeeStructure({
                            ...fs,
                            sanctionedSeats: Number(e.target.value) || 40,
                          })
                        }
                        className="w-20 px-2 py-1 text-right font-mono-num border border-slate-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect / Edit Fee Modal */}
      {collectModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPaymentId ? 'Edit Fee Receipt' : 'Record Fee Payment'}
                </h3>
                <p className="text-xs text-slate-500">
                  {collectModalStudent.name} ({collectModalStudent.className})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCollectModalStudent(null);
                  setEditingPaymentId(null);
                }}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {collectModalStudent.isRte && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                RTE 25% Quota Student: Tuition fee is automatically exempted (₹0). Only optional
                bus transport charges apply if enrolled.
              </div>
            )}

            <form onSubmit={handleCollectSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={collectForm.date}
                    onChange={(e) => setCollectForm({ ...collectForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={collectForm.paymentMode}
                    onChange={(e) =>
                      setCollectForm({
                        ...collectForm,
                        paymentMode: e.target.value as FeePayment['paymentMode'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fee Period</label>
                <input
                  required
                  value={collectForm.feePeriod}
                  onChange={(e) => setCollectForm({ ...collectForm, feePeriod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tuition (₹)</label>
                  <input
                    type="number"
                    disabled={collectModalStudent.isRte}
                    value={collectForm.tuitionAmount}
                    onChange={(e) =>
                      setCollectForm({ ...collectForm, tuitionAmount: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono-num disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bus Fee (₹)</label>
                  <input
                    type="number"
                    value={collectForm.transportAmount}
                    onChange={(e) =>
                      setCollectForm({ ...collectForm, transportAmount: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Other (₹)</label>
                  <input
                    type="number"
                    value={collectForm.otherAmount}
                    onChange={(e) =>
                      setCollectForm({ ...collectForm, otherAmount: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  value={collectForm.remarks}
                  onChange={(e) => setCollectForm({ ...collectForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between font-bold text-sm">
                <span>Total Receipt Amount</span>
                <span className="font-mono-num text-blue-900 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {formatINR(
                    Number(collectForm.tuitionAmount) +
                      Number(collectForm.transportAmount) +
                      Number(collectForm.otherAmount)
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCollectModalStudent(null);
                    setEditingPaymentId(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold"
                >
                  {editingPaymentId ? 'Save Changes' : 'Save & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printingPayment && (
        <PrintPreviewModal
          title={`Fee Receipt — ${printingPayment.payment.receiptNo}`}
          onClose={() => setPrintingPayment(null)}
        >
          <FeeReceiptPrint
            school={db.schoolProfile}
            student={printingPayment.student}
            payment={printingPayment.payment}
          />
        </PrintPreviewModal>
      )}
    </div>
  );
}
