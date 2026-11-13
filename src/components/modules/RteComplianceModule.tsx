import React, { useState, useMemo } from 'react';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  SCHOOL_CLASSES,
  SchoolClass,
  SocialCategory,
  RteReimbursementStatus,
  Student,
} from '../../types/school';
import { downloadCSV, formatINR, parseCSVText } from '../../utils/formatters';

const SAMPLE_RTE_LOTTERY_CSV = `SR_No,Student_Name,Father_Name,Mother_Name,DOB,Gender,Class,Category,Jan_Aadhaar,Aadhaar_Last4,APAAR_ID,Parent_Contact,RTE_App_No,Admission_Year,Address
SR-2026-0201,Kartikeya Sharma,Vinod Kumar Sharma,Pooja Sharma,2020-05-11,Male,Class 1,EWS,JA-4482-7001-11,XXXX-XXXX-7001,APAAR-9012-5501,+91 98290 70011,RTE-RJ-2026-204118,2026-27,Sector 3 Vaishali Nagar Jaipur
SR-2026-0202,Mahi Meghwal,Ratan Lal Meghwal,Kamla Devi,2021-08-19,Female,UKG (PP-5),SC,JA-4482-7002-22,XXXX-XXXX-7002,APAAR-9012-5502,+91 94140 70022,RTE-RJ-2026-204195,2026-27,Kardhani Jhotwara Jaipur
SR-2026-0203,Yuvraj Gurjar,Ramavatar Gurjar,Shanti Devi,2022-03-04,Male,Nursery (PP-3),OBC,JA-4482-7003-33,XXXX-XXXX-7003,APAAR-9012-5503,+91 97822 70033,RTE-RJ-2026-204244,2026-27,Sodala New Sanganer Road Jaipur`;

const REIMBURSEMENT_STATUSES: RteReimbursementStatus[] = [
  'Pending Verification',
  'Claim Submitted',
  'Approved',
  'Disbursed',
  'Ineligible (<75% Att.)',
];

export function RteComplianceModule() {
  const { db, updateStudent, bulkImportStudents, getStudentAttendanceStats } = useSchool();
  const [csvInput, setCsvInput] = useState('');
  const [importMessage, setImportMessage] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<Omit<Student, 'id'>[]>([]);

  const rteStudents = useMemo(() => db.students.filter((s) => s.isRte), [db.students]);

  // Class-wise 25% Quota Tracker (Nursery/PP to Class 8)
  const quotaTracker = useMemo(() => {
    return db.feeStructures.map((fs) => {
      const mandatory25 = Math.round(fs.sanctionedSeats * 0.25);
      const classStudents = db.students.filter((s) => s.className === fs.className);
      const filledRte = classStudents.filter((s) => s.isRte).length;
      const pendingClaims = classStudents
        .filter(
          (s) =>
            s.isRte &&
            (s.rteReimbursementStatus === 'Pending Verification' ||
              s.rteReimbursementStatus === 'Claim Submitted' ||
              s.rteReimbursementStatus === 'Approved')
        )
        .reduce((acc) => acc + fs.annualTuitionFee, 0);

      return {
        className: fs.className,
        sanctionedSeats: fs.sanctionedSeats,
        mandatory25,
        totalEnrolled: classStudents.length,
        filledRte,
        annualTuitionFee: fs.annualTuitionFee,
        pendingClaims,
      };
    });
  }, [db.feeStructures, db.students]);

  const totalPendingClaimAmount = quotaTracker.reduce((acc, q) => acc + q.pendingClaims, 0);
  const totalQuotaTarget = quotaTracker.reduce((acc, q) => acc + q.mandatory25, 0);
  const totalFilledRte = quotaTracker.reduce((acc, q) => acc + q.filledRte, 0);

  // Portal-Ready Exports
  const handleExportMasterShalaDarpan = () => {
    const headers = [
      'DISE_Code',
      'RTE_School_Code',
      'SR_No',
      'Student_Name',
      'Father_Name',
      'Mother_Name',
      'DOB',
      'Gender',
      'Category',
      'Class',
      'Section',
      'Jan_Aadhaar',
      'Aadhaar_Last4',
      'APAAR_ID',
      'RTE_Quota',
      'RTE_Application_No',
      'RTE_Admission_Year',
      'Parent_Mobile',
    ];
    const rows = db.students.map((s) => [
      db.schoolProfile.diseCode,
      db.schoolProfile.rtePortalCode,
      s.srNo,
      s.name,
      s.fatherName,
      s.motherName,
      s.dob,
      s.gender,
      s.category,
      s.className,
      s.section,
      s.janAadhaar,
      s.aadhaar,
      s.apaarId,
      s.isRte ? 'YES' : 'NO',
      s.rteAppNo || '-',
      s.rteAdmissionYear || '-',
      s.parentContact,
    ]);
    downloadCSV('ShalaDarpan_Student_Master_Export.csv', headers, rows);
  };

  const handleExportAttendanceEligibility = () => {
    const headers = [
      'SR_No',
      'RTE_Application_No',
      'Student_Name',
      'Class',
      'Total_Working_Days',
      'Days_Present',
      'Attendance_Percentage',
      'RTE_75Pct_Eligible',
      'Reimbursement_Status',
    ];
    const rows = rteStudents.map((s) => {
      const att = getStudentAttendanceStats(s.id);
      return [
        s.srNo,
        s.rteAppNo,
        s.name,
        s.className,
        att.totalDays,
        att.presentDays,
        `${att.percentage}%`,
        att.percentage >= 75 ? 'ELIGIBLE' : 'INELIGIBLE_BELOW_75',
        s.rteReimbursementStatus,
      ];
    });
    downloadCSV('RTE_Rajasthan_Attendance_Eligibility.csv', headers, rows);
  };

  const handleExportReimbursementClaims = () => {
    const headers = [
      'RTE_School_Code',
      'RTE_Application_No',
      'SR_No',
      'Student_Name',
      'Father_Name',
      'Class',
      'Admission_Year',
      'Jan_Aadhaar',
      'APAAR_ID',
      'Annual_Tuition_Claim_INR',
      'Attendance_Pct',
      'Claim_Status',
    ];
    const rows = rteStudents.map((s) => {
      const fs = db.feeStructures.find((f) => f.className === s.className);
      const att = getStudentAttendanceStats(s.id);
      return [
        db.schoolProfile.rtePortalCode,
        s.rteAppNo,
        s.srNo,
        s.name,
        s.fatherName,
        s.className,
        s.rteAdmissionYear,
        s.janAadhaar,
        s.apaarId,
        fs?.annualTuitionFee || 0,
        `${att.percentage}%`,
        s.rteReimbursementStatus,
      ];
    });
    downloadCSV('RTE_Rajasthan_Fee_Reimbursement_Claims.csv', headers, rows);
  };

  const handleDownloadImportTemplate = () => {
    const parsed = parseCSVText(SAMPLE_RTE_LOTTERY_CSV);
    downloadCSV('RTE_Lottery_Allotment_Import_Template.csv', parsed.headers, parsed.rows);
  };

  const handleParseCsv = (text: string) => {
    setCsvInput(text);
    setImportMessage('');
    const { headers, rows } = parseCSVText(text);
    if (headers.length === 0 || rows.length === 0) {
      setPreviewRows([]);
      return;
    }

    const colIdx = (name: string) =>
      headers.findIndex((h) => h.toLowerCase().replace(/\s+/g, '_') === name.toLowerCase());

    const mapped: Omit<Student, 'id'>[] = rows.map((row, index) => {
      const rawClass = row[colIdx('Class')] || 'Class 1';
      const validClass = SCHOOL_CLASSES.includes(rawClass as SchoolClass)
        ? (rawClass as SchoolClass)
        : 'Class 1';

      const rawCat = row[colIdx('Category')] || 'OBC';
      const validCat = (['General', 'OBC', 'SC', 'ST', 'EWS'].includes(rawCat)
        ? rawCat
        : 'OBC') as SocialCategory;

      const rawGender = row[colIdx('Gender')] || 'Male';
      const validGender = (['Male', 'Female', 'Other'].includes(rawGender)
        ? rawGender
        : 'Male') as 'Male' | 'Female' | 'Other';

      const rawRte = row[colIdx('RTE_Quota')] ?? 'YES';
      const isRte = rawRte.toUpperCase() !== 'NO' && rawRte.toUpperCase() !== 'FALSE';

      return {
        srNo: row[colIdx('SR_No')] || `SR-2026-IMP-${index + 1}`,
        name: row[colIdx('Student_Name')] || 'Unnamed Student',
        fatherName: row[colIdx('Father_Name')] || '',
        motherName: row[colIdx('Mother_Name')] || '',
        dob: row[colIdx('DOB')] || '2020-01-01',
        gender: validGender,
        className: validClass,
        section: 'A',
        rollNo: 10 + index,
        janAadhaar: row[colIdx('Jan_Aadhaar')] || '',
        aadhaar: row[colIdx('Aadhaar_Last4')] || '',
        apaarId: row[colIdx('APAAR_ID')] || '',
        admissionDate: new Date().toISOString().slice(0, 10),
        parentContact: row[colIdx('Parent_Contact')] || '',
        address: row[colIdx('Address')] || 'Rajaldesar, Churu, Rajasthan',
        category: validCat,
        isRte,
        rteAppNo: isRte ? row[colIdx('RTE_App_No')] || `RTE-RJ-2026-${3000 + index}` : '',
        rteAdmissionYear: isRte ? row[colIdx('Admission_Year')] || '2026-27' : '',
        rteReimbursementStatus: isRte ? 'Pending Verification' : 'Not Applicable',
        busRouteId: null,
        busStopId: null,
      };
    });

    setPreviewRows(mapped);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleParseCsv(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (previewRows.length === 0) return;
    const existingSrSet = new Set(db.students.map((s) => s.srNo.toLowerCase()));
    const freshRows = previewRows.filter((r) => !existingSrSet.has(r.srNo.toLowerCase()));
    const count = bulkImportStudents(freshRows);
    setImportMessage(
      count > 0
        ? `Imported ${count} RTE allotted student(s) into the school register.`
        : 'All rows in this CSV already exist (matched by SR Number).'
    );
    if (count > 0) {
      setPreviewRows([]);
      setCsvInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner + One-Click Portal Exports */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-800">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Rajasthan RTE Portal (rajpsp.nic.in) &amp; Shala Darpan Sync</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            RTE 25% Quota Compliance &amp; Bulk Portal Exchange
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Download pre-formatted Excel/CSV sheets for direct portal upload or import allotted RTE
            lottery lists.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportMasterShalaDarpan}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Shala Darpan Master CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportAttendanceEligibility}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>RTE Attendance % CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportReimbursementClaims}
            className="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Reimbursement Claim CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">RTE 25% Quota Fill Rate</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-num mt-1">
            {totalFilledRte} / {totalQuotaTarget} Seats
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Across Nursery (PP-3) to Class 8 ({SCHOOL_CLASSES.length} grades)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Pending Reimbursement Claims</div>
          <div className="text-2xl font-bold text-amber-700 font-mono-num mt-1">
            {formatINR(totalPendingClaimAmount)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Calculated from class-wise tuition schedule
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Attendance Eligibility (≥75%)</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-num mt-1">
            {rteStudents.filter((s) => getStudentAttendanceStats(s.id).percentage >= 75).length} /{' '}
            {rteStudents.length} Eligible
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Rajasthan RTE mandates ≥75% attendance for claim release
          </div>
        </div>
      </div>

      {/* RTE 25% Quota Tracker per Class */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            RTE 25% Quota Seat Matrix (Nursery / PP to Class 8)
          </h3>
          <span className="text-xs text-slate-500">Sanctioned vs. Mandatory 25% vs. Filled</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="px-4 py-2.5">Class</th>
                <th className="px-4 py-2.5 text-right">Sanctioned Seats</th>
                <th className="px-4 py-2.5 text-right">25% RTE Target</th>
                <th className="px-4 py-2.5 text-right">Filled RTE</th>
                <th className="px-4 py-2.5">Fill Progress</th>
                <th className="px-4 py-2.5 text-right">Pending Claim Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotaTracker.map((row) => {
                const pct = Math.min(
                  100,
                  row.mandatory25 > 0 ? Math.round((row.filledRte / row.mandatory25) * 100) : 0
                );
                return (
                  <tr key={row.className} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{row.className}</td>
                    <td className="px-4 py-2.5 text-right font-mono-num">{row.sanctionedSeats}</td>
                    <td className="px-4 py-2.5 text-right font-mono-num">{row.mandatory25}</td>
                    <td className="px-4 py-2.5 text-right font-mono-num font-bold text-blue-800">
                      {row.filledRte}
                    </td>
                    <td className="px-4 py-2.5 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-700 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono-num text-[11px] text-slate-600 w-9 text-right">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-num text-slate-800">
                      {formatINR(row.pendingClaims)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RTE Student Registry & Reimbursement Status */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            RTE Tagged Students &amp; Reimbursement Status ({rteStudents.length})
          </h3>
          <span className="text-xs text-slate-500">Update claim status directly</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="px-4 py-2.5">RTE App No</th>
                <th className="px-4 py-2.5">Student Name</th>
                <th className="px-4 py-2.5">Class</th>
                <th className="px-4 py-2.5">Admission Year</th>
                <th className="px-4 py-2.5 text-right">Attendance %</th>
                <th className="px-4 py-2.5">Portal Claim Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rteStudents.map((stu) => {
                const att = getStudentAttendanceStats(stu.id);
                const eligible = att.percentage >= 75;
                return (
                  <tr key={stu.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-mono-num font-medium text-slate-800">
                      {stu.rteAppNo}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900">{stu.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {stu.srNo} · {stu.category}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{stu.className}</td>
                    <td className="px-4 py-2.5 font-mono-num text-slate-700">
                      {stu.rteAdmissionYear}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono-num font-semibold ${
                        eligible ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1 justify-end">
                        {!eligible && <AlertTriangle className="w-3.5 h-3.5" />}
                        {att.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={stu.rteReimbursementStatus}
                        onChange={(e) =>
                          updateStudent({
                            ...stu,
                            rteReimbursementStatus: e.target.value as RteReimbursementStatus,
                          })
                        }
                        className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                      >
                        {REIMBURSEMENT_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk RTE Lottery CSV Importer */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bulk RTE Lottery Allotment CSV Importer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Import lottery-allotted students directly from Rajasthan RTE Portal CSV exports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadImportTemplate}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Download Sample Template
            </button>
            <button
              type="button"
              onClick={() => handleParseCsv(SAMPLE_RTE_LOTTERY_CSV)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              Load Sample Lottery Batch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Upload CSV File or Paste Rows Below
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
            />
            <textarea
              rows={6}
              value={csvInput}
              onChange={(e) => handleParseCsv(e.target.value)}
              placeholder="Paste CSV rows with header: SR_No,Student_Name,Father_Name,Mother_Name,DOB,Gender,Class,Category,Jan_Aadhaar,Aadhaar_Last4,APAAR_ID,Parent_Contact,RTE_App_No,Admission_Year,Address"
              className="w-full p-3 text-xs font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="lg:col-span-7 border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800">
                  Import Preview ({previewRows.length} rows parsed)
                </span>
                {previewRows.length > 0 && (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-3.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import {previewRows.length} RTE Students</span>
                  </button>
                )}
              </div>

              {previewRows.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>
                    Upload a CSV or click &ldquo;Load Sample Lottery Batch&rdquo; to preview parsed
                    students.
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-44">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-600">
                        <th className="py-1.5 pr-2">SR No</th>
                        <th className="py-1.5 pr-2">Name</th>
                        <th className="py-1.5 pr-2">Class</th>
                        <th className="py-1.5 pr-2">RTE App No</th>
                        <th className="py-1.5">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {previewRows.map((r, i) => (
                        <tr key={i}>
                          <td className="py-1.5 pr-2 font-mono-num">{r.srNo}</td>
                          <td className="py-1.5 pr-2 font-medium">{r.name}</td>
                          <td className="py-1.5 pr-2">{r.className}</td>
                          <td className="py-1.5 pr-2 font-mono-num">{r.rteAppNo}</td>
                          <td className="py-1.5">{r.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {importMessage && (
              <div className="mt-3 p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
