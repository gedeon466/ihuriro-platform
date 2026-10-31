import type { Notification, Complaint, Student, Teacher, BusinessProduct, SaleRecord } from '@/types';

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'government', title: 'Community Development Meeting', message: 'A community meeting will be held on October 15 at the sector office to discuss local development projects.', read: false, date: '2026-10-07', channel: 'sms' },
  { id: 'n2', type: 'school', title: 'Your child was absent today', message: 'Muhire Kevin (P6A) was absent from school today. Please contact the school if this is unexpected.', read: false, date: '2026-10-08', channel: 'sms' },
  { id: 'n3', type: 'health', title: 'Vaccination Reminder', message: 'Your child is due for the next vaccination this week. Please visit your nearest health center.', read: false, date: '2026-10-06', channel: 'email' },
  { id: 'n4', type: 'business', title: 'Low Stock Alert: Rice', message: 'Your stock of Rice (5kg) has dropped below the minimum level. Current stock: 3 units.', read: true, date: '2026-10-05', channel: 'system' },
  { id: 'n5', type: 'system', title: 'Welcome to IHURIRO Rwanda', message: 'Your account has been successfully created. Explore all the services available to you!', read: true, date: '2026-10-01', channel: 'system' },
  { id: 'n6', type: 'government', title: 'New Public Announcement', message: 'The sector office announces new operating hours starting October 10: Monday-Friday, 8AM-5PM.', read: true, date: '2026-10-04', channel: 'email' },
  { id: 'n7', type: 'school', title: 'Parent-Teacher Meeting', message: 'A parent-teacher meeting is scheduled for October 20 at 2PM in the main hall.', read: false, date: '2026-10-07', channel: 'sms' },
  { id: 'n8', type: 'health', title: 'Pregnancy Check-up Due', message: 'Your next prenatal check-up is scheduled for October 12. Please confirm your appointment.', read: false, date: '2026-10-08', channel: 'sms' },
];

export const mockComplaints: Complaint[] = [
  { id: 'c1', title: 'Damaged road in our neighborhood', category: 'Infrastructure', status: 'in-review', date: '2026-10-03', description: 'The road leading to Kimisagara market has large potholes making it dangerous for motorcyclists and pedestrians.', location: 'Kimisagara, Nyarugenge' },
  { id: 'c2', title: 'No water supply for 3 days', category: 'Utilities', status: 'resolved', date: '2026-09-28', description: 'Our area has had no running water for three consecutive days. This is affecting daily life significantly.', location: 'Gikondo, Kicukiro' },
  { id: 'c3', title: 'Street lights not working', category: 'Security', status: 'pending', date: '2026-10-06', description: 'Several street lights on our road have not been working for over a week, creating safety concerns at night.', location: 'Remera, Gasabo' },
  { id: 'c4', title: 'Request for new bus route', category: 'Transport', status: 'pending', date: '2026-10-07', description: 'Our neighborhood has no direct bus route to the city center, making commuting very difficult for residents.', location: 'Bumbogo, Gasabo' },
];

export const mockStudents: Student[] = [
  { id: 's1', name: 'Muhire Kevin', class: 'P6A', attendance: 92, performance: 85, status: 'active' },
  { id: 's2', name: 'Uwase Diane', class: 'P6A', attendance: 88, performance: 91, status: 'active' },
  { id: 's3', name: 'Habimana Eric', class: 'S3B', attendance: 64, performance: 58, status: 'at-risk' },
  { id: 's4', name: 'Ingabire Alice', class: 'S1A', attendance: 95, performance: 89, status: 'active' },
  { id: 's5', name: 'Nshimiyimana Joseph', class: 'S3B', attendance: 45, performance: 42, status: 'at-risk' },
  { id: 's6', name: 'Mukamana Grace', class: 'P5A', attendance: 97, performance: 93, status: 'active' },
  { id: 's7', name: 'Twizeyimana Paul', class: 'S2C', attendance: 72, performance: 65, status: 'active' },
  { id: 's8', name: 'Iradukunda luck', class: 'P4B', attendance: 38, performance: 35, status: 'dropped' },
];

export const mockTeachers: Teacher[] = [
  { id: 't1', name: 'Mr. Munyakazi Jean', subjects: ['Mathematics', 'Science'], classes: ['P6A', 'P6B'], students: 84 },
  { id: 't2', name: 'Mrs. Umutoni Claire', subjects: ['English', 'Kinyarwanda'], classes: ['S1A', 'S2A'], students: 76 },
  { id: 't3', name: 'Mr. Ndagijimana Patrick', subjects: ['History', 'Geography'], classes: ['S3B'], students: 42 },
  { id: 't4', name: 'Mrs. Mukamana Alice', subjects: ['Biology', 'Chemistry'], classes: ['S2C', 'S3B'], students: 58 },
];

export const mockProducts: BusinessProduct[] = [
  { id: 'p1', name: 'Rice 5kg', category: 'Food', stock: 3, unitPrice: 4500, status: 'low-stock' },
  { id: 'p2', name: 'Sugar 1kg', category: 'Food', stock: 45, unitPrice: 1200, status: 'in-stock' },
  { id: 'p3', name: 'Cooking Oil 1L', category: 'Food', stock: 0, unitPrice: 2400, status: 'out-of-stock' },
  { id: 'p4', name: 'Soap Bar', category: 'Household', stock: 120, unitPrice: 300, status: 'in-stock' },
  { id: 'p5', name: 'Maize Flour 5kg', category: 'Food', stock: 8, unitPrice: 3200, status: 'low-stock' },
  { id: 'p6', name: 'Bread Loaf', category: 'Bakery', stock: 35, unitPrice: 800, status: 'in-stock' },
  { id: 'p7', name: 'Milk 1L', category: 'Dairy', stock: 5, unitPrice: 700, status: 'low-stock' },
  { id: 'p8', name: 'Salt 1kg', category: 'Food', stock: 60, unitPrice: 500, status: 'in-stock' },
];

export const mockSales: SaleRecord[] = [
  { id: 'sl1', product: 'Rice 5kg', quantity: 12, amount: 54000, date: '2026-10-07', customer: 'Jean Bosco' },
  { id: 'sl2', product: 'Sugar 1kg', quantity: 25, amount: 30000, date: '2026-10-07', customer: 'Mukamana' },
  { id: 'sl3', product: 'Cooking Oil 1L', quantity: 8, amount: 19200, date: '2026-10-06', customer: 'Kevin M.' },
  { id: 'sl4', product: 'Bread Loaf', quantity: 40, amount: 32000, date: '2026-10-06', customer: 'Walk-in Customer' },
  { id: 'sl5', product: 'Maize Flour 5kg', quantity: 6, amount: 19200, date: '2026-10-05', customer: 'Alice I.' },
  { id: 'sl6', product: 'Rice 5kg', quantity: 15, amount: 67500, date: '2026-10-05', customer: 'Habimana' },
  { id: 'sl7', product: 'Milk 1L', quantity: 20, amount: 14000, date: '2026-10-04', customer: 'Walk-in Customer' },
  { id: 'sl8', product: 'Soap Bar', quantity: 30, amount: 9000, date: '2026-10-04', customer: 'Uwase D.' },
];

export const mockAnnouncements = [
  { id: 'a1', title: 'Community Development Meeting', date: '2026-10-15', category: 'Government', content: 'A community meeting will be held at the sector office to discuss local development projects. All residents are encouraged to attend.' },
  { id: 'a2', title: 'National Vaccination Week', date: '2026-10-10', category: 'Health', content: 'The Ministry of Health announces a national vaccination week from October 10-17. Visit your nearest health center for free immunizations.' },
  { id: 'a3', title: 'School Parent-Teacher Conference', date: '2026-10-20', category: 'Education', content: 'Parent-teacher conferences will be held on October 20 from 2PM to 5PM. Please confirm your attendance with the school office.' },
  { id: 'a4', title: 'New Business Registration Support', date: '2026-10-12', category: 'Business', content: 'The RDB is offering free business registration support at all sector offices during October. Bring your ID and business plan.' },
  { id: 'a5', title: 'Umuganda Community Work Day', date: '2026-10-26', category: 'Government', content: 'The next Umuganda community work day is Saturday, October 26. Meet at your local cell office at 8AM.' },
];

export const mockHistoryTimeline = [
  { year: 'Pre-1500', title: 'Early Kingdoms', description: 'Rwanda was populated by hunter-gatherers and later Bantu peoples who established kingdoms.' },
  { year: '1500-1700', title: 'Kingdom Expansion', description: 'The Rwandan monarchy expanded its territory under King Ruganzu II, unifying the region.' },
  { year: '1899', title: 'German Colonization', description: 'Rwanda became part of German East Africa, beginning the colonial period.' },
  { year: '1916', title: 'Belgian Administration', description: 'Belgium took control of Rwanda during World War I under League of Nations mandate.' },
  { year: '1962', title: 'Independence', description: 'Rwanda gained independence from Belgium on July 1, 1962.' },
  { year: '1994', title: 'Liberation & Tragedy', description: 'The 1994 Genocide against the Tutsi ended with the RPF liberation, beginning a new era.' },
  { year: '2000', title: 'Vision 2020', description: 'President Paul Kagame launched Vision 2020, a development program to transform Rwanda.' },
  { year: '2008', title: 'Join Commonwealth', description: 'Rwanda became a member of the Commonwealth of Nations.' },
  { year: '2019', title: 'Visa on Arrival', description: 'Rwanda introduced visa on arrival for all African nationals, boosting pan-African relations.' },
  { year: '2024', title: 'Vision 2050', description: 'Rwanda continues its journey toward becoming a middle-income country by 2035 and high-income by 2050.' },
];

export const mockAIStats = [
  { label: 'Total Questions', value: '12,847', change: '+18%' },
  { label: 'By Education', value: '3,210', change: '+12%' },
  { label: 'By CitizenConnect', value: '2,156', change: '+22%' },
  { label: 'By Biz360', value: '1,890', change: '+8%' },
  { label: 'Unanswered', value: '234', change: '-5%' },
  { label: 'User Satisfaction', value: '94%', change: '+3%' },
];

export const mockAdminUsers = [
  { id: 'u1', name: 'Mukamana Alice', email: 'alice@example.rw', role: 'citizen', status: 'active', joined: '2026-09-15' },
  { id: 'u2', name: 'Habimana Eric', email: 'eric@example.rw', role: 'teacher', status: 'active', joined: '2026-09-20' },
  { id: 'u3', name: 'Uwase Diane', email: 'diane@example.rw', role: 'parent', status: 'active', joined: '2026-09-22' },
  { id: 'u4', name: 'Nshimiyimana J.', email: 'joseph@example.rw', role: 'business', status: 'active', joined: '2026-09-25' },
  { id: 'u5', name: 'Ingabire Grace', email: 'grace@example.rw', role: 'health', status: 'active', joined: '2026-09-28' },
  { id: 'u6', name: 'Gedeon Niyomungeri', email: 'gedeonniyomungeri87@gmail.com', role: 'admin', status: 'active', joined: '2026-10-01' },
];
