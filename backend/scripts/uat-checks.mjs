const BASE = process.env.API_URL || 'http://localhost:4000';

let passed = 0;
const failed = [];
const notes = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function login(email, password = 'Ihuriro@2026') {
  const result = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  return result.data?.token;
}

console.log(`IHURIRO UAT API checks — ${BASE}\n`);

const citizen = await login('citizen@ihuriro.rw');
const parent = await login('parent@ihuriro.rw');
const teacher = await login('teacher@ihuriro.rw');
const business = await login('business@ihuriro.rw');
const government = await login('government@ihuriro.rw');
const admin = await login('admin@ihuriro.rw');

// --- Cross-module read access ---
const quizzes = await api('/api/quizzes', { token: citizen });
check('Learn Rwanda / Education quizzes load', quizzes.status === 200 && Array.isArray(quizzes.data?.quizzes));

const health = await api('/api/health/topics', { token: citizen });
check('ParentCare health topics load', health.status === 200 && Array.isArray(health.data?.topics) && health.data.topics.length >= 5);

const govServices = await api('/api/government-services', { token: citizen });
check('CitizenConnect government services load', govServices.status === 200 && govServices.data?.services?.length > 0);

// --- Role-based restrictions ---
const citizenQuizCreate = await api('/api/quizzes', {
  method: 'POST',
  token: citizen,
  body: { title: 'UAT forbidden quiz', questions: [{ question: 'Q?', options: ['a', 'b'], answer: 0 }] },
});
check('citizen cannot create a quiz', citizenQuizCreate.status === 403);

const citizenHealthCreate = await api('/api/health/topics', {
  method: 'POST',
  token: citizen,
  body: { title: 'UAT forbidden topic', category: 'Test', excerpt: 'Should be rejected by role guard.' },
});
check('citizen cannot publish a health topic', citizenHealthCreate.status === 403);

const parentAnnounce = await api('/api/announcements', {
  method: 'POST',
  token: parent,
  body: { title: 'UAT parent announcement', date: '2026-10-30', category: 'Test', content: 'Should be rejected.' },
});
check('parent cannot publish announcements', parentAnnounce.status === 403);

// --- Teacher flows ---
const teacherQuiz = await api('/api/quizzes', {
  method: 'POST',
  token: teacher,
  body: {
    title: 'UAT teacher quiz',
    category: 'UAT',
    questions: [{ question: 'Is this a test question?', options: ['Yes', 'No'], answer: 0 }],
  },
});
check('teacher can create a quiz', teacherQuiz.status === 201 && Boolean(teacherQuiz.data?.quiz?.id));

const teacherHealth = await api('/api/health/topics', {
  method: 'POST',
  token: teacher,
  body: { title: 'UAT teacher topic', category: 'Test', excerpt: 'Teachers must not publish health content.' },
});
check('teacher cannot publish a health topic', teacherHealth.status === 403);

const teacherLesson = await api('/api/education/lessons', {
  method: 'POST',
  token: teacher,
  body: { title: 'UAT lesson', subject: 'Mathematics', class: 'P6A', date: '2026-10-31', status: 'scheduled' },
});
check('teacher can create a lesson', teacherLesson.status === 201);

const teacherStudent = await api('/api/education/students', {
  method: 'POST',
  token: teacher,
  body: { name: 'UAT Teacher Student', class: 'P6A', academicYear: '2026' },
});
check('teacher can create a student', teacherStudent.status === 201);

// --- Permission gap under test ---
const citizenStudent = await api('/api/education/students', {
  method: 'POST',
  token: citizen,
  body: { name: 'UAT Citizen Created Student', class: 'P6A', academicYear: '2026' },
});
check('citizen cannot create a student (expected role guard)', citizenStudent.status === 403, `got ${citizenStudent.status}`);

// --- Business flows ---
const product = await api('/api/business/products', {
  method: 'POST',
  token: business,
  body: { name: 'UAT API Product', category: 'UAT', stock: 10, unitPrice: 500 },
});
check('business can create a product', product.status === 201);
const productId = product.data?.product?.id;

if (productId) {
  const out = await api('/api/business/stock-movements', {
    method: 'POST',
    token: business,
    body: { product: 'UAT API Product', type: 'out', quantity: 3, note: 'UAT stock out' },
  });
  check('business can record stock out and stock drops', out.status === 201 && Number(out.data?.product?.stock) === 7, `stock=${out.data?.product?.stock}`);

  const sale = await api('/api/business/sales', {
    method: 'POST',
    token: business,
    body: { product: 'UAT API Product', quantity: 2, customer: 'UAT customer', paymentMethod: 'cash' },
  });
  check('business can record a sale priced from stock', sale.status === 201 && sale.data?.sale?.amount === 1000, `amount=${sale.data?.sale?.amount}`);

  const loan = await api('/api/business/loans', {
    method: 'POST',
    token: business,
    body: { type: 'loan', counterparty: 'UAT lender', amount: 2000, dueDate: '2026-12-31' },
  });
  check('business can record a loan', loan.status === 201);

  const summary = await api('/api/business/summary', { token: business });
  check('business dashboard aggregates sales', summary.status === 200 && summary.data?.summary?.revenue > 0);
}

// --- Government complaint workflow ---
const allComplaints = await api('/api/complaints', { token: government });
check('government can list all complaints', allComplaints.status === 200 && Array.isArray(allComplaints.data?.complaints));
const uatComplaint = allComplaints.data?.complaints?.find((row) => row.title.startsWith('UAT:'));
if (uatComplaint) {
  const moved = await api(`/api/complaints/${uatComplaint.id}`, {
    method: 'PATCH',
    token: government,
    body: { status: 'in-review' },
  });
  check('government can move a complaint to in-review', moved.status === 200 && moved.data?.complaint?.status === 'in-review');

  const back = await api(`/api/complaints/${uatComplaint.id}`, {
    method: 'PATCH',
    token: government,
    body: { status: 'pending' },
  });
  check('government can move a complaint back to pending', back.status === 200 && back.data?.complaint?.status === 'pending');

  const govAnnounce = await api('/api/announcements', {
    method: 'POST',
    token: government,
    body: { title: 'UAT government announcement', date: '2026-10-30', category: 'UAT', content: 'Temporary UAT record.' },
  });
  check('government can publish an announcement', govAnnounce.status === 201);
  notes.push(`announcement:${govAnnounce.data?.announcement?.id}`);
}

// --- Parent linked-student visibility ---
const parentStudents = await api('/api/education/students', { token: parent });
check('parent can view student records', parentStudents.status === 200 && Array.isArray(parentStudents.data?.students));
const parentNotifs = await api('/api/notifications', { token: parent });
check('parent notifications load', parentNotifs.status === 200);

// --- Admin flows ---
const created = await api('/api/admin/users', {
  method: 'POST',
  token: admin,
  body: { name: 'UAT Admin Created', email: `uat.admin.${Date.now()}@ihuriro.rw`, password: 'UatAdmin@2026', role: 'teacher' },
});
check('admin can create a user', created.status === 201 && created.data?.user?.role === 'teacher');
if (created.data?.user?.id) {
  const suspended = await api(`/api/admin/users/${created.data.user.id}`, {
    method: 'PATCH',
    token: admin,
    body: { status: 'suspended' },
  });
  check('admin can suspend a user', suspended.status === 200 && suspended.data?.user?.status === 'suspended');
  notes.push(`adminUser:${created.data.user.id}`);
}

const audit = await api('/api/admin/audit-logs', { token: admin });
check('audit log captures UAT actions', audit.status === 200 && audit.data?.total > 0);

// --- Profile self-service ---
const me = await api('/api/auth/me', { token: citizen });
const originalPhone = me.data?.user?.phone ?? '';
const patched = await api('/api/auth/profile', { method: 'PATCH', token: citizen, body: { phone: '+250 788 999 111' } });
check('citizen can update own profile', patched.status === 200 && patched.data?.user?.phone === '+250 788 999 111');
const reverted = await api('/api/auth/profile', { method: 'PATCH', token: citizen, body: { phone: originalPhone } });
check('profile change can be reverted', reverted.status === 200 && reverted.data?.user?.phone === originalPhone);

const badPassword = await api('/api/auth/password', {
  method: 'POST',
  token: citizen,
  body: { currentPassword: 'definitely-wrong', newPassword: 'Another@2026' },
});
check('password change rejects a wrong current password', badPassword.status === 400 || badPassword.status === 401, `got ${badPassword.status}`);

const markAll = await api('/api/notifications/read-all', { method: 'POST', token: parent });
check('notifications can be marked all read', markAll.status === 200);

console.log(`\n${passed} passed, ${failed.length} failed.`);
if (failed.length) console.log(`Failed:\n- ${failed.join('\n- ')}`);
if (notes.length) console.log(`\nCleanup markers:\n- ${notes.join('\n- ')}`);
