import React, { useState, useMemo } from 'react';
import { Printer, Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  ExamRecord,
  ExamTerm,
  SCHOOL_CLASSES,
  SchoolClass,
  Student,
  SubjectMark,
} from '../../types/school';
import { summarizeMarks } from '../../utils/formatters';
import { MarksheetPrint, PrintPreviewModal } from '../print/PrintDocuments';

const TERMS: ExamTerm[] = ['Unit Test 1', 'Half-Yearly', 'Annual Exam'];

function getDefaultSubjects(className: SchoolClass): SubjectMark[] {
  const isUpper =
    className === 'Class 6' || className === 'Class 7' || className === 'Class 8';
  if (isUpper) {
    return [
      { subject: 'Hindi', maxMarks: 100, obtainedMarks: 78 },
      { subject: 'English', maxMarks: 100, obtainedMarks: 80 },
      { subject: 'Mathematics', maxMarks: 100, obtainedMarks: 82 },
      { subject: 'Science', maxMarks: 100, obtainedMarks: 79 },
      { subject: 'Social Science', maxMarks: 100, obtainedMarks: 81 },
      { subject: 'Sanskrit', maxMarks: 100, obtainedMarks: 84 },
    ];
  }
  return [
    { subject: 'Hindi', maxMarks: 100, obtainedMarks: 82 },
    { subject: 'English', maxMarks: 100, obtainedMarks: 80 },
    { subject: 'Mathematics', maxMarks: 100, obtainedMarks: 85 },
    { subject: 'EVS / Science', maxMarks: 100, obtainedMarks: 83 },
    { subject: 'General Knowledge', maxMarks: 50, obtainedMarks: 42 },
  ];
}

export function ExamsModule() {
  const { db, currentUser, saveExamRecord, deleteExamRecord, getStudentAttendanceStats } =
    useSchool();

  const teacher =
    currentUser?.role === 'teacher'
      ? db.staff.find((s) => s.id === currentUser.staffId)
      : undefined;

  const availableClasses = useMemo(() => {
    if (teacher && teacher.assignedClasses.length > 0) return teacher.assignedClasses;
    return SCHOOL_CLASSES;
  }, [teacher]);

  const [selectedClass, setSelectedClass] = useState<SchoolClass>(
    availableClasses[0] || 'Class 4'
  );
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm>('Half-Yearly');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [marksDraft, setMarksDraft] = useState<SubjectMark[]>([]);
  const [remarksDraft, setRemarksDraft] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const [printingReport, setPrintingReport] = useState<{
    student: Student;
    exam: ExamRecord;
  } | null>(null);

  // Student / Parent Read-Only Report Card View
  if (currentUser?.role === 'student') {
    const student = db.students.find((s) => s.id === currentUser.studentId) || db.students[0];
    const myExams = student ? db.examRecords.filter((e) => e.studentId === student.id) : [];
    const attPct = student ? getStudentAttendanceStats(student.id).percentage : 100;

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-bold text-slate-900">
            Academic Report Cards — {student?.name} ({student?.className})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            SR No: <span className="font-mono-num">{student?.srNo}</span> · APAAR ID:{' '}
            <span className="font-mono-num">{student?.apaarId}</span>
          </p>
        </div>

        {myExams.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            No exam marksheets published yet.
          </div>
        ) : (
          <div className="space-y-4">
            {myExams.map((ex) => {
              const summary = summarizeMarks(ex.marks);
              return (
                <div key={ex.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {ex.term} ({ex.academicYear})
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Total:{' '}
                        <span className="font-mono-num font-bold">
                          {summary.totalObtained}/{summary.totalMax}
                        </span>{' '}
                        · <span className="font-mono-num font-bold">{summary.percentage}%</span> ·
                        Grade <strong>{summary.grade}</strong> ({summary.status})
                      </div>
                    </div>
                    {student && (
                      <button
                        type="button"
                        onClick={() => setPrintingReport({ student, exam: ex })}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Report Card</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    {ex.marks.map((m) => (
                      <div
                        key={m.subject}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <div className="text-slate-500 truncate">{m.subject}</div>
                        <div className="text-base font-bold font-mono-num text-slate-900 mt-1">
                          {m.obtainedMarks} / {m.maxMarks}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {printingReport && (
          <PrintPreviewModal
            title={`Marksheet — ${printingReport.student.name} (${printingReport.exam.term})`}
            onClose={() => setPrintingReport(null)}
          >
            <MarksheetPrint
              school={db.schoolProfile}
              student={printingReport.student}
              exam={printingReport.exam}
              attendancePct={attPct}
            />
          </PrintPreviewModal>
        )}
      </div>
    );
  }

  // Teacher / Admin Marks Entry & Report Card Generator
  const classStudents = db.students.filter((s) => s.className === selectedClass);

  const openMarksEditor = (stu: Student) => {
    const existing = db.examRecords.find(
      (e) =>
        e.studentId === stu.id &&
        e.term === selectedTerm &&
        e.academicYear === db.schoolProfile.academicSession
    );
    setEditingStudent(stu);
    setMarksDraft(
      existing ? existing.marks.map((m) => ({ ...m })) : getDefaultSubjects(stu.className)
    );
    setRemarksDraft(existing?.teacherRemarks || 'Good academic progress and classroom discipline.');
    setNewSubjectName('');
    setSavedNotice('');
  };

  const handleAddSubject = () => {
    const trimmed = newSubjectName.trim();
    if (!trimmed) return;
    if (marksDraft.some((m) => m.subject.toLowerCase() === trimmed.toLowerCase())) return;
    setMarksDraft((prev) => [...prev, { subject: trimmed, maxMarks: 100, obtainedMarks: 0 }]);
    setNewSubjectName('');
  };

  const handleSaveMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    saveExamRecord({
      studentId: editingStudent.id,
      term: selectedTerm,
      academicYear: db.schoolProfile.academicSession,
      marks: marksDraft,
      teacherRemarks: remarksDraft,
    });
    setSavedNotice(`Saved ${selectedTerm} marks for ${editingStudent.name}.`);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 mr-2">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value as SchoolClass);
                setEditingStudent(null);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
            >
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSelectedTerm(term);
                  setEditingStudent(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedTerm === term
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {savedNotice && (
          <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* Inline Marks Entry Form */}
      {editingStudent && (
        <form
          onSubmit={handleSaveMarks}
          className="bg-white border border-blue-300 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Enter {selectedTerm} Marks — {editingStudent.name} ({editingStudent.className})
              </h3>
              <p className="text-xs text-slate-500 font-mono-num">{editingStudent.srNo}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {marksDraft.map((m, idx) => (
              <div key={m.subject} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <input
                    value={m.subject}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMarksDraft((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, subject: val } : item))
                      );
                    }}
                    className="font-semibold text-slate-800 bg-transparent border-b border-transparent focus:border-slate-400 focus:outline-none w-full mr-2"
                  />
                  {marksDraft.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setMarksDraft((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-red-700"
                      title="Remove Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-slate-500">Obtained</label>
                    <input
                      type="number"
                      min={0}
                      max={m.maxMarks}
                      value={m.obtainedMarks}
                      onChange={(e) => {
                        const val = Math.min(
                          m.maxMarks,
                          Math.max(0, Number(e.target.value) || 0)
                        );
                        setMarksDraft((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, obtainedMarks: val } : item
                          )
                        );
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono-num"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[11px] text-slate-500">Max</label>
                    <input
                      type="number"
                      min={10}
                      value={m.maxMarks}
                      onChange={(e) => {
                        const val = Math.max(10, Number(e.target.value) || 100);
                        setMarksDraft((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, maxMarks: val } : item))
                        );
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono-num"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Add custom subject (e.g. Computer)"
              className="px-3 py-1.5 border border-slate-300 rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddSubject}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Class Teacher Remarks
            </label>
            <input
              value={remarksDraft}
              onChange={(e) => setRemarksDraft(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Marks &amp; Update Result</span>
            </button>
          </div>
        </form>
      )}

      {/* Class Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {selectedClass} — {selectedTerm} Performance &amp; Marksheets
          </h3>
          <span className="text-xs text-slate-500">{classStudents.length} Students</span>
        </div>

        {classStudents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No students enrolled in {selectedClass}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-3">SR No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-right">Marks</th>
                  <th className="px-4 py-3 text-right">Percentage</th>
                  <th className="px-4 py-3">Grade / Division</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((stu) => {
                  const exam = db.examRecords.find(
                    (e) =>
                      e.studentId === stu.id &&
                      e.term === selectedTerm &&
                      e.academicYear === db.schoolProfile.academicSession
                  );
                  const summary = exam ? summarizeMarks(exam.marks) : null;
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono-num text-slate-700">{stu.srNo}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{stu.name}</td>
                      <td className="px-4 py-3 text-right font-mono-num">
                        {summary ? `${summary.totalObtained} / ${summary.totalMax}` : 'Not Entered'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                        {summary ? `${summary.percentage}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {summary ? `${summary.grade} · ${summary.status}` : 'Pending'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openMarksEditor(stu)}
                          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-md font-semibold text-slate-800"
                        >
                          {exam ? 'Edit Marks' : 'Enter Marks'}
                        </button>
                        {exam && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPrintingReport({ student: stu, exam })}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold inline-flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Marksheet</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteExamRecord(exam.id)}
                              className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50 align-middle"
                              title="Delete Exam Marks"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {printingReport && (
        <PrintPreviewModal
          title={`Marksheet — ${printingReport.student.name} (${printingReport.exam.term})`}
          onClose={() => setPrintingReport(null)}
        >
          <MarksheetPrint
            school={db.schoolProfile}
            student={printingReport.student}
            exam={printingReport.exam}
            attendancePct={getStudentAttendanceStats(printingReport.student.id).percentage}
          />
        </PrintPreviewModal>
      )}
    </div>
  );
}
