const BASE = process.env.API_URL || 'http://localhost:4000';

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
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

console.log(`IHURIRO API smoke test — ${BASE}\n`);

const health = await api('/api/health');
check('health returns ok', health.status === 200 && health.data?.status === 'ok');
check('database has seeded users', Number(health.data?.users) >= 7, `users=${health.data?.users}`);

const citizenToken = await login('citizen@ihuriro.rw');
check('citizen login returns a token', Boolean(citizenToken));
check('login rejects a wrong password', (await api('/api/auth/login', { method: 'POST', body: { email: 'citizen@ihuriro.rw', password: 'nope-nope' } })).status === 401);
check('protected route rejects anonymous access', (await api('/api/complaints')).status === 401);

const me = await api('/api/auth/me', { token: citizenToken });
check('session restore returns the citizen profile', me.status === 200 && me.data?.user?.email === 'citizen@ihuriro.rw');
check('citizen cannot open admin API', (await api('/api/admin/summary', { token: citizenToken })).status === 403);

const dashboard = await api('/api/dashboard/summary', { token: citizenToken });
check('dashboard summary loads', dashboard.status === 200 && dashboard.data?.platform?.users >= 7);

const complaints = await api('/api/complaints', { token: citizenToken });
check('complaints list loads', complaints.status === 200 && Array.isArray(complaints.data?.complaints));
check('citizen only sees own complaints', complaints.data?.complaints?.every((row) => row.userId === me.data.user.id));

const created = await api('/api/complaints', {
  method: 'POST',
  token: citizenToken,
  body: {
    title: 'Smoke test: broken street sign',
    category: 'Infrastructure',
    description: 'Automated verification record. This complaint is created and withdrawn by the smoke test.',
    location: 'Test cell, Kigali',
  },
});
check('citizen can file a complaint', created.status === 201 && created.data?.complaint?.status === 'pending');

const summaryAfter = await api('/api/complaints/summary', { token: citizenToken });
check('complaint summary includes the new record', summaryAfter.data?.summary?.total >= 4);

if (created.data?.complaint?.id) {
  const withdrawal = await api(`/api/complaints/${created.data.complaint.id}`, {
    method: 'DELETE',
    token: citizenToken,
  });
  check('citizen can withdraw a pending complaint', withdrawal.status === 200);
}

const notifications = await api('/api/notifications', { token: citizenToken });
check('notifications load from the database', notifications.status === 200 && notifications.data?.notifications?.length > 0);
const unread = notifications.data?.notifications?.find((row) => !row.read);
if (unread) {
  const markRead = await api(`/api/notifications/${unread.id}/read`, { method: 'PATCH', token: citizenToken });
  check('notification can be marked read', markRead.status === 200 && markRead.data?.notification?.read === true);
}

const announcements = await api('/api/announcements');
check('public announcements load', announcements.status === 200 && announcements.data?.announcements?.length >= 5);

const education = await api('/api/education/summary', { token: citizenToken });
check('education summary loads', education.status === 200 && education.data?.summary?.students === 8);

const citizenProductAttempt = await api('/api/business/products', {
  method: 'POST',
  token: citizenToken,
  body: { name: 'Blocked product', category: 'Test', stock: 1, unitPrice: 1 },
});
check('citizen cannot modify inventory', citizenProductAttempt.status === 403);

const businessToken = await login('business@ihuriro.rw');
const products = await api('/api/business/products', { token: businessToken });
check('products load for a business account', products.status === 200 && products.data?.products?.length === 8);

const newProduct = await api('/api/business/products', {
  method: 'POST',
  token: businessToken,
  body: { name: 'Smoke Test Item', category: 'Test', stock: 10, unitPrice: 500 },
});
check('business can add a product', newProduct.status === 201 && newProduct.data?.product?.status === 'in-stock');

if (newProduct.data?.product?.id) {
  const updated = await api(`/api/business/products/${newProduct.data.product.id}`, {
    method: 'PATCH',
    token: businessToken,
    body: { stock: 2 },
  });
  check('low stock status is derived on update', updated.data?.product?.status === 'low-stock');

  const sale = await api('/api/business/sales', {
    method: 'POST',
    token: businessToken,
    body: { product: 'Smoke Test Item', quantity: 3, customer: 'Smoke test' },
  });
  check('sale uses the product price', sale.status === 201 && sale.data?.sale?.amount === 1500);

  const removed = await api(`/api/business/products/${newProduct.data.product.id}`, {
    method: 'DELETE',
    token: businessToken,
  });
  check('business can remove a product', removed.status === 200);
}

const businessSummary = await api('/api/business/summary', { token: businessToken });
check('business summary aggregates sales', businessSummary.status === 200 && businessSummary.data?.summary?.revenue > 0);

const adminToken = await login('admin@ihuriro.rw');
const adminSummary = await api('/api/admin/summary', { token: adminToken });
check('admin summary loads', adminSummary.status === 200 && adminSummary.data?.summary?.users >= 7);
check('admin can read audit logs', (await api('/api/admin/audit-logs', { token: adminToken })).data?.total > 0);

const ai = await api('/api/ai/chat', {
  method: 'POST',
  token: citizenToken,
  body: { message: 'How do I report a damaged road?', module: 'citizenconnect' },
});
check('assistant answers with a source label', ai.status === 200 && typeof ai.data?.reply === 'string' && Boolean(ai.data?.source));

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);
