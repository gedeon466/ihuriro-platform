export type Language = 'en' | 'rw' | 'fr';

export type UserRole = 'citizen' | 'student' | 'parent' | 'teacher' | 'business' | 'health' | 'government' | 'admin';

export type ModuleId =
  | 'home'
  | 'citizenconnect'
  | 'education'
  | 'parentcare'
  | 'biz360'
  | 'learnrwanda'
  | 'notifications'
  | 'ai-assistant'
  | 'profile'
  | 'admin';

export interface NavChild {
  id: string;
  label: string;
  labelKw: string;
  labelFr: string;
  icon: string;
}

export interface NavItem {
  id: ModuleId;
  label: string;
  labelKw: string;
  labelFr: string;
  icon: string;
  color: string;
  children?: NavChild[];
  roles?: UserRole[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  language: Language;
  status?: 'active' | 'suspended';
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  module: ModuleId;
  createdAt: number;
}

export interface Notification {
  id: string;
  type: 'system' | 'sms' | 'email' | 'government' | 'school' | 'health' | 'business';
  title: string;
  message: string;
  read: boolean;
  date: string;
  channel: 'sms' | 'email' | 'system';
}

export interface Complaint {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in-review' | 'resolved' | 'rejected';
  date: string;
  description: string;
  location: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComplaintSummary {
  total: number;
  pending: number;
  'in-review': number;
  resolved: number;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  attendance: number;
  performance: number;
  status: 'active' | 'at-risk' | 'dropped';
  dateOfBirth?: string;
  gender?: string;
  academicYear?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  guardianUserId?: string;
  guardianUserName?: string;
  guardianLinked?: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentAbsence {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  kind?: 'absence' | 'leave';
  remarks?: string;
  guardianUserId?: string;
  guardianName?: string;
  guardianContact?: string;
  sms: string;
  smsSource?: 'anthropic' | 'local' | 'local-fallback';
  createdBy?: string;
  createdAt?: string;
}

export interface AbsenceResult {
  absence: StudentAbsence;
  guardian: { id: string; name: string; email: string; phone: string } | null;
  guardianContact: string;
  notified: boolean;
  notificationId: string | null;
  sms: string;
  smsSource: 'anthropic' | 'local' | 'local-fallback';
}

export interface LeaveSchoolResult {
  alert: StudentAbsence;
  guardian: { id: string; name: string; email: string; phone: string } | null;
  guardianContact: string;
  notified: boolean;
  notificationId: string | null;
  sms: string;
  smsSource: 'local';
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  classId?: string;
  schoolId?: string;
  schoolName?: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  markedBy?: string;
  markedByName?: string;
  recordedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceReportBucket {
  marked: number;
  rate: number;
}

export interface AttendanceReport {
  from: string;
  to: string;
  totals: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    marked: number;
    rate: number;
  };
  daily: Array<AttendanceReportBucket & { date: string }>;
  weekly: Array<AttendanceReportBucket & { start: string; end: string }>;
  monthly: Array<AttendanceReportBucket & { month: string }>;
  byClass: Array<
    AttendanceReportBucket & {
      className: string;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }
  >;
}

export interface AttendanceAlert {
  studentId: string;
  studentName: string;
  className: string;
  guardianName: string;
  contact: string;
  smsSent: boolean;
  notified: boolean;
  reason: 'notified' | 'saved' | 'no-contact' | 'already-notified';
  sms: string;
}

export interface BulkAttendanceResult {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  smsSent: number;
  alerts: AttendanceAlert[];
  attendance: AttendanceRecord[];
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  classes: string[];
  students: number;
  phone?: string;
  email?: string;
}

export interface School {
  id: string;
  name: string;
  district: string;
  level: string;
  students: number;
  teachers: number;
}

export interface SchoolClass {
  id: string;
  name: string;
  teacher: string;
  students: number;
  room: string;
  subjects: number;
}

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  classes: string[];
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  class: string;
  due: string;
  submitted: number;
  total: number;
}

export interface Result {
  id: string;
  studentId: string;
  subject: string;
  term: string;
  academicYear: string;
  marks: number;
}

export interface EducationSummary {
  students: number;
  teachers: number;
  atRisk: number;
  dropped: number;
  averageAttendance: number;
  averagePerformance: number;
}

export interface BusinessProduct {
  id: string;
  name: string;
  category: string;
  stock: number;
  unitPrice: number;
  lowStockAlert?: number;
  description?: string;
  supplierId?: string | null;
  supplierName?: string;
  expiryDate?: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StockReason =
  | 'purchase'
  | 'supplier-delivery'
  | 'return'
  | 'transfer-in'
  | 'adjustment'
  | 'sale'
  | 'damaged'
  | 'expired'
  | 'transfer-out'
  | 'loss'
  | 'other';

export interface StockMovement {
  id: string;
  productId: string | null;
  product: string;
  type: 'in' | 'out';
  quantity: number;
  unitPrice: number;
  total: number;
  reason: StockReason;
  supplierId: string | null;
  supplierName: string;
  expiryDate: string;
  note: string;
  userId: string | null;
  userName: string;
  date: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
}

export interface LoanRecord {
  id: string;
  type: 'loan' | 'debt';
  counterparty: string;
  amount: number;
  date: string;
  interestRate: number;
  dueDate: string;
  notes: string;
  status?: string;
  userId?: string;
  createdAt?: string;
}

export interface SaleRecord {
  id: string;
  product: string;
  quantity: number;
  amount: number;
  date: string;
  customer: string;
  paymentMethod?: string;
  createdAt?: string;
}

export interface BusinessSummary {
  revenue: number;
  salesCount: number;
  unitsSold: number;
  lowStock: number;
  outOfStock: number;
  products: number;
  inventoryValue: number;
  availableStock: number;
  totalStockIn: number;
  totalStockOut: number;
  suppliers: number;
  expiringSoon: number;
  expired: number;
  topProducts: Array<{ product: string; revenue: number; units: number }>;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  detail: string;
  ip: string;
  createdAt: string;
}

export interface AdminSummary {
  users: number;
  byRole: Array<{ role: string; count: number }>;
  status: Array<{ status: string; count: number }>;
  complaints: number;
  auditEvents: number;
  recentActivity: AuditLog[];
}

export interface DashboardSummary {
  platform: {
    users: number;
    complaints: number;
    complaintsResolved: number;
    students: number;
    studentsAtRisk: number;
    teachers: number;
    products: number;
    lowStock: number;
    revenue: number;
    sales: number;
  };
  personal: {
    unreadNotifications: number;
    complaints: number;
    openComplaints: number;
    loans: number;
  };
  announcements: Array<{ id: string; title: string; date: string; category: string }>;
}

export interface HealthTopic {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  readMinutes: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  questions: QuizQuestion[];
}

export interface GovernmentService {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  requirements: string[];
  steps: string[];
  fee: string;
  processingTime: string;
  office: string;
  contact: string;
}
