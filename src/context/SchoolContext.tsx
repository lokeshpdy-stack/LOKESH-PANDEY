import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  SchoolDatabase,
  Student,
  StaffMember,
  BusRoute,
  TripStatus,
  AttendanceStatus,
  StaffAttendanceStatus,
  FeePayment,
  FeeStructure,
  ExamRecord,
  HomeworkItem,
  NoticeItem,
  TimetableEntry,
  SchoolProfile,
  PayrollRecord,
  PortalCredentials,
  UserRole,
} from '../types/school';
import { INITIAL_SCHOOL_DATABASE } from '../data/seedData';

const DB_STORAGE_KEY = 'vidyasetu_rajasthan_db_v1';
const AUTH_STORAGE_KEY = 'vidyasetu_rajasthan_auth_v1';

const DEFAULT_CREDENTIALS: PortalCredentials = {
  adminPassword: 'rajal@123',
  defaultTeacherPassword: 'teacher@123',
  defaultStudentPassword: 'student@123',
  customPasswords: {},
};

interface SchoolContextValue {
  db: SchoolDatabase;
  currentUser: AuthUser | null;
  loginWithCredentials: (
    role: UserRole,
    identifier: string,
    password: string,
    specificStudentId?: string
  ) => { ok: boolean; error?: string; multipleMatches?: Student[] };
  logout: () => void;

  // Data Management & Credentials
  importFullDatabase: (nextDb: SchoolDatabase) => void;
  clearTransactionalData: () => void;
  updateCredentials: (creds: PortalCredentials) => void;

  // Students & RTE
  addStudent: (student: Omit<Student, 'id'>) => Student;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  bulkImportStudents: (students: Omit<Student, 'id'>[]) => number;

  // Attendance
  markStudentAttendance: (studentId: string, date: string, status: AttendanceStatus) => void;
  markClassAllPresent: (studentIds: string[], date: string) => void;
  getStudentAttendanceStats: (studentId: string) => {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    percentage: number;
  };

  // Staff & Payroll
  addStaff: (member: Omit<StaffMember, 'id'>) => void;
  updateStaff: (member: StaffMember) => void;
  deleteStaff: (id: string) => void;
  markStaffAttendance: (staffId: string, date: string, status: StaffAttendanceStatus) => void;
  generateMonthlyPayroll: (month: string, monthLabel: string) => void;
  updatePayrollRecord: (record: PayrollRecord) => void;
  deletePayrollRecord: (id: string) => void;
  togglePayrollStatus: (payrollId: string) => void;

  // Transport
  addBusRoute: (route: Omit<BusRoute, 'id'>) => void;
  updateBusRoute: (route: BusRoute) => void;
  deleteBusRoute: (id: string) => void;
  updateTripProgress: (routeId: string, tripStatus: TripStatus, currentStopIndex: number) => void;
  assignStudentBus: (studentId: string, busRouteId: string | null, busStopId: string | null) => void;

  // Fees
  updateFeeStructure: (structure: FeeStructure) => void;
  recordFeePayment: (payment: Omit<FeePayment, 'id' | 'receiptNo'>) => FeePayment;
  updateFeePayment: (payment: FeePayment) => void;
  deleteFeePayment: (id: string) => void;

  // Exams
  saveExamRecord: (record: Omit<ExamRecord, 'id'>) => void;
  deleteExamRecord: (id: string) => void;

  // Academics & Notices
  addHomework: (item: Omit<HomeworkItem, 'id' | 'createdAt'>) => void;
  updateHomework: (item: HomeworkItem) => void;
  deleteHomework: (id: string) => void;
  addNotice: (notice: Omit<NoticeItem, 'id' | 'date'>) => void;
  updateNotice: (notice: NoticeItem) => void;
  deleteNotice: (id: string) => void;
  saveTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  updateSchoolProfile: (profile: SchoolProfile) => void;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

function loadDatabase(): SchoolDatabase {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SchoolDatabase;
      if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.staff)) {
        if (
          parsed.schoolProfile?.schoolName === 'Surya Public Senior Secondary School' ||
          parsed.schoolProfile?.address === 'Station Road, Rajaldesar, Dist. Churu, Rajasthan 331802'
        ) {
          parsed.schoolProfile = INITIAL_SCHOOL_DATABASE.schoolProfile;
        }
        parsed.staff = parsed.staff.map((s) =>
          s.email?.endsWith('@suryapublicjaipur.edu.in')
            ? { ...s, email: s.email.replace('@suryapublicjaipur.edu.in', '@rajalpublicschool.edu.in') }
            : s
        );
        if (!parsed.credentials) {
          parsed.credentials = DEFAULT_CREDENTIALS;
        }
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seed
  }
  return INITIAL_SCHOOL_DATABASE;
}

function normalizePhone(val: string): string {
  const digits = val.replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

function isPhoneQuery(val: string): boolean {
  if (/[a-zA-Z]/.test(val)) return false;
  return val.replace(/\D/g, '').length >= 8;
}

function loadAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
  return null;
}

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SchoolDatabase>(loadDatabase);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(loadAuthUser);

  useEffect(() => {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignore storage quota errors
    }
  }, [db]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [currentUser]);

  const loginWithCredentials = useCallback(
    (
      role: UserRole,
      identifier: string,
      password: string,
      specificStudentId?: string
    ): { ok: boolean; error?: string; multipleMatches?: Student[] } => {
      const cleanId = identifier.trim();
      const lowerId = cleanId.toLowerCase();
      const phoneQuery = isPhoneQuery(cleanId);
      const normalizedInputPhone = phoneQuery ? normalizePhone(cleanId) : '';
      const isEmailQuery = cleanId.includes('@');
      const creds = db.credentials || DEFAULT_CREDENTIALS;

      if (!cleanId) {
        return { ok: false, error: 'Please enter your Mobile Number, Email, or School ID.' };
      }
      if (!password) {
        return { ok: false, error: 'Please enter your password.' };
      }

      if (role === 'admin') {
        const isSchoolContactMatch =
          (isEmailQuery && db.schoolProfile.contactEmail.trim().toLowerCase() === lowerId) ||
          (phoneQuery &&
            normalizePhone(db.schoolProfile.contactPhone) === normalizedInputPhone &&
            normalizedInputPhone.length >= 8);

        const adminStaff = db.staff.filter(
          (s) =>
            s.department === 'Administration' ||
            s.designation.toLowerCase().includes('principal')
        );

        const principal =
          adminStaff.find(
            (s) =>
              s.empId.toLowerCase() === lowerId ||
              (isEmailQuery && s.email.trim().toLowerCase() === lowerId) ||
              (phoneQuery &&
                normalizePhone(s.phone) === normalizedInputPhone &&
                normalizedInputPhone.length >= 8)
          ) || (isSchoolContactMatch || lowerId === 'admin' ? adminStaff[0] || db.staff[0] : undefined);

        if (!principal && !isSchoolContactMatch && lowerId !== 'admin') {
          return {
            ok: false,
            error: 'No Principal / Admin account found with that Mobile Number, Email, or Employee ID.',
          };
        }

        const empKey = (principal?.empId || cleanId).toUpperCase();
        const emailKey = principal?.email?.trim().toLowerCase();
        const phoneKey = principal?.phone ? normalizePhone(principal.phone) : '';
        const expectedPw =
          creds.customPasswords[empKey] ||
          (emailKey ? creds.customPasswords[emailKey] : undefined) ||
          (emailKey ? creds.customPasswords[emailKey.toUpperCase()] : undefined) ||
          (phoneKey ? creds.customPasswords[phoneKey] : undefined) ||
          creds.customPasswords[cleanId.toUpperCase()] ||
          creds.customPasswords[lowerId] ||
          creds.adminPassword;

        if (password !== expectedPw) {
          return { ok: false, error: 'Incorrect password for Principal / Admin account.' };
        }

        setCurrentUser({
          id: 'auth-admin',
          name:
            db.schoolProfile.principalName.trim() ||
            principal?.name ||
            'Principal / Admin',
          role: 'admin',
          identifier: principal?.empId || cleanId,
          staffId: principal?.id,
        });
        return { ok: true };
      }

      if (role === 'teacher') {
        const teachers = db.staff.filter((s) => s.department === 'Teaching');
        const teacher = teachers.find(
          (s) =>
            s.empId.toLowerCase() === lowerId ||
            (isEmailQuery && s.email.trim().toLowerCase() === lowerId) ||
            (phoneQuery &&
              normalizePhone(s.phone) === normalizedInputPhone &&
              normalizedInputPhone.length >= 8)
        );
        if (!teacher) {
          return {
            ok: false,
            error: 'No Teacher found with that Mobile Number, Email, or Employee ID.',
          };
        }

        const empKey = teacher.empId.toUpperCase();
        const emailKey = teacher.email.trim().toLowerCase();
        const phoneKey = normalizePhone(teacher.phone);
        const expectedPw =
          creds.customPasswords[empKey] ||
          (emailKey ? creds.customPasswords[emailKey] : undefined) ||
          (emailKey ? creds.customPasswords[emailKey.toUpperCase()] : undefined) ||
          (phoneKey ? creds.customPasswords[phoneKey] : undefined) ||
          creds.defaultTeacherPassword;

        if (password !== expectedPw) {
          return { ok: false, error: 'Incorrect password for this Teacher account.' };
        }

        setCurrentUser({
          id: `auth-${teacher.id}`,
          name: teacher.name,
          role: 'teacher',
          identifier: teacher.empId,
          staffId: teacher.id,
        });
        return { ok: true };
      }

      if (role === 'student') {
        const matches = specificStudentId
          ? db.students.filter((s) => s.id === specificStudentId)
          : db.students.filter(
              (s) =>
                s.srNo.toLowerCase() === lowerId ||
                (isEmailQuery &&
                  !!s.parentEmail &&
                  s.parentEmail.trim().toLowerCase() === lowerId) ||
                (phoneQuery &&
                  normalizePhone(s.parentContact) === normalizedInputPhone &&
                  normalizedInputPhone.length >= 8)
            );

        if (matches.length === 0) {
          return {
            ok: false,
            error: 'No Student / Parent found with that Mobile Number, Email, or SR Number.',
          };
        }

        const validMatches = matches.filter((student) => {
          const srKey = student.srNo.toUpperCase();
          const emailKey = student.parentEmail?.trim().toLowerCase();
          const phoneKey = normalizePhone(student.parentContact);
          const expectedPw =
            creds.customPasswords[srKey] ||
            (emailKey ? creds.customPasswords[emailKey] : undefined) ||
            (emailKey ? creds.customPasswords[emailKey.toUpperCase()] : undefined) ||
            (phoneKey ? creds.customPasswords[phoneKey] : undefined) ||
            creds.defaultStudentPassword;
          return password === expectedPw;
        });

        if (validMatches.length === 0) {
          return { ok: false, error: 'Incorrect password for this Student / Parent account.' };
        }

        if (validMatches.length > 1) {
          return { ok: false, multipleMatches: validMatches };
        }

        const student = validMatches[0];
        setCurrentUser({
          id: `auth-${student.id}`,
          name: student.name,
          role: 'student',
          identifier: student.srNo,
          studentId: student.id,
        });
        return { ok: true };
      }

      return { ok: false, error: 'Unsupported role selected.' };
    },
    [
      db.staff,
      db.students,
      db.credentials,
      db.schoolProfile.principalName,
      db.schoolProfile.contactEmail,
      db.schoolProfile.contactPhone,
    ]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const importFullDatabase = useCallback((nextDb: SchoolDatabase) => {
    setDb({
      ...nextDb,
      credentials: nextDb.credentials || DEFAULT_CREDENTIALS,
    });
  }, []);

  const clearTransactionalData = useCallback(() => {
    setDb((prev) => ({
      ...prev,
      students: [],
      studentAttendance: [],
      staff: prev.staff.filter((s) => s.empId === 'EMP-RJ-001' || s.id === currentUser?.staffId),
      staffAttendance: [],
      payroll: [],
      busRoutes: [],
      feePayments: [],
      examRecords: [],
      timetable: [],
      homework: [],
      notices: [],
    }));
  }, [currentUser?.staffId]);

  const updateCredentials = useCallback((creds: PortalCredentials) => {
    setDb((prev) => ({
      ...prev,
      credentials: creds,
    }));
  }, []);

  const addStudent = useCallback((studentData: Omit<Student, 'id'>): Student => {
    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setDb((prev) => ({
      ...prev,
      students: [newStudent, ...prev.students],
    }));
    return newStudent;
  }, []);

  const updateStudent = useCallback((updated: Student) => {
    setDb((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === updated.id ? updated : s)),
    }));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
      studentAttendance: prev.studentAttendance.filter((a) => a.studentId !== id),
      feePayments: prev.feePayments.filter((f) => f.studentId !== id),
      examRecords: prev.examRecords.filter((e) => e.studentId !== id),
    }));
  }, []);

  const bulkImportStudents = useCallback((items: Omit<Student, 'id'>[]): number => {
    if (items.length === 0) return 0;
    const timestamp = Date.now();
    const created: Student[] = items.map((item, idx) => ({
      ...item,
      id: `stu-imp-${timestamp}-${idx}`,
    }));
    setDb((prev) => ({
      ...prev,
      students: [...created, ...prev.students],
    }));
    return created.length;
  }, []);

  const markStudentAttendance = useCallback(
    (studentId: string, date: string, status: AttendanceStatus) => {
      setDb((prev) => {
        const existingIdx = prev.studentAttendance.findIndex(
          (r) => r.studentId === studentId && r.date === date
        );
        const nextRecords = [...prev.studentAttendance];
        if (existingIdx >= 0) {
          nextRecords[existingIdx] = { ...nextRecords[existingIdx], status };
        } else {
          nextRecords.push({
            id: `att-${studentId}-${date}`,
            studentId,
            date,
            status,
          });
        }
        return { ...prev, studentAttendance: nextRecords };
      });
    },
    []
  );

  const markClassAllPresent = useCallback((studentIds: string[], date: string) => {
    setDb((prev) => {
      const nextRecords = [...prev.studentAttendance];
      studentIds.forEach((studentId) => {
        const existingIdx = nextRecords.findIndex(
          (r) => r.studentId === studentId && r.date === date
        );
        if (existingIdx >= 0) {
          nextRecords[existingIdx] = { ...nextRecords[existingIdx], status: 'Present' };
        } else {
          nextRecords.push({
            id: `att-${studentId}-${date}`,
            studentId,
            date,
            status: 'Present',
          });
        }
      });
      return { ...prev, studentAttendance: nextRecords };
    });
  }, []);

  const getStudentAttendanceStats = useCallback(
    (studentId: string) => {
      const records = db.studentAttendance.filter((r) => r.studentId === studentId);
      const totalDays = records.length;
      const presentDays = records.filter((r) => r.status === 'Present').length;
      const absentDays = records.filter((r) => r.status === 'Absent').length;
      const leaveDays = records.filter((r) => r.status === 'Leave').length;
      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 100;
      return { totalDays, presentDays, absentDays, leaveDays, percentage };
    },
    [db.studentAttendance]
  );

  const addStaff = useCallback((member: Omit<StaffMember, 'id'>) => {
    const newMember: StaffMember = {
      ...member,
      id: `stf-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      staff: [...prev.staff, newMember],
    }));
  }, []);

  const updateStaff = useCallback(
    (updated: StaffMember) => {
      const isPrincipalRecord =
        updated.id === 'stf-1' ||
        updated.empId === 'EMP-RJ-001' ||
        updated.designation.toLowerCase().includes('principal');
      setDb((prev) => ({
        ...prev,
        staff: prev.staff.map((s) => (s.id === updated.id ? updated : s)),
        schoolProfile: isPrincipalRecord
          ? {
              ...prev.schoolProfile,
              principalName:
                updated.name.trim() === 'Principal / Admin' ? '' : updated.name.trim(),
            }
          : prev.schoolProfile,
      }));
      if (currentUser?.staffId === updated.id) {
        setCurrentUser((prevUser) =>
          prevUser ? { ...prevUser, name: updated.name.trim() || 'Principal / Admin' } : prevUser
        );
      }
    },
    [currentUser?.staffId]
  );

  const deleteStaff = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      staff: prev.staff.filter((s) => s.id !== id),
      staffAttendance: prev.staffAttendance.filter((a) => a.staffId !== id),
      payroll: prev.payroll.filter((p) => p.staffId !== id),
    }));
  }, []);

  const markStaffAttendance = useCallback(
    (staffId: string, date: string, status: StaffAttendanceStatus) => {
      setDb((prev) => {
        const existingIdx = prev.staffAttendance.findIndex(
          (r) => r.staffId === staffId && r.date === date
        );
        const nextRecords = [...prev.staffAttendance];
        if (existingIdx >= 0) {
          nextRecords[existingIdx] = { ...nextRecords[existingIdx], status };
        } else {
          nextRecords.push({
            id: `satt-${staffId}-${date}`,
            staffId,
            date,
            status,
          });
        }
        return { ...prev, staffAttendance: nextRecords };
      });
    },
    []
  );

  const generateMonthlyPayroll = useCallback((month: string, monthLabel: string) => {
    setDb((prev) => {
      const otherMonths = prev.payroll.filter((p) => p.month !== month);
      const existingThisMonth = prev.payroll.filter((p) => p.month === month);

      const monthRecords: PayrollRecord[] = prev.staff.map((member) => {
        const att = prev.staffAttendance.filter(
          (r) => r.staffId === member.id && r.date.startsWith(month)
        );
        const clDays = att.filter((a) => a.status === 'CL').length;
        const halfDays = att.filter((a) => a.status === 'Half Day').length;
        const unpaidLeaveDays = att.filter((a) => a.status === 'Unpaid Leave').length;
        const workingDays = 25;
        const presentDays = Math.max(0, workingDays - clDays - halfDays - unpaidLeaveDays);

        const perDaySalary = member.baseSalary / 30;
        const leaveDeduction = Math.round(perDaySalary * (unpaidLeaveDays + halfDays * 0.5));
        const netPayable = Math.max(
          0,
          member.baseSalary + member.allowances - member.pfDeduction - leaveDeduction
        );

        const existing = existingThisMonth.find((p) => p.staffId === member.id);

        return {
          id: existing?.id || `pay-${month}-${member.id}`,
          staffId: member.id,
          month,
          monthLabel,
          workingDays,
          presentDays,
          clDays,
          halfDays,
          unpaidLeaveDays,
          baseSalary: member.baseSalary,
          allowances: member.allowances,
          pfDeduction: member.pfDeduction,
          leaveDeduction,
          netPayable,
          status: existing?.status || 'Pending',
          paidOn: existing?.paidOn,
        };
      });

      return {
        ...prev,
        payroll: [...monthRecords, ...otherMonths],
      };
    });
  }, []);

  const updatePayrollRecord = useCallback((updated: PayrollRecord) => {
    setDb((prev) => ({
      ...prev,
      payroll: prev.payroll.map((p) => (p.id === updated.id ? updated : p)),
    }));
  }, []);

  const deletePayrollRecord = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      payroll: prev.payroll.filter((p) => p.id !== id),
    }));
  }, []);

  const togglePayrollStatus = useCallback((payrollId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setDb((prev) => ({
      ...prev,
      payroll: prev.payroll.map((p) => {
        if (p.id !== payrollId) return p;
        const nextStatus = p.status === 'Paid' ? 'Pending' : 'Paid';
        return {
          ...p,
          status: nextStatus,
          paidOn: nextStatus === 'Paid' ? today : undefined,
        };
      }),
    }));
  }, []);

  const addBusRoute = useCallback((route: Omit<BusRoute, 'id'>) => {
    const newRoute: BusRoute = {
      ...route,
      id: `bus-${Date.now()}`,
    };
    setDb((prev) => ({
      ...prev,
      busRoutes: [...prev.busRoutes, newRoute],
    }));
  }, []);

  const updateBusRoute = useCallback((updated: BusRoute) => {
    setDb((prev) => ({
      ...prev,
      busRoutes: prev.busRoutes.map((b) => (b.id === updated.id ? updated : b)),
    }));
  }, []);

  const deleteBusRoute = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      busRoutes: prev.busRoutes.filter((b) => b.id !== id),
      students: prev.students.map((s) =>
        s.busRouteId === id ? { ...s, busRouteId: null, busStopId: null } : s
      ),
    }));
  }, []);

  const updateTripProgress = useCallback(
    (routeId: string, tripStatus: TripStatus, currentStopIndex: number) => {
      const nowTime = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setDb((prev) => ({
        ...prev,
        busRoutes: prev.busRoutes.map((r) =>
          r.id === routeId
            ? {
                ...r,
                tripStatus,
                currentStopIndex: Math.max(0, Math.min(currentStopIndex, r.stops.length - 1)),
                lastUpdated: nowTime,
              }
            : r
        ),
      }));
    },
    []
  );

  const assignStudentBus = useCallback(
    (studentId: string, busRouteId: string | null, busStopId: string | null) => {
      setDb((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, busRouteId, busStopId } : s
        ),
      }));
    },
    []
  );

  const updateFeeStructure = useCallback((structure: FeeStructure) => {
    setDb((prev) => ({
      ...prev,
      feeStructures: prev.feeStructures.map((f) =>
        f.className === structure.className ? structure : f
      ),
    }));
  }, []);

  const recordFeePayment = useCallback(
    (paymentData: Omit<FeePayment, 'id' | 'receiptNo'>): FeePayment => {
      const receiptNo = `REC-2026-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const newPayment: FeePayment = {
        ...paymentData,
        id: `fee-${Date.now()}`,
        receiptNo,
      };
      setDb((prev) => ({
        ...prev,
        feePayments: [newPayment, ...prev.feePayments],
      }));
      return newPayment;
    },
    []
  );

  const updateFeePayment = useCallback((updated: FeePayment) => {
    setDb((prev) => ({
      ...prev,
      feePayments: prev.feePayments.map((p) => (p.id === updated.id ? updated : p)),
    }));
  }, []);

  const deleteFeePayment = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      feePayments: prev.feePayments.filter((p) => p.id !== id),
    }));
  }, []);

  const saveExamRecord = useCallback((recordData: Omit<ExamRecord, 'id'>) => {
    setDb((prev) => {
      const existingIdx = prev.examRecords.findIndex(
        (e) =>
          e.studentId === recordData.studentId &&
          e.term === recordData.term &&
          e.academicYear === recordData.academicYear
      );
      const next = [...prev.examRecords];
      if (existingIdx >= 0) {
        next[existingIdx] = { ...next[existingIdx], ...recordData };
      } else {
        next.unshift({
          ...recordData,
          id: `ex-${Date.now()}`,
        });
      }
      return { ...prev, examRecords: next };
    });
  }, []);

  const deleteExamRecord = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      examRecords: prev.examRecords.filter((e) => e.id !== id),
    }));
  }, []);

  const addHomework = useCallback((item: Omit<HomeworkItem, 'id' | 'createdAt'>) => {
    const newItem: HomeworkItem = {
      ...item,
      id: `hw-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDb((prev) => ({
      ...prev,
      homework: [newItem, ...prev.homework],
    }));
  }, []);

  const updateHomework = useCallback((updated: HomeworkItem) => {
    setDb((prev) => ({
      ...prev,
      homework: prev.homework.map((h) => (h.id === updated.id ? updated : h)),
    }));
  }, []);

  const deleteHomework = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      homework: prev.homework.filter((h) => h.id !== id),
    }));
  }, []);

  const addNotice = useCallback((notice: Omit<NoticeItem, 'id' | 'date'>) => {
    const newNotice: NoticeItem = {
      ...notice,
      id: `not-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    };
    setDb((prev) => ({
      ...prev,
      notices: [newNotice, ...prev.notices],
    }));
  }, []);

  const updateNotice = useCallback((updated: NoticeItem) => {
    setDb((prev) => ({
      ...prev,
      notices: prev.notices.map((n) => (n.id === updated.id ? updated : n)),
    }));
  }, []);

  const deleteNotice = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      notices: prev.notices.filter((n) => n.id !== id),
    }));
  }, []);

  const saveTimetableEntry = useCallback((entry: Omit<TimetableEntry, 'id'>) => {
    setDb((prev) => {
      const idx = prev.timetable.findIndex(
        (t) => t.className === entry.className && t.day === entry.day
      );
      const next = [...prev.timetable];
      if (idx >= 0) {
        next[idx] = { ...next[idx], periods: entry.periods };
      } else {
        next.push({ ...entry, id: `tt-${Date.now()}` });
      }
      return { ...prev, timetable: next };
    });
  }, []);

  const updateSchoolProfile = useCallback(
    (profile: SchoolProfile) => {
      const trimmedPrincipal = profile.principalName.trim();
      const displayPrincipalName = trimmedPrincipal || 'Principal / Admin';
      setDb((prev) => ({
        ...prev,
        schoolProfile: {
          ...profile,
          principalName: trimmedPrincipal,
        },
        staff: prev.staff.map((s) =>
          s.id === 'stf-1' ||
          s.empId === 'EMP-RJ-001' ||
          s.designation.toLowerCase().includes('principal')
            ? { ...s, name: displayPrincipalName }
            : s
        ),
      }));
      if (currentUser?.role === 'admin') {
        setCurrentUser((prevUser) =>
          prevUser ? { ...prevUser, name: displayPrincipalName } : prevUser
        );
      }
    },
    [currentUser?.role]
  );

  return (
    <SchoolContext.Provider
      value={{
        db,
        currentUser,
        loginWithCredentials,
        logout,
        importFullDatabase,
        clearTransactionalData,
        updateCredentials,
        addStudent,
        updateStudent,
        deleteStudent,
        bulkImportStudents,
        markStudentAttendance,
        markClassAllPresent,
        getStudentAttendanceStats,
        addStaff,
        updateStaff,
        deleteStaff,
        markStaffAttendance,
        generateMonthlyPayroll,
        updatePayrollRecord,
        deletePayrollRecord,
        togglePayrollStatus,
        addBusRoute,
        updateBusRoute,
        deleteBusRoute,
        updateTripProgress,
        assignStudentBus,
        updateFeeStructure,
        recordFeePayment,
        updateFeePayment,
        deleteFeePayment,
        saveExamRecord,
        deleteExamRecord,
        addHomework,
        updateHomework,
        deleteHomework,
        addNotice,
        updateNotice,
        deleteNotice,
        saveTimetableEntry,
        updateSchoolProfile,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used inside SchoolProvider');
  return ctx;
}
