import type {
  AbsenceResult,
  AdminSummary,
  Announcement,
  AppUser,
  Assignment,
  AttendanceRecord,
  AttendanceReport,
  AuditLog,
  BulkAttendanceResult,
  BusinessProduct,
  BusinessSummary,
  Complaint,
  ComplaintSummary,
  DashboardSummary,
  EducationSummary,
  GovernmentService,
  HealthTopic,
  Lesson,
  LeaveSchoolResult,
  LoanRecord,
  Notification,
  Quiz,
  QuizQuestion,
  Result,
  SaleRecord,
  School,
  SchoolClass,
  StockMovement,
  Student,
  StudentAbsence,
  Subject,
  Supplier,
  Teacher,
} from '@/types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
const TOKEN_KEY = 'ihuriro.token';

export class ApiError extends Error {
  status: number;
  details?: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, details?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('Cannot reach the IHURIRO server. Check that the API is running.', 0);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const payload = (data || {}) as {
      error?: string;
      details?: Array<{ field: string; message: string }>;
    };
    const detail = payload.details?.[0]?.message;
    const message = detail || payload.error || `Request failed (${response.status})`;

    if (response.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('ihuriro:unauthorized'));
    }

    throw new ApiError(message, response.status, payload.details);
  }

  return data as T;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  language?: string;
}

interface AuthResponse {
  token: string;
  user: AppUser;
}

export const api = {
  get: request,

  healthCheck: () => request<{ status: string; users: number }>('/health'),

  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
    register: (payload: RegisterPayload) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: payload }),
    googleConfig: () => request<{ enabled: boolean; clientId: string | null }>('/auth/google/config'),
    google: (credential: string) =>
      request<AuthResponse & { isNew?: boolean }>('/auth/google', { method: 'POST', body: { credential } }),
    me: () => request<{ user: AppUser }>('/auth/me'),
    updateProfile: (payload: Partial<Pick<AppUser, 'name' | 'phone' | 'language'>>) =>
      request<{ user: AppUser }>('/auth/profile', { method: 'PATCH', body: payload }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ ok: boolean }>('/auth/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      }),
    logout: async () => {
      try {
        await request<{ ok: boolean }>('/auth/logout', { method: 'POST' });
      } catch {
        // the local token is discarded even if the audit call fails
      }
      setToken(null);
    },
  },

  complaints: {
    list: (params?: { status?: string; category?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.category) query.set('category', params.category);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return request<{ complaints: Complaint[] }>(`/complaints${suffix}`);
    },
    summary: () => request<{ summary: ComplaintSummary }>('/complaints/summary'),
    create: (payload: Pick<Complaint, 'category' | 'title' | 'description' | 'location'>) =>
      request<{ complaint: Complaint }>('/complaints', { method: 'POST', body: payload }),
    update: (id: string, payload: Partial<Pick<Complaint, 'title' | 'category' | 'description' | 'location' | 'status'>>) =>
      request<{ complaint: Complaint }>(`/complaints/${id}`, { method: 'PATCH', body: payload }),
    remove: (id: string) => request<{ ok: boolean }>(`/complaints/${id}`, { method: 'DELETE' }),
  },

  ideas: {
    create: (payload: { title: string; description: string; category?: string }) =>
      request<{ idea: { id: string } }>('/ideas', { method: 'POST', body: payload }),
  },

  announcements: {
    list: () => request<{ announcements: Announcement[] }>('/announcements'),
    create: (payload: { title: string; date: string; category: string; content: string }) =>
      request<{ announcement: Announcement }>('/announcements', { method: 'POST', body: payload }),
    remove: (id: string) =>
      request<{ ok: boolean }>(`/announcements/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    list: () => request<{ notifications: Notification[]; unread: number }>('/notifications'),
    markRead: (id: string) =>
      request<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ ok: boolean; updated: number }>('/notifications/read-all', {
      method: 'POST',
    }),
  },

  education: {
    students: () => request<{ students: Student[] }>('/education/students'),
    createStudent: (payload: {
      name: string;
      class: string;
      attendance?: number;
      performance?: number;
      status?: Student['status'];
      dateOfBirth?: string;
      gender?: string;
      academicYear?: string;
      parentName?: string;
      parentPhone?: string;
      parentEmail?: string;
    }) => request<{ student: Student }>('/education/students', { method: 'POST', body: payload }),
    createStudentsBulk: (payload: {
      students: {
        name: string;
        class: string;
        dateOfBirth?: string;
        gender?: string;
        academicYear?: string;
        parentName?: string;
        parentPhone?: string;
        parentEmail?: string;
      }[];
    }) =>
      request<{ created: Student[]; skipped: string[] }>('/education/students/bulk', {
        method: 'POST',
        body: payload,
      }),
    updateStudent: (id: string, payload: Partial<Student>) =>
      request<{ student: Student }>(`/education/students/${id}`, { method: 'PATCH', body: payload }),
    absences: (date?: string) =>
      request<{ absences: StudentAbsence[] }>(
        `/education/absences${date ? `?date=${encodeURIComponent(date)}` : ''}`
      ),
    markAbsence: (studentId: string, date?: string) =>
      request<AbsenceResult>(`/education/students/${studentId}/absence`, {
        method: 'POST',
        body: date ? { date } : {},
      }),
    attendance: (params?: {
      date?: string;
      from?: string;
      to?: string;
      status?: string;
      class?: string;
      school?: string;
    }) => {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params || {})) {
        if (value) query.set(key, value);
      }
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return request<{ attendance: AttendanceRecord[] }>(`/education/attendance${suffix}`);
    },
    attendanceReports: (params?: { from?: string; to?: string; class?: string; school?: string }) => {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params || {})) {
        if (value) query.set(key, value);
      }
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return request<AttendanceReport>(`/education/attendance/reports${suffix}`);
    },
    markAttendance: (
      studentId: string,
      status: AttendanceRecord['status'],
      date?: string,
      remarks?: string
    ) =>
      request<{ attendance: AttendanceRecord }>(`/education/students/${studentId}/attendance`, {
        method: 'POST',
        body: { status, ...(date ? { date } : {}), ...(remarks ? { remarks } : {}) },
      }),
    leaveSchool: (studentId: string, payload?: { date?: string; reason?: string }) =>
      request<LeaveSchoolResult>(`/education/students/${studentId}/leave-school`, {
        method: 'POST',
        body: payload || {},
      }),
    saveAttendance: (
      records: Array<{ studentId: string; status: AttendanceRecord['status']; remarks?: string }>,
      date?: string,
      schoolId?: string
    ) =>
      request<BulkAttendanceResult>('/education/attendance/bulk', {
        method: 'POST',
        body: { records, ...(date ? { date } : {}), ...(schoolId ? { schoolId } : {}) },
      }),
    teachers: () => request<{ teachers: Teacher[] }>('/education/teachers'),
    createTeacher: (payload: {
      name: string;
      subjects: string[];
      classes: string[];
      students?: number;
      phone?: string;
      email?: string;
    }) => request<{ teacher: Teacher }>('/education/teachers', { method: 'POST', body: payload }),
    schools: () => request<{ schools: School[] }>('/education/schools'),
    createSchool: (payload: {
      name: string;
      district: string;
      level: string;
      students?: number;
      teachers?: number;
    }) => request<{ school: School }>('/education/schools', { method: 'POST', body: payload }),
    classes: () => request<{ classes: SchoolClass[] }>('/education/classes'),
    createClass: (payload: {
      name: string;
      teacher: string;
      students?: number;
      room?: string;
      subjects?: number;
    }) => request<{ class: SchoolClass }>('/education/classes', { method: 'POST', body: payload }),
    createClassesBulk: (payload: {
      classes: {
        name: string;
        teacher: string;
        students?: number;
        room?: string;
        subjects?: number;
      }[];
    }) =>
      request<{ created: SchoolClass[]; skipped: string[] }>('/education/classes/bulk', {
        method: 'POST',
        body: payload,
      }),
    subjects: () => request<{ subjects: Subject[] }>('/education/subjects'),
    createSubject: (payload: {
      name: string;
      teacher?: string;
      classes: string[];
    }) => request<{ subject: Subject }>('/education/subjects', { method: 'POST', body: payload }),
    lessons: () => request<{ lessons: Lesson[] }>('/education/lessons'),
    createLesson: (payload: {
      title: string;
      subject: string;
      class: string;
      date: string;
      status?: Lesson['status'];
    }) => request<{ lesson: Lesson }>('/education/lessons', { method: 'POST', body: payload }),
    assignments: () => request<{ assignments: Assignment[] }>('/education/assignments'),
    createAssignment: (payload: {
      title: string;
      subject: string;
      class: string;
      due: string;
      submitted?: number;
      total?: number;
    }) => request<{ assignment: Assignment }>('/education/assignments', { method: 'POST', body: payload }),
    results: (studentId?: string) =>
      request<{ results: Result[] }>(`/education/results${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`),
    createResult: (payload: {
      studentId: string;
      subject: string;
      term?: string;
      academicYear?: string;
      marks: number;
    }) => request<{ result: Result }>('/education/results', { method: 'POST', body: payload }),
    summary: () => request<{ summary: EducationSummary }>('/education/summary'),
  },

  business: {
    products: () => request<{ products: BusinessProduct[] }>('/business/products'),
    createProduct: (payload: {
      name: string;
      category: string;
      stock: number;
      unitPrice: number;
      lowStockAlert?: number;
      description?: string;
      supplierId?: string;
      expiryDate?: string;
    }) => request<{ product: BusinessProduct }>('/business/products', { method: 'POST', body: payload }),
    updateProduct: (id: string, payload: Partial<Omit<BusinessProduct, 'id' | 'status'>>) =>
      request<{ product: BusinessProduct }>(`/business/products/${id}`, { method: 'PATCH', body: payload }),
    deleteProduct: (id: string) =>
      request<{ ok: boolean }>(`/business/products/${id}`, { method: 'DELETE' }),
    suppliers: () => request<{ suppliers: Supplier[] }>('/business/suppliers'),
    createSupplier: (payload: {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
      notes?: string;
    }) => request<{ supplier: Supplier }>('/business/suppliers', { method: 'POST', body: payload }),
    updateSupplier: (id: string, payload: Partial<Omit<Supplier, 'id'>>) =>
      request<{ supplier: Supplier }>(`/business/suppliers/${id}`, { method: 'PATCH', body: payload }),
    deleteSupplier: (id: string) =>
      request<{ ok: boolean }>(`/business/suppliers/${id}`, { method: 'DELETE' }),
    sales: () => request<{ sales: SaleRecord[] }>('/business/sales'),
    createSale: (payload: {
      product: string;
      quantity: number;
      amount?: number;
      customer?: string;
      paymentMethod?: string;
      date?: string;
    }) => request<{ sale: SaleRecord }>('/business/sales', { method: 'POST', body: payload }),
    stockMovements: () => request<{ movements: StockMovement[] }>('/business/stock-movements'),
    createStockMovement: (payload: {
      product: string;
      type: StockMovement['type'];
      quantity: number;
      unitPrice?: number;
      reason?: StockMovement['reason'];
      supplierId?: string;
      expiryDate?: string;
      note?: string;
      date?: string;
    }) =>
      request<{ movement: StockMovement; product: BusinessProduct }>('/business/stock-movements', {
        method: 'POST',
        body: payload,
      }),
    loans: () => request<{ loans: LoanRecord[] }>('/business/loans'),
    createLoan: (payload: {
      type?: LoanRecord['type'];
      counterparty: string;
      amount: number;
      date?: string;
      interestRate?: number;
      dueDate?: string;
      notes?: string;
    }) => request<{ loan: LoanRecord }>('/business/loans', { method: 'POST', body: payload }),
    summary: () => request<{ summary: BusinessSummary }>('/business/summary'),
  },

  admin: {
    users: (params?: { q?: string; role?: string }) => {
      const query = new URLSearchParams();
      if (params?.q) query.set('q', params.q);
      if (params?.role) query.set('role', params.role);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return request<{ users: AppUser[]; total: number }>(`/admin/users${suffix}`);
    },
    createUser: (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      role?: string;
      status?: string;
      language?: string;
    }) => request<{ user: AppUser }>('/admin/users', { method: 'POST', body: payload }),
    updateUser: (id: string, payload: Partial<Pick<AppUser, 'name' | 'phone' | 'role' | 'status' | 'language'>>) =>
      request<{ user: AppUser }>(`/admin/users/${id}`, { method: 'PATCH', body: payload }),
    auditLogs: () => request<{ logs: AuditLog[]; total: number }>('/admin/audit-logs'),
    summary: () => request<{ summary: AdminSummary }>('/admin/summary'),
  },

  dashboard: {
    summary: () => request<DashboardSummary>('/dashboard/summary'),
  },

  health: {
    topics: () => request<{ topics: HealthTopic[] }>('/health/topics'),
    createTopic: (payload: {
      title: string;
      category: string;
      excerpt: string;
      readMinutes?: number;
    }) => request<{ topic: HealthTopic }>('/health/topics', { method: 'POST', body: payload }),
  },

  quizzes: {
    list: () => request<{ quizzes: Quiz[] }>('/quizzes'),
    create: (payload: { title: string; category?: string; questions: QuizQuestion[] }) =>
      request<{ quiz: Quiz }>('/quizzes', { method: 'POST', body: payload }),
  },

  governmentServices: {
    list: () => request<{ services: GovernmentService[] }>('/government-services'),
  },

  ai: {
    chat: (payload: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      module?: string;
    }) => request<{ reply: string; source: 'local' | 'local-fallback' | 'anthropic'; model?: string }>(
      '/ai/chat',
      { method: 'POST', body: payload }
    ),
    status: () => request<{ provider: string; externalProviderConfigured: boolean; model?: string | null }>('/ai/status'),
  },
};
