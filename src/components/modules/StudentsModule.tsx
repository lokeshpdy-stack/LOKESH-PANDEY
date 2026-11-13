import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, X, Eye } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  SCHOOL_CLASSES,
  SchoolClass,
  SocialCategory,
  Student,
  RteReimbursementStatus,
} from '../../types/school';
import { formatDateIN } from '../../utils/formatters';

const CATEGORIES: SocialCategory[] = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const RTE_STATUSES: RteReimbursementStatus[] = [
  'Pending Verification',
  'Claim Submitted',
  'Approved',
  'Disbursed',
  'Ineligible (<75% Att.)',
];

const EMPTY_STUDENT: Omit<Student, 'id'> = {
  srNo: '',
  name: '',
  fatherName: '',
  motherName: '',
  dob: '2018-06-15',
  gender: 'Male',
  className: 'Class 1',
  section: 'A',
  rollNo: 1,
  janAadhaar: '',
  aadhaar: '',
  apaarId: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  parentContact: '',
  parentEmail: '',
  address: '',
  category: 'General',
  isRte: false,
  rteAppNo: '',
  rteAdmissionYear: '2026-27',
  rteReimbursementStatus: 'Not Applicable',
  busRouteId: null,
  busStopId: null,
};

export function StudentsModule() {
  const { db, currentUser, addStudent, updateStudent, deleteStudent, getStudentAttendanceStats } =
    useSchool();

  const isAdmin = currentUser?.role === 'admin';
  const teacher =
    currentUser?.role === 'teacher'
      ? db.staff.find((s) => s.id === currentUser.staffId)
      : undefined;

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [rteFilter, setRteFilter] = useState<'ALL' | 'RTE' | 'NON_RTE'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Student, 'id'>>(EMPTY_STUDENT);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const allowedClasses = useMemo(() => {
    if (teacher && teacher.assignedClasses.length > 0) {
      return teacher.assignedClasses;
    }
    return SCHOOL_CLASSES;
  }, [teacher]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.students.filter((s) => {
      if (teacher && teacher.assignedClasses.length > 0) {
        if (!teacher.assignedClasses.includes(s.className)) return false;
      }
      if (classFilter !== 'ALL' && s.className !== classFilter) return false;
      if (rteFilter === 'RTE' && !s.isRte) return false;
      if (rteFilter === 'NON_RTE' && s.isRte) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.srNo.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        s.parentContact.toLowerCase().includes(q) ||
        (s.parentEmail || '').toLowerCase().includes(q) ||
        s.janAadhaar.toLowerCase().includes(q) ||
        s.apaarId.toLowerCase().includes(q) ||
        s.rteAppNo.toLowerCase().includes(q)
      );
    });
  }, [db.students, teacher, classFilter, rteFilter, search]);

  const openAddModal = () => {
    const nextNum = 101 + db.students.length;
    setEditingId(null);
    setFormData({
      ...EMPTY_STUDENT,
      srNo: `SR-2026-0${nextNum}`,
      apaarId: `APAAR-9012-44${nextNum}`,
    });
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingId(student.id);
    const { id: _id, ...rest } = student;
    setFormData(rest);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: Omit<Student, 'id'> = {
      ...formData,
      rteReimbursementStatus: formData.isRte
        ? formData.rteReimbursementStatus === 'Not Applicable'
          ? 'Pending Verification'
          : formData.rteReimbursementStatus
        : 'Not Applicable',
      rteAppNo: formData.isRte ? formData.rteAppNo : '',
      rteAdmissionYear: formData.isRte ? formData.rteAdmissionYear : '',
    };

    if (editingId) {
      updateStudent({ id: editingId, ...cleaned });
    } else {
      addStudent(cleaned);
    }
    setModalOpen(false);
  };

  const selectedRoute = db.busRoutes.find((r) => r.id === formData.busRouteId);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name, SR No, Jan Aadhaar, APAAR, RTE..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            <option value="ALL">All Classes ({allowedClasses.length})</option>
            {allowedClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'RTE', 'NON_RTE'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRteFilter(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  rteFilter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'RTE' ? 'RTE Quota' : 'Non-RTE'}
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing <strong className="text-slate-900 font-mono-num">{filteredStudents.length}</strong>{' '}
            students
          </span>
          <span>Rajasthan Shala Darpan / APAAR &amp; RTE Ready Register</span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No students match the selected search or class filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-3">SR No</th>
                  <th className="px-4 py-3">Student &amp; Parent</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Jan Aadhaar / APAAR</th>
                  <th className="px-4 py-3">Category / RTE</th>
                  <th className="px-4 py-3">Transport</th>
                  <th className="px-4 py-3 text-right">Attendance</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stu) => {
                  const att = getStudentAttendanceStats(stu.id);
                  const bus = db.busRoutes.find((r) => r.id === stu.busRouteId);
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono-num font-medium text-slate-800 whitespace-nowrap">
                        {stu.srNo}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{stu.name}</div>
                        <div className="text-[11px] text-slate-500">
                          S/o or D/o {stu.fatherName} · {stu.parentContact}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {stu.className} ({stu.section})
                      </td>
                      <td className="px-4 py-3 font-mono-num text-[11px] text-slate-600 whitespace-nowrap">
                        <div>{stu.janAadhaar || '-'}</div>
                        <div className="text-slate-400">{stu.apaarId || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          {stu.category} {stu.isRte ? '· RTE Quota' : ''}
                        </div>
                        {stu.isRte && (
                          <div className="text-[11px] font-mono-num text-amber-700">
                            {stu.rteAppNo}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {bus ? `${bus.routeCode} (${bus.vehicleNumber})` : 'Self / Walk'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono-num font-semibold whitespace-nowrap ${
                          att.percentage < 75 ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {att.percentage}%
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingStudent(stu)}
                            className="p-1.5 text-slate-500 hover:text-blue-800 rounded hover:bg-slate-100"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(stu)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                                title="Edit Student"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteStudent(stu.id)}
                                className="p-1.5 text-slate-500 hover:text-red-700 rounded hover:bg-red-50"
                                title="Remove Student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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

      {/* View Student Profile Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-mono-num text-slate-500">{viewingStudent.srNo}</div>
                <h3 className="text-lg font-bold text-slate-900">{viewingStudent.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Class &amp; Roll No:</span>
                <div className="font-medium text-slate-900">
                  {viewingStudent.className} ({viewingStudent.section}) · Roll {viewingStudent.rollNo}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Date of Birth / Gender:</span>
                <div className="font-medium text-slate-900 font-mono-num">
                  {formatDateIN(viewingStudent.dob)} · {viewingStudent.gender}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Father&apos;s Name:</span>
                <div className="font-medium text-slate-900">{viewingStudent.fatherName}</div>
              </div>
              <div>
                <span className="text-slate-500">Mother&apos;s Name:</span>
                <div className="font-medium text-slate-900">{viewingStudent.motherName}</div>
              </div>
              <div>
                <span className="text-slate-500">Jan Aadhaar ID:</span>
                <div className="font-mono-num text-slate-900">{viewingStudent.janAadhaar || '-'}</div>
              </div>
              <div>
                <span className="text-slate-500">APAAR ID / Aadhaar:</span>
                <div className="font-mono-num text-slate-900">
                  {viewingStudent.apaarId || '-'} · {viewingStudent.aadhaar || '-'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Category &amp; RTE Status:</span>
                <div className="font-medium text-slate-900">
                  {viewingStudent.category} ·{' '}
                  {viewingStudent.isRte ? `RTE (${viewingStudent.rteAppNo})` : 'General / Non-RTE'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Parent Mobile &amp; Email:</span>
                <div className="font-mono-num text-slate-900">
                  {viewingStudent.parentContact}
                  {viewingStudent.parentEmail ? ` · ${viewingStudent.parentEmail}` : ''}
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Residential Address:</span>
                <div className="font-medium text-slate-900">{viewingStudent.address}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Student Profile' : 'Admit New Student (SIS)'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SR Number *</label>
                  <input
                    required
                    value={formData.srNo}
                    onChange={(e) => setFormData({ ...formData, srNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    value={formData.className}
                    onChange={(e) =>
                      setFormData({ ...formData, className: e.target.value as SchoolClass })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {SCHOOL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value as 'A' | 'B' })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as SocialCategory })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Father&apos;s Name *</label>
                  <input
                    required
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mother&apos;s Name</label>
                  <input
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Parent Mobile (for Login) *
                  </label>
                  <input
                    required
                    value={formData.parentContact}
                    onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                    placeholder="+91 98290 XXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Parent Email (Optional, for Login)
                  </label>
                  <input
                    type="email"
                    value={formData.parentEmail || ''}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="parent@example.com"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jan Aadhaar ID</label>
                  <input
                    value={formData.janAadhaar}
                    onChange={(e) => setFormData({ ...formData, janAadhaar: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                    placeholder="JA-4482-XXXX-XX"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Aadhaar (Masked/Last 4)</label>
                  <input
                    value={formData.aadhaar}
                    onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                    placeholder="XXXX-XXXX-1234"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">APAAR ID</label>
                  <input
                    value={formData.apaarId}
                    onChange={(e) => setFormData({ ...formData, apaarId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as 'Male' | 'Female' | 'Other',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* RTE Tagging Section */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-center gap-2 font-semibold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRte}
                    onChange={(e) => setFormData({ ...formData, isRte: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span>Tag as Rajasthan RTE 25% Quota Student (Tuition Fee Exempt)</span>
                </label>

                {formData.isRte && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        RTE Application No *
                      </label>
                      <input
                        required={formData.isRte}
                        value={formData.rteAppNo}
                        onChange={(e) => setFormData({ ...formData, rteAppNo: e.target.value })}
                        placeholder="RTE-RJ-2026-XXXXXX"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        RTE Admission Year
                      </label>
                      <input
                        value={formData.rteAdmissionYear}
                        onChange={(e) =>
                          setFormData({ ...formData, rteAdmissionYear: e.target.value })
                        }
                        placeholder="2026-27"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Reimbursement Status
                      </label>
                      <select
                        value={
                          formData.rteReimbursementStatus === 'Not Applicable'
                            ? 'Pending Verification'
                            : formData.rteReimbursementStatus
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rteReimbursementStatus: e.target.value as RteReimbursementStatus,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {RTE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bus Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    School Bus Route (Optional)
                  </label>
                  <select
                    value={formData.busRouteId || ''}
                    onChange={(e) => {
                      const routeId = e.target.value || null;
                      const firstStop =
                        db.busRoutes.find((r) => r.id === routeId)?.stops[0]?.id || null;
                      setFormData({ ...formData, busRouteId: routeId, busStopId: firstStop });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">No Bus (Self / Walk)</option>
                    {db.busRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.routeCode} — {r.routeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pickup / Drop Stop</label>
                  <select
                    disabled={!selectedRoute}
                    value={formData.busStopId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, busStopId: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                  >
                    {!selectedRoute ? (
                      <option value="">Select route first</option>
                    ) : (
                      selectedRoute.stops.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.pickupTime})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold"
                >
                  {editingId ? 'Save Changes' : 'Admit Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
