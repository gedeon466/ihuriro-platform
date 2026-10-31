type Row = Record<string, any>;

const text = (value: unknown): string => (value == null ? '' : String(value));
const num = (value: unknown): number => Number(value ?? 0);
const dateOnly = (value: unknown): string => text(value).slice(0, 10);

export function mapUser(row: Row) {
  return {
    id: text(row.id),
    name: text(row.name),
    email: text(row.email),
    phone: row.phone == null ? '' : text(row.phone),
    role: text(row.role),
    status: text(row.status),
    language: text(row.language) || 'en',
    createdAt: text(row.created_at),
  };
}

export function mapSessionUser(row: Row) {
  const { status, createdAt, ...user } = mapUser(row);
  void status;
  void createdAt;
  return user;
}

export function mapComplaint(row: Row) {
  return {
    id: text(row.id),
    title: text(row.title),
    category: text(row.category),
    status: text(row.status),
    date: dateOnly(row.created_at),
    description: text(row.description),
    location: text(row.location),
  };
}

export function mapAnnouncement(row: Row) {
  return {
    id: text(row.id),
    title: text(row.title),
    date: text(row.date),
    category: text(row.category),
    content: text(row.content),
  };
}

export function mapNotification(row: Row) {
  return {
    id: text(row.id),
    type: text(row.type),
    title: text(row.title),
    message: text(row.message),
    read: num(row.read) === 1,
    date: text(row.date),
    channel: text(row.channel),
  };
}

export function mapStudent(row: Row) {
  return {
    id: text(row.id),
    name: text(row.name),
    class: text(row.class_name),
    attendance: num(row.attendance),
    performance: num(row.performance),
    status: text(row.status),
    dateOfBirth: row.date_of_birth == null ? '' : text(row.date_of_birth),
    gender: row.gender == null ? '' : text(row.gender),
    parentName: row.parent_name == null ? '' : text(row.parent_name),
    parentPhone: row.parent_phone == null ? '' : text(row.parent_phone),
    academicYear: row.academic_year == null ? '' : text(row.academic_year),
  };
}

function parseList(value: unknown): string[] {
  try {
    const parsed = JSON.parse(text(value) || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return text(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function mapTeacher(row: Row) {
  return {
    id: text(row.id),
    name: text(row.name),
    subjects: parseList(row.subjects),
    classes: parseList(row.classes),
    students: num(row.students),
    phone: row.phone == null ? '' : text(row.phone),
    email: row.email == null ? '' : text(row.email),
  };
}

export function mapProduct(row: Row) {
  const stock = num(row.stock);
  const lowStockAlert = num(row.low_stock_alert);
  const status = stock <= 0 ? 'out-of-stock' : stock < lowStockAlert ? 'low-stock' : 'in-stock';

  return {
    id: text(row.id),
    name: text(row.name),
    category: text(row.category),
    stock,
    unitPrice: num(row.unit_price),
    lowStockAlert,
    description: row.description == null ? '' : text(row.description),
    status,
  };
}

export function mapSale(row: Row) {
  const quantity = num(row.quantity);
  const unitPrice = num(row.unit_price);

  return {
    id: text(row.id),
    product: text(row.product_name),
    quantity,
    unitPrice,
    amount: Math.round(quantity * unitPrice),
    customer: row.customer == null ? '' : text(row.customer),
    paymentMethod: text(row.payment_method),
    date: text(row.date),
  };
}

export function mapLoan(row: Row) {
  return {
    id: text(row.id),
    type: text(row.record_type),
    counterparty: text(row.counterparty),
    amount: num(row.amount),
    date: text(row.date),
    interestRate: num(row.interest_rate),
    dueDate: row.due_date == null ? '' : text(row.due_date),
    notes: row.notes == null ? '' : text(row.notes),
  };
}
