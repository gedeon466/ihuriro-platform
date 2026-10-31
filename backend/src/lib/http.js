export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function parseBody(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || '(body)',
      message: issue.message,
    }));
    throw new AppError(422, 'Please check the submitted information.', details);
  }
  return result.data;
}

export function parseQuery(schema, query) {
  const result = schema.safeParse(query ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || '(query)',
      message: issue.message,
    }));
    throw new AppError(400, 'Invalid query parameters.', details);
  }
  return result.data;
}

export function pagination(query, maxLimit = 100) {
  const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '50', 10) || 50, 1), maxLimit);
  const offset = Math.max(Number.parseInt(query.offset ?? '0', 10) || 0, 0);
  return { limit, offset };
}

const isoDate = (value) => (value ? String(value).slice(0, 10) : '');

export function serializeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    language: row.language,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function serializeComplaint(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    date: isoDate(row.created_at),
    description: row.description,
    location: row.location,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function serializeIdea(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category || '',
    status: row.status,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export function serializeStudent(row, guardian = null) {
  return {
    id: row.id,
    name: row.name,
    class: row.class ?? row.class_name ?? '',
    attendance: Number(row.attendance),
    performance: Number(row.performance),
    status: row.status,
    dateOfBirth: row.date_of_birth || '',
    gender: row.gender || '',
    academicYear: row.academic_year || '',
    parentName: row.parent_name || '',
    parentPhone: row.parent_phone || '',
    parentEmail: row.parent_email || '',
    guardianUserId: guardian?.id || '',
    guardianUserName: guardian?.name || '',
    guardianLinked: Boolean(guardian),
  };
}

export function serializeAttendance(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || '',
    className: row.student_class || row.class_name || '',
    classId: row.class_id || '',
    schoolId: row.school_id || '',
    schoolName: row.school_name || '',
    date: isoDate(row.date),
    status: row.status,
    remarks: row.remarks || '',
    markedBy: row.recorded_by || '',
    markedByName: row.marked_by_name || '',
    recordedBy: row.recorded_by || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function serializeAbsence(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || '',
    className: row.student_class || '',
    date: isoDate(row.date),
    kind: row.kind || 'absence',
    remarks: row.remarks || '',
    guardianUserId: row.guardian_user_id || '',
    guardianName: row.guardian_name || '',
    guardianContact: row.guardian_contact || '',
    sms: row.sms || '',
    smsSource: row.sms_source || 'local',
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeTeacher(row) {
  return {
    id: row.id,
    name: row.name,
    subjects: parseList(row.subjects),
    classes: parseList(row.classes),
    students: Number(row.students),
    phone: row.phone || '',
    email: row.email || '',
  };
}

export function serializeSchool(row) {
  return {
    id: row.id,
    name: row.name,
    district: row.district,
    level: row.level,
    students: Number(row.students),
    teachers: Number(row.teachers),
  };
}

export function serializeClassRecord(row) {
  return {
    id: row.id,
    name: row.name,
    teacher: row.teacher,
    students: Number(row.students),
    room: row.room || '',
    subjects: Number(row.subjects),
  };
}

export function serializeSubject(row) {
  return {
    id: row.id,
    name: row.name,
    teacher: row.teacher || '',
    classes: parseList(row.classes),
  };
}

export function serializeLesson(row) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    class: row.class,
    date: String(row.date || '').slice(0, 10),
    status: row.status,
  };
}

export function serializeAssignment(row) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    class: row.class,
    due: String(row.due_date || '').slice(0, 10),
    submitted: Number(row.submitted),
    total: Number(row.total),
  };
}

export function serializeResult(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    subject: row.subject,
    term: row.term,
    academicYear: row.academic_year || '',
    marks: Number(row.marks),
  };
}

export function serializeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    stock: Number(row.stock),
    unitPrice: Number(row.unit_price),
    lowStockAlert: Number(row.low_stock_alert ?? 8),
    description: row.description || '',
    supplierId: row.supplier_id || null,
    supplierName: row.supplier_name || '',
    expiryDate: isoDate(row.expiry_date),
    status:
      row.status ||
      stockStatus(Number(row.stock), Number(row.low_stock_alert ?? 8)),
  };
}

export function serializeSale(row) {
  return {
    id: row.id,
    product: row.product,
    quantity: Number(row.quantity),
    amount: Number(row.amount),
    date: isoDate(row.date) || isoDate(row.created_at),
    customer: row.customer || '',
    paymentMethod: row.payment_method || 'cash',
    createdAt: row.created_at,
  };
}

export function serializeLoan(row) {
  return {
    id: row.id,
    type: row.type || 'loan',
    counterparty: row.counterparty || '',
    amount: Number(row.amount),
    date: isoDate(row.date) || isoDate(row.created_at),
    interestRate: Number(row.interest_rate ?? 0),
    dueDate: isoDate(row.due_date),
    notes: row.notes || row.purpose || '',
    status: row.status,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export function serializeNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: Boolean(row.read),
    date: isoDate(row.date),
    channel: row.channel,
  };
}

export function serializeAudit(row) {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    resource: row.resource,
    resourceId: row.resource_id,
    detail:
      row.detail == null
        ? ''
        : typeof row.detail === 'string'
          ? row.detail
          : JSON.stringify(row.detail),
    ip: row.ip || '',
    createdAt: row.created_at,
  };
}

export function stockStatus(stock, lowStockAlert = 8) {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= lowStockAlert) return 'low-stock';
  return 'in-stock';
}
