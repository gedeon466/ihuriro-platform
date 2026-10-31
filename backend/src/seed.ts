import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';

export const DEMO_ACCOUNTS = [
  { name: 'Demo Citizen', email: 'demo@ihuriro.rw', password: 'Demo@123', role: 'citizen' },
  { name: 'Gedeon Niyomungeri', email: 'gedeonniyomungeri87@gmail.com', password: 'Admin@123', role: 'admin' },
];

const complaints = [
  { id: 'c1', category: 'Infrastructure', title: 'Damaged road in our neighborhood', description: 'The road leading to Kimisagara market has large potholes making it dangerous for motorcyclists and pedestrians.', location: 'Kimisagara, Nyarugenge', status: 'in-review', created_at: '2026-10-03 08:30:00' },
  { id: 'c2', category: 'Utilities', title: 'No water supply for 3 days', description: 'Our area has had no running water for three consecutive days. This is affecting daily life significantly.', location: 'Gikondo, Kicukiro', status: 'resolved', created_at: '2026-09-28 07:10:00' },
  { id: 'c3', category: 'Security', title: 'Street lights not working', description: 'Several street lights on our road have not been working for over a week, creating safety concerns at night.', location: 'Remera, Gasabo', status: 'pending', created_at: '2026-10-06 18:45:00' },
  { id: 'c4', category: 'Transport', title: 'Request for new bus route', description: 'Our neighborhood has no direct bus route to the city center, making commuting very difficult for residents.', location: 'Bumbogo, Gasabo', status: 'pending', created_at: '2026-10-07 09:00:00' },
];

const announcements = [
  { id: 'a1', title: 'Community Development Meeting', date: '2026-10-15', category: 'Government', content: 'A community meeting will be held at the sector office to discuss local development projects. All residents are encouraged to attend.' },
  { id: 'a2', title: 'National Vaccination Week', date: '2026-10-10', category: 'Health', content: 'The Ministry of Health announces a national vaccination week from October 10-17. Visit your nearest health center for free immunizations.' },
  { id: 'a3', title: 'School Parent-Teacher Conference', date: '2026-10-20', category: 'Education', content: 'Parent-teacher conferences will be held on October 20 from 2PM to 5PM. Please confirm your attendance with the school office.' },
  { id: 'a4', title: 'New Business Registration Support', date: '2026-10-12', category: 'Business', content: 'The RDB is offering free business registration support at all sector offices during October. Bring your ID and business plan.' },
  { id: 'a5', title: 'Umuganda Community Work Day', date: '2026-10-26', category: 'Government', content: 'The next Umuganda community work day is Saturday, October 26. Meet at your local cell office at 8AM.' },
];

const notifications = [
  { id: 'n1', type: 'government', title: 'Community Development Meeting', message: 'A community meeting will be held on October 15 at the sector office to discuss local development projects.', read: 0, date: '2026-10-07', channel: 'sms' },
  { id: 'n2', type: 'school', title: 'Your child was absent today', message: 'Muhire Kevin (P6A) was absent from school today. Please contact the school if this is unexpected.', read: 0, date: '2026-10-08', channel: 'sms' },
  { id: 'n3', type: 'health', title: 'Vaccination Reminder', message: 'Your child is due for the next vaccination this week. Please visit your nearest health center.', read: 0, date: '2026-10-06', channel: 'email' },
  { id: 'n4', type: 'business', title: 'Low Stock Alert: Rice', message: 'Your stock of Rice (5kg) has dropped below the minimum level. Current stock: 3 units.', read: 1, date: '2026-10-05', channel: 'system' },
  { id: 'n5', type: 'system', title: 'Welcome to IHURIRO Rwanda', message: 'Your account has been successfully created. Explore all the services available to you!', read: 1, date: '2026-10-01', channel: 'system' },
  { id: 'n6', type: 'government', title: 'New Public Announcement', message: 'The sector office announces new operating hours starting October 10: Monday-Friday, 8AM-5PM.', read: 1, date: '2026-10-04', channel: 'email' },
  { id: 'n7', type: 'school', title: 'Parent-Teacher Meeting', message: 'A parent-teacher meeting is scheduled for October 20 at 2PM in the main hall.', read: 0, date: '2026-10-07', channel: 'sms' },
  { id: 'n8', type: 'health', title: 'Pregnancy Check-up Due', message: 'Your next prenatal check-up is scheduled for October 12. Please confirm your appointment.', read: 0, date: '2026-10-08', channel: 'sms' },
];

const students = [
  { name: 'Muhire Kevin', class_name: 'P6A', date_of_birth: '2014-04-12', gender: 'male', parent_name: 'Muhire Jean', parent_phone: '+250 788 111 222', academic_year: '2026', attendance: 92, performance: 85, status: 'active' },
  { name: 'Uwase Diane', class_name: 'P6A', date_of_birth: '2014-08-02', gender: 'female', parent_name: 'Uwase Marie', parent_phone: '+250 788 111 223', academic_year: '2026', attendance: 88, performance: 91, status: 'active' },
  { name: 'Habimana Eric', class_name: 'S3B', date_of_birth: '2010-01-25', gender: 'male', parent_name: 'Habimana Paul', parent_phone: '+250 788 111 224', academic_year: '2026', attendance: 64, performance: 58, status: 'at-risk' },
  { name: 'Ingabire Alice', class_name: 'S1A', date_of_birth: '2012-06-17', gender: 'female', parent_name: 'Ingabire Rose', parent_phone: '+250 788 111 225', academic_year: '2026', attendance: 95, performance: 89, status: 'active' },
  { name: 'Nshimiyimana Joseph', class_name: 'S3B', date_of_birth: '2010-03-09', gender: 'male', parent_name: 'Nshimiyimana Jean', parent_phone: '+250 788 111 226', academic_year: '2026', attendance: 45, performance: 42, status: 'at-risk' },
  { name: 'Mukamana Grace', class_name: 'P5A', date_of_birth: '2015-11-30', gender: 'female', parent_name: 'Mukamana Alice', parent_phone: '+250 788 111 227', academic_year: '2026', attendance: 97, performance: 93, status: 'active' },
  { name: 'Twizeyimana Paul', class_name: 'S2C', date_of_birth: '2011-09-14', gender: 'male', parent_name: 'Twizeyimana David', parent_phone: '+250 788 111 228', academic_year: '2026', attendance: 72, performance: 65, status: 'active' },
  { name: 'Iradukunda Luck', class_name: 'P4B', date_of_birth: '2016-02-21', gender: 'female', parent_name: 'Iradukunda Jane', parent_phone: '+250 788 111 229', academic_year: '2026', attendance: 38, performance: 35, status: 'dropped' },
];

const teachers = [
  { name: 'Mr. Munyakazi Jean', subjects: ['Mathematics', 'Science'], classes: ['P6A', 'P6B'], students: 84, phone: '+250 788 222 111', email: 'munyakazi@ihuriro.rw' },
  { name: 'Mrs. Umutoni Claire', subjects: ['English', 'Kinyarwanda'], classes: ['S1A', 'S2A'], students: 76, phone: '+250 788 222 112', email: 'umutoni@ihuriro.rw' },
  { name: 'Mr. Ndagijimana Patrick', subjects: ['History', 'Geography'], classes: ['S3B'], students: 42, phone: '+250 788 222 113', email: 'ndagijimana@ihuriro.rw' },
  { name: 'Mrs. Mukamana Alice', subjects: ['Biology', 'Chemistry'], classes: ['S2C', 'S3B'], students: 58, phone: '+250 788 222 114', email: 'mukamana@ihuriro.rw' },
];

const products = [
  { name: 'Rice 5kg', category: 'Food', stock: 3, unit_price: 4500, low_stock_alert: 10, description: 'Premium long-grain rice, 5kg bag' },
  { name: 'Sugar 1kg', category: 'Food', stock: 45, unit_price: 1200, low_stock_alert: 10, description: 'Refined white sugar, 1kg pack' },
  { name: 'Cooking Oil 1L', category: 'Food', stock: 0, unit_price: 2400, low_stock_alert: 8, description: 'Vegetable cooking oil, 1 litre bottle' },
  { name: 'Soap Bar', category: 'Household', stock: 120, unit_price: 300, low_stock_alert: 20, description: 'Multi-purpose washing soap' },
  { name: 'Maize Flour 5kg', category: 'Food', stock: 8, unit_price: 3200, low_stock_alert: 10, description: 'Fine maize flour, 5kg bag' },
  { name: 'Bread Loaf', category: 'Bakery', stock: 35, unit_price: 800, low_stock_alert: 15, description: 'Fresh baked white bread' },
  { name: 'Milk 1L', category: 'Dairy', stock: 5, unit_price: 700, low_stock_alert: 10, description: 'Fresh pasteurised milk, 1 litre' },
  { name: 'Salt 1kg', category: 'Food', stock: 60, unit_price: 500, low_stock_alert: 10, description: 'Iodised table salt, 1kg pack' },
];

const sales = [
  { product_name: 'Rice 5kg', quantity: 12, unit_price: 4500, customer: 'Jean Bosco', payment_method: 'cash', date: '2026-10-07' },
  { product_name: 'Sugar 1kg', quantity: 25, unit_price: 1200, customer: 'Mukamana', payment_method: 'mobile-money', date: '2026-10-07' },
  { product_name: 'Cooking Oil 1L', quantity: 8, unit_price: 2400, customer: 'Kevin M.', payment_method: 'cash', date: '2026-10-06' },
  { product_name: 'Bread Loaf', quantity: 40, unit_price: 800, customer: 'Walk-in Customer', payment_method: 'cash', date: '2026-10-06' },
  { product_name: 'Maize Flour 5kg', quantity: 6, unit_price: 3200, customer: 'Alice I.', payment_method: 'mobile-money', date: '2026-10-05' },
  { product_name: 'Rice 5kg', quantity: 15, unit_price: 4500, customer: 'Habimana', payment_method: 'card', date: '2026-10-05' },
  { product_name: 'Milk 1L', quantity: 20, unit_price: 700, customer: 'Walk-in Customer', payment_method: 'cash', date: '2026-10-04' },
  { product_name: 'Soap Bar', quantity: 30, unit_price: 300, customer: 'Uwase D.', payment_method: 'mobile-money', date: '2026-10-04' },
];

function tableIsEmpty(db: Database.Database, table: string): boolean {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
  return row.count === 0;
}

export function seedDatabase(db: Database.Database): void {
  if (tableIsEmpty(db, 'users')) {
    const insertUser = db.prepare(
      'INSERT INTO users (id, name, email, password_hash, role, language) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const account of DEMO_ACCOUNTS) {
      insertUser.run(
        randomUUID(),
        account.name,
        account.email,
        bcrypt.hashSync(account.password, 10),
        account.role,
        'en'
      );
    }
  }

  if (tableIsEmpty(db, 'complaints')) {
    const insert = db.prepare(
      'INSERT INTO complaints (id, category, title, description, location, status, created_at) VALUES (@id, @category, @title, @description, @location, @status, @created_at)'
    );
    for (const item of complaints) insert.run(item);
  }

  if (tableIsEmpty(db, 'announcements')) {
    const insert = db.prepare(
      'INSERT INTO announcements (id, title, date, category, content) VALUES (@id, @title, @date, @category, @content)'
    );
    for (const item of announcements) insert.run(item);
  }

  if (tableIsEmpty(db, 'notifications')) {
    const insert = db.prepare(
      'INSERT INTO notifications (id, type, title, message, read, date, channel) VALUES (@id, @type, @title, @message, @read, @date, @channel)'
    );
    for (const item of notifications) insert.run(item);
  }

  if (tableIsEmpty(db, 'students')) {
    const insert = db.prepare(
      `INSERT INTO students (id, name, class_name, date_of_birth, gender, parent_name, parent_phone, academic_year, attendance, performance, status)
       VALUES (@id, @name, @class_name, @date_of_birth, @gender, @parent_name, @parent_phone, @academic_year, @attendance, @performance, @status)`
    );
    for (const student of students) insert.run({ id: randomUUID(), ...student });
  }

  if (tableIsEmpty(db, 'teachers')) {
    const insert = db.prepare(
      'INSERT INTO teachers (id, name, subjects, classes, students, phone, email) VALUES (@id, @name, @subjects, @classes, @students, @phone, @email)'
    );
    for (const teacher of teachers) {
      insert.run({
        id: randomUUID(),
        name: teacher.name,
        subjects: JSON.stringify(teacher.subjects),
        classes: JSON.stringify(teacher.classes),
        students: teacher.students,
        phone: teacher.phone,
        email: teacher.email,
      });
    }
  }

  if (tableIsEmpty(db, 'products')) {
    const insert = db.prepare(
      `INSERT INTO products (id, name, category, stock, unit_price, low_stock_alert, description)
       VALUES (@id, @name, @category, @stock, @unit_price, @low_stock_alert, @description)`
    );
    for (const product of products) insert.run({ id: randomUUID(), ...product });
  }

  if (tableIsEmpty(db, 'sales')) {
    const insert = db.prepare(
      `INSERT INTO sales (id, product_name, quantity, unit_price, customer, payment_method, date, created_at)
       VALUES (@id, @product_name, @quantity, @unit_price, @customer, @payment_method, @date, @created_at)`
    );
    for (const sale of sales) insert.run({ id: randomUUID(), created_at: `${sale.date} 10:00:00`, ...sale });
  }

  if (tableIsEmpty(db, 'loan_records')) {
    const insert = db.prepare(
      `INSERT INTO loan_records (id, record_type, counterparty, amount, date, interest_rate, due_date, notes)
       VALUES (@id, @record_type, @counterparty, @amount, @date, @interest_rate, @due_date, @notes)`
    );
    insert.run({
      id: randomUUID(),
      record_type: 'loan',
      counterparty: 'Bank of Kigali',
      amount: 500000,
      date: '2026-09-15',
      interest_rate: 14,
      due_date: '2027-03-15',
      notes: 'Stock expansion loan',
    });
  }
}
