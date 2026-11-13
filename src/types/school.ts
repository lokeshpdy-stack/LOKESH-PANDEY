export type UserRole = 'admin' | 'teacher' | 'student';

export type SchoolClass =
  | 'Nursery (PP-3)'
  | 'LKG (PP-4)'
  | 'UKG (PP-5)'
  | 'Class 1'
  | 'Class 2'
  | 'Class 3'
  | 'Class 4'
  | 'Class 5'
  | 'Class 6'
  | 'Class 7'
  | 'Class 8';

export const SCHOOL_CLASSES: SchoolClass[] = [
  'Nursery (PP-3)',
  'LKG (PP-4)',
  'UKG (PP-5)',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
];

export type SocialCategory = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';

export type RteReimbursementStatus =
  | 'Not Applicable'
  | 'Pending Verification'
  | 'Claim Submitted'
  | 'Approved'
  | 'Disbursed'
  | 'Ineligible (<75% Att.)';

export interface Student {
  id: string;
  srNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  className: SchoolClass;
  section: 'A' | 'B';
  rollNo: number;
  janAadhaar: string;
  aadhaar: string;
  apaarId: string;
  admissionDate: string;
  parentContact: string;
  parentEmail?: string;
  address: string;
  category: SocialCategory;
  isRte: boolean;
  rteAppNo: string;
  rteAdmissionYear: string;
  rteReimbursementStatus: RteReimbursementStatus;
  busRouteId: string | null;
  busStopId: string | null;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export type StaffAttendanceStatus = 'Present' | 'CL' | 'Half Day' | 'Unpaid Leave';

export interface StaffMember {
  id: string;
  empId: string;
  name: string;
  designation: string;
  department: 'Teaching' | 'Administration' | 'Support' | 'Transport';
  assignedClasses: SchoolClass[];
  qualification: string;
  joiningDate: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  baseSalary: number;
  allowances: number;
  pfDeduction: number;
  clBalance: number;
}

export interface StaffAttendanceRecord {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  status: StaffAttendanceStatus;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  month: string; // YYYY-MM e.g. '2026-11'
  monthLabel: string; // e.g. 'November 2026'
  workingDays: number;
  presentDays: number;
  clDays: number;
  halfDays: number;
  unpaidLeaveDays: number;
  baseSalary: number;
  allowances: number;
  pfDeduction: number;
  leaveDeduction: number;
  netPayable: number;
  status: 'Paid' | 'Pending';
  paidOn?: string;
}

export interface BusStop {
  id: string;
  name: string;
  pickupTime: string;
  dropTime: string;
  landmark: string;
}

export type TripStatus =
  | 'Not Started'
  | 'On Route - Pickup'
  | 'Reached School'
  | 'On Route - Drop';

export interface BusRoute {
  id: string;
  routeCode: string;
  routeName: string;
  vehicleNumber: string;
  capacity: number;
  driverName: string;
  driverContact: string;
  conductorName: string;
  monthlyFee: number;
  stops: BusStop[];
  tripStatus: TripStatus;
  currentStopIndex: number;
  lastUpdated: string;
}

export interface FeeStructure {
  className: SchoolClass;
  annualTuitionFee: number;
  monthlyTuitionFee: number;
  annualExamAndActivityFee: number;
  sanctionedSeats: number;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  date: string;
  feePeriod: string;
  tuitionAmount: number;
  transportAmount: number;
  otherAmount: number;
  totalPaid: number;
  paymentMode: 'UPI' | 'Cash' | 'Cheque' | 'Bank Transfer';
  rteExempted: boolean;
  remarks: string;
}

export type ExamTerm = 'Unit Test 1' | 'Half-Yearly' | 'Annual Exam';

export interface SubjectMark {
  subject: string;
  maxMarks: number;
  obtainedMarks: number;
}

export interface ExamRecord {
  id: string;
  studentId: string;
  term: ExamTerm;
  academicYear: string;
  marks: SubjectMark[];
  teacherRemarks: string;
}

export interface TimetableEntry {
  id: string;
  className: SchoolClass;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periods: {
    time: string;
    subject: string;
    teacherName: string;
  }[];
}

export interface HomeworkItem {
  id: string;
  className: SchoolClass;
  subject: string;
  title: string;
  description: string;
  syllabusProgress: number; // 0-100
  dueDate: string;
  assignedBy: string;
  createdAt: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  body: string;
  audience: 'All' | 'Teachers' | 'Students & Parents';
  category: 'RTE / Govt' | 'Academic' | 'Transport' | 'General' | 'Fee';
  postedBy: string;
  date: string;
  pinned: boolean;
}

export interface SchoolProfile {
  schoolName: string;
  diseCode: string;
  rtePortalCode: string;
  affiliation: string;
  address: string;
  district: string;
  academicSession: string;
  principalName: string;
  contactPhone: string;
  contactEmail: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  identifier: string; // e.g., Emp ID, SR No, Email, or Mobile
  staffId?: string;
  studentId?: string;
}

export interface PortalCredentials {
  adminPassword: string;
  defaultTeacherPassword: string;
  defaultStudentPassword: string;
  customPasswords: Record<string, string>; // keyed by empId or srNo
}

export interface SchoolDatabase {
  schoolProfile: SchoolProfile;
  credentials?: PortalCredentials;
  students: Student[];
  studentAttendance: StudentAttendanceRecord[];
  staff: StaffMember[];
  staffAttendance: StaffAttendanceRecord[];
  payroll: PayrollRecord[];
  busRoutes: BusRoute[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  examRecords: ExamRecord[];
  timetable: TimetableEntry[];
  homework: HomeworkItem[];
  notices: NoticeItem[];
}
