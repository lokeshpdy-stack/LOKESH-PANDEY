import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Pin,
  Save,
  CheckCircle2,
  Pencil,
  Download,
  Upload,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  HomeworkItem,
  NoticeItem,
  SCHOOL_CLASSES,
  SchoolClass,
  SchoolDatabase,
  TimetableEntry,
} from '../../types/school';
import { formatDateIN } from '../../utils/formatters';

const DAYS: TimetableEntry['day'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function AcademicsNoticesModule({
  initialTab = 'notices',
}: {
  initialTab?: 'notices' | 'timetable' | 'homework' | 'settings';
} = {}) {
  const {
    db,
    currentUser,
    addNotice,
    updateNotice,
    deleteNotice,
    addHomework,
    updateHomework,
    deleteHomework,
    saveTimetableEntry,
    updateSchoolProfile,
    updateCredentials,
    importFullDatabase,
    clearTransactionalData,
  } = useSchool();

  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const canEditHomework = isAdmin || isTeacher;
  const studentObj =
    currentUser?.role === 'student'
      ? db.students.find((s) => s.id === currentUser.studentId)
      : undefined;

  const [tab, setTab] = useState<'notices' | 'timetable' | 'homework' | 'settings'>(initialTab);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const [selectedClass, setSelectedClass] = useState<SchoolClass>(
    studentObj?.className || 'Class 4'
  );
  const [selectedDay, setSelectedDay] = useState<TimetableEntry['day']>('Monday');

  // Notice form
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    body: '',
    audience: 'All' as NoticeItem['audience'],
    category: 'General' as NoticeItem['category'],
    pinned: false,
  });

  // Homework form
  const [editingHwId, setEditingHwId] = useState<string | null>(null);
  const [hwForm, setHwForm] = useState({
    className: 'Class 4' as SchoolClass,
    subject: 'Mathematics',
    title: '',
    description: '',
    syllabusProgress: 70,
    dueDate: '2026-11-18',
  });

  // Timetable editing
  const activeTimetable = db.timetable.find(
    (t) => t.className === selectedClass && t.day === selectedDay
  );
  const [ttDraft, setTtDraft] = useState(
    activeTimetable?.periods || [
      { time: '08:15 - 09:00', subject: 'Hindi', teacherName: 'Sunita Sharma' },
      { time: '09:00 - 09:45', subject: 'English', teacherName: 'Sunita Sharma' },
      { time: '09:45 - 10:30', subject: 'Mathematics', teacherName: 'Rajeshwar Singh Rathore' },
      { time: '10:50 - 11:35', subject: 'EVS / Science', teacherName: 'Pooja Kumawat' },
      { time: '11:35 - 12:20', subject: 'General Knowledge', teacherName: 'Pooja Kumawat' },
    ]
  );

  // School Profile Settings
  const [profileForm, setProfileForm] = useState(db.schoolProfile);

  React.useEffect(() => {
    setProfileForm(db.schoolProfile);
  }, [db.schoolProfile]);
  const [credsForm, setCredsForm] = useState(
    db.credentials || {
      adminPassword: 'rajal@123',
      defaultTeacherPassword: 'teacher@123',
      defaultStudentPassword: 'student@123',
      customPasswords: {},
    }
  );
  const [customId, setCustomId] = useState('');
  const [customPw, setCustomPw] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedFlag, setSavedFlag] = useState('');

  const visibleNotices = db.notices.filter((n) => {
    if (isAdmin) return true;
    if (isTeacher) return n.audience === 'All' || n.audience === 'Teachers';
    return n.audience === 'All' || n.audience === 'Students & Parents';
  });

  const handleClassOrDayChange = (cls: SchoolClass, day: TimetableEntry['day']) => {
    setSelectedClass(cls);
    setSelectedDay(day);
    const found = db.timetable.find((t) => t.className === cls && t.day === day);
    setTtDraft(
      found?.periods || [
        { time: '08:15 - 09:00', subject: 'Hindi', teacherName: 'Sunita Sharma' },
        { time: '09:00 - 09:45', subject: 'English', teacherName: 'Sunita Sharma' },
        { time: '09:45 - 10:30', subject: 'Mathematics', teacherName: 'Rajeshwar Singh Rathore' },
        { time: '10:50 - 11:35', subject: 'EVS / Science', teacherName: 'Pooja Kumawat' },
        { time: '11:35 - 12:20', subject: 'General Knowledge', teacherName: 'Pooja Kumawat' },
      ]
    );
  };

  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNoticeId) {
      const existing = db.notices.find((n) => n.id === editingNoticeId);
      if (existing) {
        updateNotice({
          ...existing,
          ...noticeForm,
        });
      }
      setEditingNoticeId(null);
      setSavedFlag('Notice updated.');
    } else {
      addNotice({
        ...noticeForm,
        postedBy:
          currentUser?.name && currentUser.name !== 'Principal / Admin'
            ? `${currentUser.name} (Principal)`
            : 'Principal',
      });
      setSavedFlag('Notice published.');
    }
    setNoticeForm({
      title: '',
      body: '',
      audience: 'All',
      category: 'General',
      pinned: false,
    });
  };

  const handleEditNotice = (n: NoticeItem) => {
    setEditingNoticeId(n.id);
    setNoticeForm({
      title: n.title,
      body: n.body,
      audience: n.audience,
      category: n.category,
      pinned: n.pinned,
    });
  };

  const handleHomeworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHwId) {
      const existing = db.homework.find((h) => h.id === editingHwId);
      if (existing) {
        updateHomework({
          ...existing,
          ...hwForm,
        });
      }
      setEditingHwId(null);
      setSavedFlag('Homework & syllabus updated.');
    } else {
      addHomework({
        ...hwForm,
        assignedBy: currentUser?.name || 'Teacher',
      });
      setSavedFlag('Homework & syllabus update posted.');
    }
    setHwForm({
      className: hwForm.className,
      subject: hwForm.subject,
      title: '',
      description: '',
      syllabusProgress: 70,
      dueDate: '2026-11-18',
    });
  };

  const handleEditHomework = (hw: HomeworkItem) => {
    setEditingHwId(hw.id);
    setHwForm({
      className: hw.className,
      subject: hw.subject,
      title: hw.title,
      description: hw.description,
      syllabusProgress: hw.syllabusProgress,
      dueDate: hw.dueDate,
    });
  };

  const handleExportBackup = () => {
    const json = JSON.stringify(db, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `RajalPublicSchool_Backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSavedFlag('Full school database backup downloaded.');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as SchoolDatabase;
        if (parsed && parsed.schoolProfile && Array.isArray(parsed.students)) {
          importFullDatabase(parsed);
          setProfileForm(parsed.schoolProfile);
          if (parsed.credentials) setCredsForm(parsed.credentials);
          setSavedFlag('School backup restored successfully.');
        } else {
          setSavedFlag('Invalid backup file format.');
        }
      } catch {
        setSavedFlag('Could not parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setTab('notices')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'notices' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Notice Board ({visibleNotices.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('timetable')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'timetable' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Class Timetable
          </button>
          <button
            type="button"
            onClick={() => setTab('homework')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'homework' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Homework &amp; Syllabus
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setTab('settings')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                tab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              School Settings &amp; Data
            </button>
          )}
        </div>

        {savedFlag && (
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedFlag}</span>
          </div>
        )}
      </div>

      {/* Notice Board Tab */}
      {tab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {isAdmin && (
            <form
              onSubmit={handleNoticeSubmit}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs self-start"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingNoticeId ? 'Edit Notice' : 'Publish Digital Notice'}
                </h3>
                {editingNoticeId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoticeId(null);
                      setNoticeForm({
                        title: '',
                        body: '',
                        audience: 'All',
                        category: 'General',
                        pinned: false,
                      });
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Title *</label>
                <input
                  required
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g., Parent-Teacher Meeting Schedule"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Audience</label>
                  <select
                    value={noticeForm.audience}
                    onChange={(e) =>
                      setNoticeForm({
                        ...noticeForm,
                        audience: e.target.value as NoticeItem['audience'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="All">All</option>
                    <option value="Teachers">Teachers Only</option>
                    <option value="Students & Parents">Students &amp; Parents</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={noticeForm.category}
                    onChange={(e) =>
                      setNoticeForm({
                        ...noticeForm,
                        category: e.target.value as NoticeItem['category'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="General">General</option>
                    <option value="RTE / Govt">RTE / Govt</option>
                    <option value="Academic">Academic</option>
                    <option value="Transport">Transport</option>
                    <option value="Fee">Fee</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Details *</label>
                <textarea
                  required
                  rows={4}
                  value={noticeForm.body}
                  onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noticeForm.pinned}
                  onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })}
                />
                <span>Pin to top of Notice Board</span>
              </label>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{editingNoticeId ? 'Update Notice' : 'Publish Notice'}</span>
              </button>
            </form>
          )}

          <div className={`${isAdmin ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
            {visibleNotices.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                No notices published yet.
              </div>
            ) : (
              visibleNotices.map((n) => (
                <div key={n.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-semibold text-blue-800">{n.category}</span>
                        <span>·</span>
                        <span>Audience: {n.audience}</span>
                        <span>·</span>
                        <span className="font-mono-num">{formatDateIN(n.date)}</span>
                        {n.pinned && <Pin className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{n.title}</h4>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditNotice(n)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Edit notice"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNotice(n.id)}
                          className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50"
                          title="Delete notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">{n.body}</p>
                  <div className="text-xs text-slate-500 mt-3">Posted by: {n.postedBy}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Class Timetable Tab */}
      {tab === 'timetable' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select
                value={selectedClass}
                onChange={(e) =>
                  handleClassOrDayChange(e.target.value as SchoolClass, selectedDay)
                }
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
              >
                {SCHOOL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleClassOrDayChange(selectedClass, d)}
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      selectedDay === d
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTtDraft((prev) => [
                      ...prev,
                      { time: '12:20 - 01:05', subject: 'Sports / Library', teacherName: 'Staff' },
                    ])
                  }
                  className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Period</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveTimetableEntry({
                      className: selectedClass,
                      day: selectedDay,
                      periods: ttDraft,
                    });
                    setSavedFlag(`Timetable saved for ${selectedClass} (${selectedDay}).`);
                  }}
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Timetable</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Timing</th>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Teacher</th>
                  {isAdmin && <th className="px-4 py-2.5 text-right">Remove</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ttDraft.map((p, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2.5 font-mono-num font-semibold text-slate-700">
                      Period {idx + 1}
                    </td>
                    <td className="px-4 py-2.5 font-mono-num text-slate-600">
                      {isAdmin ? (
                        <input
                          value={p.time}
                          onChange={(e) =>
                            setTtDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, time: e.target.value } : item
                              )
                            )
                          }
                          className="px-2.5 py-1 border border-slate-300 rounded w-36 font-mono-num"
                        />
                      ) : (
                        p.time
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {isAdmin ? (
                        <input
                          value={p.subject}
                          onChange={(e) =>
                            setTtDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, subject: e.target.value } : item
                              )
                            )
                          }
                          className="px-2.5 py-1 border border-slate-300 rounded w-full max-w-xs"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900">{p.subject}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {isAdmin ? (
                        <input
                          value={p.teacherName}
                          onChange={(e) =>
                            setTtDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, teacherName: e.target.value } : item
                              )
                            )
                          }
                          className="px-2.5 py-1 border border-slate-300 rounded w-full max-w-xs"
                        />
                      ) : (
                        <span className="text-slate-700">{p.teacherName}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-right">
                        {ttDraft.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setTtDraft((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-red-700"
                            title="Remove period"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Homework & Syllabus Tab */}
      {tab === 'homework' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {canEditHomework && (
            <form
              onSubmit={handleHomeworkSubmit}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs self-start"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingHwId ? 'Edit Homework & Syllabus' : 'Assign Homework & Syllabus'}
                </h3>
                {editingHwId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHwId(null);
                      setHwForm({
                        className: 'Class 4',
                        subject: 'Mathematics',
                        title: '',
                        description: '',
                        syllabusProgress: 70,
                        dueDate: '2026-11-18',
                      });
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={hwForm.className}
                    onChange={(e) =>
                      setHwForm({ ...hwForm, className: e.target.value as SchoolClass })
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
                  <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                  <input
                    required
                    value={hwForm.subject}
                    onChange={(e) => setHwForm({ ...hwForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Homework Title *</label>
                <input
                  required
                  value={hwForm.title}
                  onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions *</label>
                <textarea
                  required
                  rows={3}
                  value={hwForm.description}
                  onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Syllabus Covered (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hwForm.syllabusProgress}
                    onChange={(e) =>
                      setHwForm({ ...hwForm, syllabusProgress: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={hwForm.dueDate}
                    onChange={(e) => setHwForm({ ...hwForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg"
              >
                {editingHwId ? 'Save Homework Update' : 'Post Homework'}
              </button>
            </form>
          )}

          <div className={`${canEditHomework ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
            {db.homework
              .filter((h) => !studentObj || h.className === studentObj.className)
              .map((hw) => (
                <div key={hw.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500">
                        <strong className="text-slate-800">{hw.className}</strong> · {hw.subject} ·
                        Due <span className="font-mono-num">{formatDateIN(hw.dueDate)}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{hw.title}</h4>
                    </div>
                    {canEditHomework && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditHomework(hw)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Edit Homework"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHomework(hw.id)}
                          className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50"
                          title="Delete Homework"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{hw.description}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Assigned by: {hw.assignedBy}</span>
                    <span className="font-mono-num font-semibold text-blue-800">
                      Syllabus Progress: {hw.syllabusProgress}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* School Settings, Portal Passwords & Data Backup/Fresh Start (Principal Only) */}
      {tab === 'settings' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* School Profile Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateSchoolProfile(profileForm);
              setSavedFlag('School profile updated.');
            }}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
              School Profile &amp; Portal Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">School Name</label>
                <input
                  value={profileForm.schoolName}
                  onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">UDISE+ Code</label>
                <input
                  value={profileForm.diseCode}
                  onChange={(e) => setProfileForm({ ...profileForm, diseCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  RTE Rajasthan Portal Code
                </label>
                <input
                  value={profileForm.rtePortalCode}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, rtePortalCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Principal Name (Optional)
                </label>
                <div className="flex gap-1.5">
                  <input
                    value={profileForm.principalName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, principalName: e.target.value })
                    }
                    placeholder="Leave blank to hide name"
                    className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  {profileForm.principalName && (
                    <button
                      type="button"
                      onClick={() => {
                        const cleared = { ...profileForm, principalName: '' };
                        setProfileForm(cleared);
                        updateSchoolProfile(cleared);
                        setSavedFlag('Principal name removed.');
                      }}
                      className="px-2.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg font-semibold whitespace-nowrap"
                      title="Remove Principal Name"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Session</label>
                <input
                  value={profileForm.academicSession}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, academicSession: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  value={profileForm.contactPhone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, contactPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                <input
                  value={profileForm.contactEmail}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Affiliation / Board</label>
                <input
                  value={profileForm.affiliation}
                  onChange={(e) => setProfileForm({ ...profileForm, affiliation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">District</label>
                <input
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Address</label>
                <input
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save School Profile</span>
              </button>
            </div>
          </form>

          {/* Portal Passwords + Backup & Fresh Start */}
          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCredentials(credsForm);
                setSavedFlag('Portal login passwords updated.');
              }}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                <KeyRound className="w-4 h-4 text-blue-800" />
                <h3 className="text-sm font-bold text-slate-900">Portal Access Passwords</h3>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Principal / Admin Password
                </label>
                <input
                  required
                  value={credsForm.adminPassword}
                  onChange={(e) => setCredsForm({ ...credsForm, adminPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Teacher Password
                  </label>
                  <input
                    required
                    value={credsForm.defaultTeacherPassword}
                    onChange={(e) =>
                      setCredsForm({ ...credsForm, defaultTeacherPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Student Password
                  </label>
                  <input
                    required
                    value={credsForm.defaultStudentPassword}
                    onChange={(e) =>
                      setCredsForm({ ...credsForm, defaultStudentPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block font-semibold text-slate-700">
                  Set Custom Password (by ID, Email, or 10-digit Mobile)
                </label>
                <div className="flex gap-2">
                  <input
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder="EMP-RJ-002, email, or 98290..."
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono-num"
                  />
                  <input
                    value={customPw}
                    onChange={(e) => setCustomPw(e.target.value)}
                    placeholder="Password"
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono-num"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rawKey = customId.trim();
                      if (!rawKey || !customPw.trim()) return;
                      const normalizedKey = rawKey.includes('@')
                        ? rawKey.toLowerCase()
                        : !/[a-zA-Z]/.test(rawKey) && rawKey.replace(/\D/g, '').length >= 8
                          ? rawKey.replace(/\D/g, '').slice(-10)
                          : rawKey.toUpperCase();
                      const updated = {
                        ...credsForm,
                        customPasswords: {
                          ...credsForm.customPasswords,
                          [normalizedKey]: customPw.trim(),
                        },
                      };
                      setCredsForm(updated);
                      updateCredentials(updated);
                      setCustomId('');
                      setCustomPw('');
                      setSavedFlag(`Password set for ${normalizedKey}.`);
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg"
                  >
                    Set
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg"
              >
                Save Passwords
              </button>
            </form>

            {/* School Data Backup & Fresh Start */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2.5">
                School Data Backup &amp; Management
              </h3>
              <p className="text-slate-600">
                Download a complete JSON backup of all students, attendance, fees, payroll, and bus
                routes, or restore from a saved backup.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup (.json)</span>
                </button>

                <label className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore Backup</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200">
                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-red-700 hover:text-red-800 font-semibold flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Clear Pre-loaded Sample Records (Start Fresh)</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
                    <p className="text-red-900 font-medium">
                      This will clear all sample students, fee receipts, attendance, payroll, and
                      notices while keeping your School Profile and Fee Structure.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          clearTransactionalData();
                          setConfirmClear(false);
                          setSavedFlag('Sample records cleared. Ready for live school entry.');
                        }}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-md"
                      >
                        Confirm Clear Data
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-md font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
