import { pathToFileURL } from 'node:url';
import { execute, newId, nowIso, query, queryOne } from './db.js';
import { prepareDatabase } from './schema.js';
import { createAuthAccount, setPassword } from './auth-service.js';
import { healthTopics, quizzes } from './data/content.js';
import { governmentServices } from './data/services.js';

const DEMO_PASSWORD = 'Ihuriro@2026';

const users = [
  { name: 'IHURIRO Administrator', email: 'admin@ihuriro.rw', role: 'admin', phone: '+250 788 000 001', language: 'en' },
  { name: 'Jean Bosco Niyonzima', email: 'citizen@ihuriro.rw', role: 'citizen', phone: '+250 788 000 002', language: 'en' },
  { name: 'Claudine Uwimana', email: 'parent@ihuriro.rw', role: 'parent', phone: '+250 788 000 003', language: 'rw' },
  { name: 'Jean Munyakazi', email: 'teacher@ihuriro.rw', role: 'teacher', phone: '+250 788 000 004', language: 'en' },
  { name: 'Eric Habimana', email: 'business@ihuriro.rw', role: 'business', phone: '+250 788 000 005', language: 'en' },
  { name: 'Dr. Alice Mukamana', email: 'health@ihuriro.rw', role: 'health', phone: '+250 788 000 006', language: 'en' },
  { name: 'Patrick Ndagijimana', email: 'government@ihuriro.rw', role: 'government', phone: '+250 788 000 007', language: 'fr' },
];

const complaints = [
  {
    user: 'citizen@ihuriro.rw',
    title: 'Damaged road in our neighborhood',
    category: 'Infrastructure',
    status: 'in-review',
    date: '2026-10-03',
    description: 'The road leading to Kimisagara market has large potholes making it dangerous for motorcyclists and pedestrians.',
    location: 'Kimisagara, Nyarugenge',
  },
  {
    user: 'parent@ihuriro.rw',
    title: 'No water supply for 3 days',
    category: 'Utilities',
    status: 'resolved',
    date: '2026-09-28',
    description: 'Our area has had no running water for three consecutive days. This is affecting daily life significantly.',
    location: 'Gikondo, Kicukiro',
  },
  {
    user: 'citizen@ihuriro.rw',
    title: 'Street lights not working',
    category: 'Security',
    status: 'pending',
    date: '2026-10-06',
    description: 'Several street lights on our road have not been working for over a week, creating safety concerns at night.',
    location: 'Remera, Gasabo',
  },
  {
    user: 'citizen@ihuriro.rw',
    title: 'Request for new bus route',
    category: 'Transport',
    status: 'pending',
    date: '2026-10-07',
    description: 'Our neighborhood has no direct bus route to the city center, making commuting very difficult for residents.',
    location: 'Bumbogo, Gasabo',
  },
];

const notifications = [
  { user: 'citizen@ihuriro.rw', type: 'government', title: 'Community Development Meeting', message: 'A community meeting will be held on October 15 at the sector office to discuss local development projects.', read: 0, date: '2026-10-07', channel: 'sms' },
  { user: 'parent@ihuriro.rw', type: 'school', title: 'Your child was absent today', message: 'Muhire Kevin (P6A) was absent from school today. Please contact the school if this is unexpected.', read: 0, date: '2026-10-08', channel: 'sms' },
  { user: 'parent@ihuriro.rw', type: 'health', title: 'Vaccination Reminder', message: 'Your child is due for the next vaccination this week. Please visit your nearest health center.', read: 0, date: '2026-10-06', channel: 'email' },
  { user: 'business@ihuriro.rw', type: 'business', title: 'Low Stock Alert: Rice', message: 'Your stock of Rice (5kg) has dropped below the minimum level. Current stock: 3 units.', read: 1, date: '2026-10-05', channel: 'system' },
  { user: 'citizen@ihuriro.rw', type: 'system', title: 'Welcome to IHURIRO Rwanda', message: 'Your account has been successfully created. Explore all the services available to you!', read: 1, date: '2026-10-01', channel: 'system' },
  { user: 'citizen@ihuriro.rw', type: 'government', title: 'New Public Announcement', message: 'The sector office announces new operating hours starting October 10: Monday-Friday, 8AM-5PM.', read: 1, date: '2026-10-04', channel: 'email' },
  { user: 'parent@ihuriro.rw', type: 'school', title: 'Parent-Teacher Meeting', message: 'A parent-teacher meeting is scheduled for October 20 at 2PM in the main hall.', read: 0, date: '2026-10-07', channel: 'sms' },
  { user: 'parent@ihuriro.rw', type: 'health', title: 'Pregnancy Check-up Due', message: 'Your next prenatal check-up is scheduled for October 12. Please confirm your appointment.', read: 0, date: '2026-10-08', channel: 'sms' },
];

const students = [
  { name: 'Muhire Kevin', class: 'P6A', attendance: 92, performance: 85, status: 'active' },
  { name: 'Uwase Diane', class: 'P6A', attendance: 88, performance: 91, status: 'active' },
  { name: 'Habimana Eric', class: 'S3B', attendance: 64, performance: 58, status: 'at-risk' },
  { name: 'Ingabire Alice', class: 'S1A', attendance: 95, performance: 89, status: 'active' },
  { name: 'Nshimiyimana Joseph', class: 'S3B', attendance: 45, performance: 42, status: 'at-risk' },
  { name: 'Mukamana Grace', class: 'P5A', attendance: 97, performance: 93, status: 'active' },
  { name: 'Twizeyimana Paul', class: 'S2C', attendance: 72, performance: 65, status: 'active' },
  { name: 'Iradukunda Luck', class: 'P4B', attendance: 38, performance: 35, status: 'dropped' },
];

const teachers = [
  { name: 'Mr. Munyakazi Jean', subjects: ['Mathematics', 'Science'], classes: ['P6A', 'P6B'], students: 84 },
  { name: 'Mrs. Umutoni Claire', subjects: ['English', 'Kinyarwanda'], classes: ['S1A', 'S2A'], students: 76 },
  { name: 'Mr. Ndagijimana Patrick', subjects: ['History', 'Geography'], classes: ['S3B'], students: 42 },
  { name: 'Mrs. Mukamana Alice', subjects: ['Biology', 'Chemistry'], classes: ['S2C', 'S3B'], students: 58 },
];

const schools = [
  { name: 'GS Saint Patrick', district: 'Gasabo', level: 'Primary & Secondary', students: 842, teachers: 38 },
  { name: 'APE Rugunga', district: 'Nyarugenge', level: 'Primary', students: 620, teachers: 28 },
  { name: 'GS Muhima', district: 'Nyarugenge', level: 'Primary & Secondary', students: 1100, teachers: 52 },
  { name: 'GS Kicukiro', district: 'Kicukiro', level: 'Secondary', students: 930, teachers: 41 },
];

const classes = [
  { name: 'P6A', teacher: 'Mr. Habimana', students: 32, room: 'Room 12', subjects: 8 },
  { name: 'S3B', teacher: 'Ms. Uwase', students: 28, room: 'Room 25', subjects: 10 },
  { name: 'S1A', teacher: 'Mr. Nshuti', students: 35, room: 'Room 18', subjects: 9 },
  { name: 'P5A', teacher: 'Ms. Ingabire', students: 30, room: 'Room 8', subjects: 7 },
  { name: 'S2C', teacher: 'Mr. Tuyishime', students: 27, room: 'Room 22', subjects: 9 },
  { name: 'P4B', teacher: 'Ms. Mukamana', students: 33, room: 'Room 5', subjects: 7 },
];

const subjects = [
  { name: 'Mathematics', teacher: 'Mr. Habimana', classes: ['P6A', 'S3B', 'S1A'] },
  { name: 'Science', teacher: 'Ms. Uwase', classes: ['P6A', 'P5A', 'S2C'] },
  { name: 'English', teacher: 'Mr. Nshuti', classes: ['P6A', 'S3B', 'S1A', 'P5A'] },
  { name: 'Kinyarwanda', teacher: 'Ms. Ingabire', classes: ['P6A', 'P4B', 'P5A'] },
  { name: 'Social Studies', teacher: 'Mr. Tuyishime', classes: ['P5A', 'P4B'] },
  { name: 'ICT', teacher: 'Ms. Mukamana', classes: ['S3B', 'S1A', 'S2C'] },
];

const lessons = [
  { title: 'Introduction to Fractions', subject: 'Mathematics', class: 'P6A', date: '2026-10-09', status: 'scheduled' },
  { title: 'The Water Cycle', subject: 'Science', class: 'P5A', date: '2026-10-09', status: 'scheduled' },
  { title: 'Reading Comprehension: Rwandan Folktales', subject: 'English', class: 'S1A', date: '2026-10-08', status: 'completed' },
  { title: 'Pre-Colonial Kingdoms', subject: 'Social Studies', class: 'P5A', date: '2026-10-08', status: 'completed' },
  { title: 'Basic Programming Concepts', subject: 'ICT', class: 'S3B', date: '2026-10-07', status: 'completed' },
];

const assignments = [
  { title: 'Math Worksheet: Fractions', subject: 'Mathematics', class: 'P6A', due: '2026-10-12', submitted: 24, total: 32 },
  { title: 'Essay: My Community', subject: 'English', class: 'S1A', due: '2026-10-14', submitted: 18, total: 35 },
  { title: 'Science Lab Report', subject: 'Science', class: 'P5A', due: '2026-10-11', submitted: 28, total: 30 },
  { title: 'History Research: Rwandan Kings', subject: 'Social Studies', class: 'P5A', due: '2026-10-16', submitted: 5, total: 30 },
];

const products = [
  { name: 'Rice 5kg', category: 'Food', stock: 3, unitPrice: 4500 },
  { name: 'Sugar 1kg', category: 'Food', stock: 45, unitPrice: 1200 },
  { name: 'Cooking Oil 1L', category: 'Food', stock: 0, unitPrice: 2400 },
  { name: 'Soap Bar', category: 'Household', stock: 120, unitPrice: 300 },
  { name: 'Maize Flour 5kg', category: 'Food', stock: 8, unitPrice: 3200 },
  { name: 'Bread Loaf', category: 'Bakery', stock: 35, unitPrice: 800 },
  { name: 'Milk 1L', category: 'Dairy', stock: 5, unitPrice: 700 },
  { name: 'Salt 1kg', category: 'Food', stock: 60, unitPrice: 500 },
];

const sales = [
  { product: 'Rice 5kg', quantity: 12, amount: 54000, date: '2026-10-07', customer: 'Jean Bosco' },
  { product: 'Sugar 1kg', quantity: 25, amount: 30000, date: '2026-10-07', customer: 'Mukamana' },
  { product: 'Cooking Oil 1L', quantity: 8, amount: 19200, date: '2026-10-06', customer: 'Kevin M.' },
  { product: 'Bread Loaf', quantity: 40, amount: 32000, date: '2026-10-06', customer: 'Walk-in Customer' },
  { product: 'Maize Flour 5kg', quantity: 6, amount: 19200, date: '2026-10-05', customer: 'Alice I.' },
  { product: 'Rice 5kg', quantity: 15, amount: 67500, date: '2026-10-05', customer: 'Habimana' },
  { product: 'Milk 1L', quantity: 20, amount: 14000, date: '2026-10-04', customer: 'Walk-in Customer' },
  { product: 'Soap Bar', quantity: 30, amount: 9000, date: '2026-10-04', customer: 'Uwase D.' },
];

const loans = [
  {
    type: 'loan',
    counterparty: 'Bank of Kigali',
    amount: 1500000,
    date: '2026-09-15',
    interestRate: 12,
    dueDate: '2027-03-15',
    notes: 'Working capital loan for stock purchase.',
    status: 'submitted',
  },
  {
    type: 'debt',
    counterparty: 'Kigali Wholesalers Ltd',
    amount: 240000,
    date: '2026-10-01',
    interestRate: 0,
    dueDate: '2026-11-01',
    notes: 'Unpaid balance for the October rice delivery.',
    status: 'approved',
  },
];

const announcements = [
  { title: 'Community Development Meeting', date: '2026-10-15', category: 'Government', content: 'A community meeting will be held at the sector office to discuss local development projects. All residents are encouraged to attend.' },
  { title: 'National Vaccination Week', date: '2026-10-10', category: 'Health', content: 'The Ministry of Health announces a national vaccination week from October 10-17. Visit your nearest health center for free immunizations.' },
  { title: 'School Parent-Teacher Conference', date: '2026-10-20', category: 'Education', content: 'Parent-teacher conferences will be held on October 20 from 2PM to 5PM. Please confirm your attendance with the school office.' },
  { title: 'New Business Registration Support', date: '2026-10-12', category: 'Business', content: 'The RDB is offering free business registration support at all sector offices during October. Bring your ID and business plan.' },
  { title: 'Umuganda Community Work Day', date: '2026-10-26', category: 'Government', content: 'The next Umuganda community work day is Saturday, October 26. Meet at your local cell office at 8AM.' },
];

const ideas = [
  { user: 'citizen@ihuriro.rw', title: 'Solar lights for the bus stop', description: 'Install solar-powered lighting at the Kimisagara bus stop so passengers are safer while waiting in the evening.', category: 'Infrastructure' },
  { user: 'citizen@ihuriro.rw', title: 'Monthly waste collection calendar', description: 'Publish the waste collection schedule for each cell so households know when to put out their bins.', category: 'Environment' },
];

function stockStatus(stock, lowStockAlert = 8) {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= lowStockAlert) return 'low-stock';
  return 'in-stock';
}

async function countRows(table) {
  const row = await queryOne(`SELECT COUNT(*) AS count FROM \`${table}\``);
  return Number(row.count);
}

async function insertRows(table, columns, rows) {
  if (rows.length === 0) return;
  const columnList = columns.map((column) => `\`${column}\``).join(', ');
  const placeholders = `(${columns.map(() => '?').join(', ')})`;
  for (const row of rows) {
    await execute(`INSERT INTO ${table} (${columnList}) VALUES ${placeholders}`, row);
  }
}

async function clearData() {
  const tables = [
    'audit_logs',
    'notifications',
    'ideas',
    'complaints',
    'loan_records',
    'stock_movements',
    'sales',
    'products',
    'results',
    'assignments',
    'lessons',
    'subjects',
    'classes',
    'schools',
    'teachers',
    'students',
    'announcements',
    'health_topics',
    'quizzes',
    'government_services',
  ];
  for (const table of tables) {
    await execute(`DELETE FROM \`${table}\``);
  }
}

export async function runSeed({ reset = false } = {}) {
  await prepareDatabase();
  if (reset) await clearData();

  const ids = new Map();
  for (const user of users) {
    const { profile } = await createAuthAccount(
      {
        name: user.name,
        email: user.email,
        password: DEMO_PASSWORD,
        phone: user.phone,
        role: user.role,
        language: user.language,
        status: 'active',
      },
      { allowExisting: true }
    );
    await setPassword(profile.id, DEMO_PASSWORD);
    ids.set(user.email, profile.id);
  }

  const timestamp = nowIso();

  if ((await countRows('complaints')) === 0) {
    await insertRows(
      'complaints',
      ['id', 'user_id', 'title', 'category', 'description', 'location', 'status', 'created_at', 'updated_at'],
      complaints.map((complaint) => {
        const createdAt = `${complaint.date}T09:00:00.000Z`;
        return [
          newId('cmp'),
          ids.get(complaint.user),
          complaint.title,
          complaint.category,
          complaint.description,
          complaint.location,
          complaint.status,
          createdAt,
          createdAt,
        ];
      })
    );
  }

  if ((await countRows('ideas')) === 0) {
    await insertRows(
      'ideas',
      ['id', 'user_id', 'title', 'description', 'category', 'status', 'created_at'],
      ideas.map((idea) => [
        newId('idea'),
        ids.get(idea.user),
        idea.title,
        idea.description,
        idea.category,
        'submitted',
        timestamp,
      ])
    );
  }

  if ((await countRows('notifications')) === 0) {
    await insertRows(
      'notifications',
      ['id', 'user_id', 'type', 'title', 'message', 'read', 'date', 'channel', 'created_at'],
      notifications.map((notification) => [
        newId('ntf'),
        ids.get(notification.user),
        notification.type,
        notification.title,
        notification.message,
        notification.read,
        notification.date,
        notification.channel,
        `${notification.date}T08:00:00.000Z`,
      ])
    );
  }

  if ((await countRows('students')) === 0) {
    await insertRows(
      'students',
      ['id', 'name', 'class', 'attendance', 'performance', 'status', 'created_at', 'updated_at'],
      students.map((student) => [
        newId('std'),
        student.name,
        student.class,
        student.attendance,
        student.performance,
        student.status,
        timestamp,
        timestamp,
      ])
    );
  }

  if ((await countRows('teachers')) === 0) {
    await insertRows(
      'teachers',
      ['id', 'name', 'subjects', 'classes', 'students', 'created_at'],
      teachers.map((teacher) => [
        newId('tch'),
        teacher.name,
        JSON.stringify(teacher.subjects),
        JSON.stringify(teacher.classes),
        teacher.students,
        timestamp,
      ])
    );
  }

  if ((await countRows('schools')) === 0) {
    await insertRows(
      'schools',
      ['id', 'name', 'district', 'level', 'students', 'teachers', 'created_at'],
      schools.map((school) => [
        newId('sch'),
        school.name,
        school.district,
        school.level,
        school.students,
        school.teachers,
        timestamp,
      ])
    );
  }

  if ((await countRows('classes')) === 0) {
    await insertRows(
      'classes',
      ['id', 'name', 'teacher', 'students', 'room', 'subjects', 'created_at'],
      classes.map((entry) => [
        newId('cls'),
        entry.name,
        entry.teacher,
        entry.students,
        entry.room,
        entry.subjects,
        timestamp,
      ])
    );
  }

  if ((await countRows('subjects')) === 0) {
    await insertRows(
      'subjects',
      ['id', 'name', 'teacher', 'classes', 'created_at'],
      subjects.map((subject) => [
        newId('sub'),
        subject.name,
        subject.teacher,
        JSON.stringify(subject.classes),
        timestamp,
      ])
    );
  }

  if ((await countRows('lessons')) === 0) {
    await insertRows(
      'lessons',
      ['id', 'title', 'subject', 'class', 'date', 'status', 'created_at'],
      lessons.map((lesson) => [
        newId('lsn'),
        lesson.title,
        lesson.subject,
        lesson.class,
        lesson.date,
        lesson.status,
        timestamp,
      ])
    );
  }

  if ((await countRows('assignments')) === 0) {
    await insertRows(
      'assignments',
      ['id', 'title', 'subject', 'class', 'due_date', 'submitted', 'total', 'created_at'],
      assignments.map((assignment) => [
        newId('asg'),
        assignment.title,
        assignment.subject,
        assignment.class,
        assignment.due,
        assignment.submitted,
        assignment.total,
        timestamp,
      ])
    );
  }

  if ((await countRows('results')) === 0) {
    const roster = await query('SELECT id, performance FROM students ORDER BY name ASC');
    const subjectsForMarks = [
      ['Mathematics', 3],
      ['English', -2],
      ['Science', 0],
      ['Kinyarwanda', 5],
    ];
    const markRows = [];
    for (const student of roster) {
      const base = Number(student.performance);
      for (const [subject, delta] of subjectsForMarks) {
        const marks = Math.max(0, Math.min(100, Math.round(base + delta)));
        markRows.push([newId('res'), student.id, subject, 'Term 1', '2026', marks, timestamp]);
      }
    }
    await insertRows(
      'results',
      ['id', 'student_id', 'subject', 'term', 'academic_year', 'marks', 'created_at'],
      markRows
    );
  }

  if ((await countRows('products')) === 0) {
    await insertRows(
      'products',
      ['id', 'name', 'category', 'stock', 'unit_price', 'low_stock_alert', 'status', 'created_at', 'updated_at'],
      products.map((product) => [
        newId('prd'),
        product.name,
        product.category,
        product.stock,
        product.unitPrice,
        8,
        stockStatus(product.stock),
        timestamp,
        timestamp,
      ])
    );
  }

  if ((await countRows('sales')) === 0) {
    await insertRows(
      'sales',
      ['id', 'user_id', 'product', 'quantity', 'amount', 'date', 'customer', 'payment_method', 'created_at'],
      sales.map((sale) => [
        newId('sal'),
        ids.get('business@ihuriro.rw'),
        sale.product,
        sale.quantity,
        sale.amount,
        sale.date,
        sale.customer,
        'cash',
        `${sale.date}T12:00:00.000Z`,
      ])
    );
  }

  if ((await countRows('loan_records')) === 0) {
    await insertRows(
      'loan_records',
      ['id', 'user_id', 'type', 'counterparty', 'amount', 'date', 'interest_rate', 'due_date', 'notes', 'status', 'created_at'],
      loans.map((loan) => [
        newId('loan'),
        ids.get('business@ihuriro.rw'),
        loan.type,
        loan.counterparty,
        loan.amount,
        loan.date,
        loan.interestRate,
        loan.dueDate,
        loan.notes,
        loan.status,
        timestamp,
      ])
    );
  }

  if ((await countRows('announcements')) === 0) {
    await insertRows(
      'announcements',
      ['id', 'title', 'date', 'category', 'content', 'created_at'],
      announcements.map((announcement) => [
        newId('ann'),
        announcement.title,
        announcement.date,
        announcement.category,
        announcement.content,
        timestamp,
      ])
    );
  }

  if ((await countRows('health_topics')) === 0) {
    await insertRows(
      'health_topics',
      ['id', 'title', 'category', 'excerpt', 'read_minutes', 'created_at'],
      healthTopics.map((topic) => [
        newId('htp'),
        topic.title,
        topic.category,
        topic.excerpt,
        topic.readMinutes,
        timestamp,
      ])
    );
  }

  if ((await countRows('quizzes')) === 0) {
    await insertRows(
      'quizzes',
      ['id', 'title', 'category', 'questions', 'created_at'],
      quizzes.map((quiz) => [
        newId('qz'),
        quiz.title,
        quiz.category,
        JSON.stringify(quiz.questions),
        timestamp,
      ])
    );
  }

  if ((await countRows('government_services')) === 0) {
    await insertRows(
      'government_services',
      [
        'id',
        'title',
        'category',
        'summary',
        'description',
        'requirements',
        'steps',
        'fee',
        'processing_time',
        'office',
        'contact',
        'created_at',
      ],
      governmentServices.map((service) => [
        newId('gov'),
        service.title,
        service.category,
        service.summary,
        service.description,
        JSON.stringify(service.requirements),
        JSON.stringify(service.steps),
        service.fee,
        service.processingTime,
        service.office,
        service.contact || null,
        timestamp,
      ])
    );
  }

  if ((await countRows('audit_logs')) === 0) {
    await insertRows(
      'audit_logs',
      ['id', 'user_id', 'action', 'resource', 'resource_id', 'detail', 'ip', 'created_at'],
      [
        [
          newId('aud'),
          ids.get('admin@ihuriro.rw'),
          'system.seed',
          'database',
          null,
          JSON.stringify({
            users: users.length,
            students: students.length,
            products: products.length,
            seededAt: timestamp,
          }),
          null,
          timestamp,
        ],
      ]
    );
  }

  return { seeded: true, users: users.length };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const reset = process.argv.includes('--reset');
  try {
    const result = await runSeed({ reset });
    console.log(`Seeded IHURIRO MySQL database with ${result.users} demo accounts.`);
    console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
    console.log('Admin: admin@ihuriro.rw · Citizen: citizen@ihuriro.rw');
  } catch (error) {
    console.error(`[seed] ${error.message}`);
    process.exitCode = 1;
  }
  process.exit(0);
}
