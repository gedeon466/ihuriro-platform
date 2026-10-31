import express from 'express';
import { z } from 'zod';
import { execute, newId, nowIso, query, queryOne, today } from '../db.js';
import { audit } from '../lib/audit.js';
import {
  AppError,
  asyncHandler,
  pagination,
  parseBody,
  serializeAbsence,
  serializeAssignment,
  serializeAttendance,
  serializeClassRecord,
  serializeLesson,
  serializeSchool,
  serializeStudent,
  serializeSubject,
  serializeTeacher,
  serializeResult,
} from '../lib/http.js';
import { composeAbsenceSms, localLeaveSms } from '../lib/sms.js';
import { canManageEducation, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

const studentSchema = z.object({
  name: z.string().trim().min(2, 'Enter the student name.').max(100),
  class: z.string().trim().min(1, 'Enter the class.').max(20),
  attendance: z.coerce.number().min(0).max(100).optional().default(0),
  performance: z.coerce.number().min(0).max(100).optional().default(0),
  status: z.enum(['active', 'at-risk', 'dropped']).optional().default('active'),
  dateOfBirth: z.string().trim().max(20).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', '']).optional().or(z.literal('')),
  academicYear: z.string().trim().max(20).optional().or(z.literal('')),
  parentName: z.string().trim().max(100).optional().or(z.literal('')),
  parentPhone: z.string().trim().max(30).optional().or(z.literal('')),
  parentEmail: z
    .union([z.string().trim().email('Enter a valid guardian email.').max(254), z.literal('')])
    .optional(),
});

const bulkStudentSchema = z.object({
  students: z.array(studentSchema).min(1, 'Add at least one student.').max(200),
});

const studentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  class: z.string().trim().min(1).max(20).optional(),
  attendance: z.coerce.number().min(0).max(100).optional(),
  performance: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['active', 'at-risk', 'dropped']).optional(),
  dateOfBirth: z.string().trim().max(20).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', '']).optional().or(z.literal('')),
  academicYear: z.string().trim().max(20).optional().or(z.literal('')),
  parentName: z.string().trim().max(100).optional().or(z.literal('')),
  parentPhone: z.string().trim().max(30).optional().or(z.literal('')),
  parentEmail: z
    .union([z.string().trim().email('Enter a valid guardian email.').max(254), z.literal('')])
    .optional(),
});

const absenceSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format.')
    .optional(),
});

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format.');

const attendanceStatus = z.enum(['present', 'absent', 'late', 'excused']);

const attendanceSchema = z.object({
  status: attendanceStatus,
  date: dateField.optional(),
  remarks: z.string().trim().max(255, 'Keep remarks under 255 characters.').optional().or(z.literal('')),
  schoolId: z.string().trim().max(40).optional().or(z.literal('')),
});

const bulkAttendanceSchema = z.object({
  date: dateField.optional(),
  schoolId: z.string().trim().max(40).optional().or(z.literal('')),
  records: z
    .array(
      z.object({
        studentId: z.string().trim().min(1, 'Choose a student.'),
        status: attendanceStatus,
        remarks: z.string().trim().max(255, 'Keep remarks under 255 characters.').optional().or(z.literal('')),
      })
    )
    .min(1, 'Mark at least one student.')
    .max(500, 'Mark at most 500 students at once.'),
});

const leaveSchema = z.object({
  date: dateField.optional(),
  reason: z.string().trim().max(255, 'Keep the reason under 255 characters.').optional().or(z.literal('')),
});

const teacherSchema = z.object({
  name: z.string().trim().min(2, 'Enter the teacher name.').max(100),
  subjects: z.array(z.string().trim().min(1)).min(1, 'Add at least one subject.').max(10),
  classes: z.array(z.string().trim().min(1)).min(1, 'Add at least one class.').max(20),
  students: z.coerce.number().int().min(0).max(10000).optional().default(0),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().max(254).optional().or(z.literal('')),
});

const schoolSchema = z.object({
  name: z.string().trim().min(2, 'Enter the school name.').max(120),
  district: z.string().trim().min(2, 'Enter the district.').max(60),
  level: z.string().trim().min(2, 'Enter the school level.').max(60),
  students: z.coerce.number().int().min(0).max(100000).optional().default(0),
  teachers: z.coerce.number().int().min(0).max(10000).optional().default(0),
});

const classSchema = z.object({
  name: z.string().trim().min(1, 'Enter the class name.').max(20),
  teacher: z.string().trim().min(2, 'Enter the class teacher.').max(100),
  students: z.coerce.number().int().min(0).max(10000).optional().default(0),
  room: z.string().trim().max(40).optional().or(z.literal('')),
  subjects: z.coerce.number().int().min(0).max(50).optional().default(0),
});

const bulkClassSchema = z.object({
  classes: z.array(classSchema).min(1, 'Add at least one class.').max(100),
});

const subjectSchema = z.object({
  name: z.string().trim().min(2, 'Enter the subject name.').max(80),
  teacher: z.string().trim().max(100).optional().or(z.literal('')),
  classes: z.array(z.string().trim().min(1)).min(1, 'Add at least one class.').max(20),
});

const lessonSchema = z.object({
  title: z.string().trim().min(3, 'Enter the lesson title.').max(160),
  subject: z.string().trim().min(2, 'Enter the subject.').max(80),
  class: z.string().trim().min(1, 'Enter the class.').max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format.'),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional().default('scheduled'),
});

const assignmentSchema = z.object({
  title: z.string().trim().min(3, 'Enter the assignment title.').max(160),
  subject: z.string().trim().min(2, 'Enter the subject.').max(80),
  class: z.string().trim().min(1, 'Enter the class.').max(20),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format.'),
  submitted: z.coerce.number().int().min(0).max(10000).optional().default(0),
  total: z.coerce.number().int().min(0).max(10000).optional().default(0),
});

const resultSchema = z.object({
  studentId: z.string().trim().min(1, 'Choose a student.'),
  subject: z.string().trim().min(2, 'Enter the subject.').max(80),
  term: z.string().trim().min(2, 'Enter the term.').max(20).optional().default('Term 1'),
  academicYear: z.string().trim().max(20).optional().or(z.literal('')),
  marks: z.coerce.number().min(0, 'Marks must be 0 or more.').max(100, 'Marks cannot exceed 100.'),
});

const studentColumns = {
  name: 'name',
  class: 'class',
  attendance: 'attendance',
  performance: 'performance',
  status: 'status',
  dateOfBirth: 'date_of_birth',
  gender: 'gender',
  academicYear: 'academic_year',
  parentName: 'parent_name',
  parentPhone: 'parent_phone',
  parentEmail: 'parent_email',
};

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

function phoneKey(value) {
  const digits = digitsOnly(value);
  return digits.length > 9 ? digits.slice(-9) : digits;
}

function matchGuardian(users, student) {
  const email = String(student.parent_email || '').trim().toLowerCase();
  const phone = phoneKey(student.parent_phone);
  if (!email && !phone) return null;

  return (
    users.find((user) => {
      if (email && String(user.email || '').trim().toLowerCase() === email) return true;
      const userPhone = phoneKey(user.phone);
      return Boolean(phone && userPhone && userPhone === phone);
    }) || null
  );
}

function activeGuardianAccounts() {
  return query(
    "SELECT id, name, email, phone, role, language FROM users WHERE status = 'active' ORDER BY name ASC"
  );
}

async function classIdsByName() {
  const rows = await query('SELECT id, name FROM classes');
  return new Map(rows.map((row) => [String(row.name).trim().toUpperCase(), row.id]));
}

async function ensureSchoolId(value) {
  const schoolId = String(value || '').trim();
  if (!schoolId) return '';
  const school = await queryOne('SELECT id FROM schools WHERE id = ?', [schoolId]);
  if (!school) throw new AppError(404, 'That school no longer exists.');
  return school.id;
}

async function refreshAttendanceRates(studentIds) {
  if (studentIds.length === 0) return;
  const placeholders = studentIds.map(() => '?').join(', ');
  await execute(
    `UPDATE students s
       JOIN (
         SELECT student_id,
                ROUND(100 * SUM(status IN ('present', 'late')) / COUNT(*), 1) AS rate
         FROM student_attendance
         WHERE student_id IN (${placeholders})
         GROUP BY student_id
       ) stats ON stats.student_id = s.id
     SET s.attendance = stats.rate`,
    studentIds
  );
}

router.get(
  '/students',
  asyncHandler(async (_req, res) => {
    const [rows, users] = await Promise.all([
      query('SELECT * FROM students ORDER BY `class` ASC, name ASC'),
      activeGuardianAccounts(),
    ]);
    res.json({ students: rows.map((row) => serializeStudent(row, matchGuardian(users, row))) });
  })
);

router.post(
  '/students',
  asyncHandler(async (req, res) => {
    const data = parseBody(studentSchema, req.body);
    const id = newId('std');
    const timestamp = nowIso();

    await execute(
      `INSERT INTO students (id, name, \`class\`, attendance, performance, status,
         date_of_birth, gender, academic_year, parent_name, parent_phone, parent_email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.class,
        data.attendance,
        data.performance,
        data.status,
        data.dateOfBirth || null,
        data.gender || null,
        data.academicYear || null,
        data.parentName || null,
        data.parentPhone || null,
        data.parentEmail || null,
        timestamp,
        timestamp,
      ]
    );

    const row = await queryOne('SELECT * FROM students WHERE id = ?', [id]);
    const guardian = matchGuardian(await activeGuardianAccounts(), row);
    audit(req, 'student.create', 'student', id, { class: data.class });
    res.status(201).json({ student: serializeStudent(row, guardian) });
  })
);

router.post(
  '/students/bulk',
  asyncHandler(async (req, res) => {
    const { students: incoming } = parseBody(bulkStudentSchema, req.body);
    const existing = await query('SELECT name, `class` FROM students');
    const taken = new Set(
      existing.map((row) => `${String(row.name).toLowerCase()}|${String(row.class).toLowerCase()}`)
    );
    const timestamp = nowIso();
    const createdIds = [];
    const skipped = [];

    for (const data of incoming) {
      const key = `${data.name.toLowerCase()}|${data.class.toLowerCase()}`;
      if (taken.has(key)) {
        skipped.push(`${data.name} (${data.class})`);
        continue;
      }
      taken.add(key);
      const id = newId('std');
      await execute(
        `INSERT INTO students (id, name, \`class\`, attendance, performance, status,
           date_of_birth, gender, academic_year, parent_name, parent_phone, parent_email, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.class,
          data.attendance,
          data.performance,
          data.status,
          data.dateOfBirth || null,
          data.gender || null,
          data.academicYear || null,
          data.parentName || null,
          data.parentPhone || null,
          data.parentEmail || null,
          timestamp,
          timestamp,
        ]
      );
      createdIds.push(id);
    }

    if (createdIds.length === 0) {
      throw new AppError(409, 'All of those students already exist in their classes.');
    }

    audit(req, 'student.bulk-create', 'student', createdIds.join(','), {
      count: createdIds.length,
      skipped,
    });

    const placeholders = createdIds.map(() => '?').join(',');
    const [rows, guardians] = await Promise.all([
      query(`SELECT * FROM students WHERE id IN (${placeholders})`, createdIds),
      activeGuardianAccounts(),
    ]);
    res.status(201).json({
      created: rows.map((row) => serializeStudent(row, matchGuardian(guardians, row))),
      skipped,
    });
  })
);

router.patch(
  '/students/:id',
  asyncHandler(async (req, res) => {
    if (!canManageEducation(req.user)) {
      throw new AppError(403, 'Only teachers and administrators can update students.');
    }
    const data = parseBody(studentUpdateSchema, req.body);
    const row = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!row) throw new AppError(404, 'Student not found.');

    const changes = [];
    const params = [];
    for (const [key, column] of Object.entries(studentColumns)) {
      if (data[key] !== undefined) {
        changes.push(`\`${column}\` = ?`);
        params.push(data[key] === '' ? null : data[key]);
      }
    }
    if (changes.length === 0) throw new AppError(400, 'No changes were submitted.');

    changes.push('updated_at = ?');
    params.push(nowIso(), row.id);
    await execute(`UPDATE students SET ${changes.join(', ')} WHERE id = ?`, params);

    const updated = await queryOne('SELECT * FROM students WHERE id = ?', [row.id]);
    const guardian = matchGuardian(await activeGuardianAccounts(), updated);
    audit(req, 'student.update', 'student', row.id, Object.keys(data));
    res.json({ student: serializeStudent(updated, guardian) });
  })
);

router.delete(
  '/students/:id',
  asyncHandler(async (req, res) => {
    if (!canManageEducation(req.user)) {
      throw new AppError(403, 'Only teachers and administrators can remove students.');
    }
    const row = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!row) throw new AppError(404, 'Student not found.');

    await execute('DELETE FROM students WHERE id = ?', [row.id]);
    audit(req, 'student.delete', 'student', row.id);
    res.json({ ok: true });
  })
);

router.get(
  '/absences',
  asyncHandler(async (req, res) => {
    const { limit, offset } = pagination(req.query);
    const date = String(req.query.date || '').trim();
    const filters = [];
    const params = [];

    if (!canManageEducation(req.user)) {
      filters.push('a.guardian_user_id = ?');
      params.push(req.user.id);
    }
    if (date) {
      filters.push('a.`date` = ?');
      params.push(date);
    }

    const rows = await query(
      `SELECT a.*, s.name AS student_name, s.\`class\` AS student_class, u.name AS guardian_name
       FROM student_absences a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.guardian_user_id
       ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
       ORDER BY a.\`date\` DESC, a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ absences: rows.map(serializeAbsence) });
  })
);

router.get(
  '/attendance',
  asyncHandler(async (req, res) => {
    const { limit, offset } = pagination(req.query, 500);
    const filters = [];
    const params = [];

    if (!canManageEducation(req.user)) {
      filters.push('(s.parent_email = ? OR (s.parent_phone <> \'\' AND s.parent_phone = ?))');
      params.push(req.user.email || '', req.user.phone || '');
    }

    const date = String(req.query.date || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();
    const status = String(req.query.status || '').trim();
    const className = String(req.query.class || '').trim();
    const schoolId = String(req.query.school || '').trim();

    if (date) {
      filters.push('a.`date` = ?');
      params.push(date);
    } else {
      if (from) {
        filters.push('a.`date` >= ?');
        params.push(from);
      }
      if (to) {
        filters.push('a.`date` <= ?');
        params.push(to);
      }
    }
    if (status && ['present', 'absent', 'late', 'excused'].includes(status)) {
      filters.push('a.status = ?');
      params.push(status);
    }
    if (className) {
      filters.push('s.`class` = ?');
      params.push(className);
    }
    if (schoolId) {
      filters.push('a.school_id = ?');
      params.push(schoolId);
    }

    const rows = await query(
      `SELECT a.*, s.name AS student_name, s.\`class\` AS student_class,
              u.name AS marked_by_name, sc.name AS school_name, c.name AS class_name
       FROM student_attendance a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.recorded_by
       LEFT JOIN schools sc ON sc.id = a.school_id
       LEFT JOIN classes c ON c.id = a.class_id
       ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
       ORDER BY a.\`date\` DESC, s.name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ attendance: rows.map(serializeAttendance) });
  })
);

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOf(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const day = date.getUTCDay();
  return addDays(dateKey, -(day === 0 ? 6 : day - 1));
}

function attendanceRate(bucket) {
  if (!bucket || bucket.total === 0) return 0;
  return Math.round((1000 * (bucket.present + bucket.late)) / bucket.total) / 10;
}

const emptyBucket = () => ({ present: 0, absent: 0, late: 0, excused: 0, total: 0 });

router.get(
  '/attendance/reports',
  asyncHandler(async (req, res) => {
    const dateKey = (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';
    const to = dateKey(req.query.to) || today();
    const toDate = new Date(`${to}T00:00:00Z`);
    const from =
      dateKey(req.query.from) ||
      new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth() - 5, 1))
        .toISOString()
        .slice(0, 10);

    const filters = ['a.`date` >= ?', 'a.`date` <= ?'];
    const params = [from, to];

    if (!canManageEducation(req.user)) {
      filters.push("(s.parent_email = ? OR (s.parent_phone <> '' AND s.parent_phone = ?))");
      params.push(req.user.email || '', req.user.phone || '');
    }
    const className = String(req.query.class || '').trim();
    const schoolId = String(req.query.school || '').trim();
    if (className) {
      filters.push('s.`class` = ?');
      params.push(className);
    }
    if (schoolId) {
      filters.push('a.school_id = ?');
      params.push(schoolId);
    }

    const rows = await query(
      `SELECT a.\`date\`, a.status, s.\`class\` AS student_class
       FROM student_attendance a
       JOIN students s ON s.id = a.student_id
       WHERE ${filters.join(' AND ')}`,
      params
    );

    const totals = emptyBucket();
    const byDate = new Map();
    const byClass = new Map();

    for (const row of rows) {
      const key = String(row.date).slice(0, 10);
      const status = row.status;
      if (!(status in totals)) continue;
      const bump = (bucket) => {
        bucket[status] += 1;
        bucket.total += 1;
      };
      bump(totals);
      if (!byDate.has(key)) byDate.set(key, emptyBucket());
      bump(byDate.get(key));
      const classNameValue = row.student_class || 'Unassigned';
      if (!byClass.has(classNameValue)) byClass.set(classNameValue, emptyBucket());
      bump(byClass.get(classNameValue));
    }

    const daily = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const key = addDays(to, -offset);
      daily.push({ date: key, marked: byDate.get(key)?.total || 0, rate: attendanceRate(byDate.get(key)) });
    }

    const weekly = [];
    const thisMonday = mondayOf(to);
    for (let week = 3; week >= 0; week -= 1) {
      const start = addDays(thisMonday, -7 * week);
      const end = addDays(start, 6);
      const bucket = emptyBucket();
      const cursorEnd = end > to ? to : end;
      for (let day = start; day <= cursorEnd; day = addDays(day, 1)) {
        const dayBucket = byDate.get(day);
        if (!dayBucket) continue;
        for (const status of ['present', 'absent', 'late', 'excused']) bucket[status] += dayBucket[status];
        bucket.total += dayBucket.total;
      }
      weekly.push({ start, end: cursorEnd, marked: bucket.total, rate: attendanceRate(bucket) });
    }

    const monthly = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const marker = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth() - offset, 1));
      const month = marker.toISOString().slice(0, 7);
      const bucket = emptyBucket();
      for (const [day, dayBucket] of byDate.entries()) {
        if (!day.startsWith(month)) continue;
        for (const status of ['present', 'absent', 'late', 'excused']) bucket[status] += dayBucket[status];
        bucket.total += dayBucket.total;
      }
      monthly.push({ month, marked: bucket.total, rate: attendanceRate(bucket) });
    }

    const classes = [...byClass.entries()]
      .map(([name, bucket]) => ({
        className: name,
        marked: bucket.total,
        present: bucket.present,
        absent: bucket.absent,
        late: bucket.late,
        excused: bucket.excused,
        rate: attendanceRate(bucket),
      }))
      .sort((a, b) => a.className.localeCompare(b.className));

    res.json({
      from,
      to,
      totals: {
        present: totals.present,
        absent: totals.absent,
        late: totals.late,
        excused: totals.excused,
        marked: totals.total,
        rate: attendanceRate(totals),
      },
      daily,
      weekly,
      monthly,
      byClass: classes,
    });
  })
);

router.post(
  '/attendance/bulk',
  asyncHandler(async (req, res) => {
    if (!canManageEducation(req.user)) {
      throw new AppError(403, 'Only teachers and administrators can record attendance.');
    }

    const data = parseBody(bulkAttendanceSchema, req.body);
    const date = data.date || today();
    const schoolId = await ensureSchoolId(data.schoolId);
    const classMap = await classIdsByName();

    const records = new Map();
    for (const record of data.records) records.set(record.studentId, record);
    const studentIds = [...records.keys()];
    const placeholders = studentIds.map(() => '?').join(', ');

    const studentRows = await query(`SELECT * FROM students WHERE id IN (${placeholders})`, studentIds);
    const studentsById = new Map(studentRows.map((row) => [row.id, row]));
    const unknown = studentIds.filter((id) => !studentsById.has(id));
    if (unknown.length > 0) {
      throw new AppError(404, `These students no longer exist: ${unknown.join(', ')}.`);
    }

    const [guardians, existingAttendance, existingAbsences] = await Promise.all([
      activeGuardianAccounts(),
      query(
        `SELECT * FROM student_attendance WHERE \`date\` = ? AND student_id IN (${placeholders})`,
        [date, ...studentIds]
      ),
      query(
        `SELECT * FROM student_absences WHERE \`date\` = ? AND student_id IN (${placeholders})`,
        [date, ...studentIds]
      ),
    ]);
    const attendanceByStudent = new Map(existingAttendance.map((row) => [row.student_id, row]));
    const absencesByStudent = new Map(existingAbsences.map((row) => [row.student_id, row]));

    const timestamp = nowIso();
    const alerts = [];
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };

    for (const record of records.values()) {
      const student = studentsById.get(record.studentId);
      const existing = attendanceByStudent.get(record.studentId);
      const remarks = String(record.remarks || '').trim() || null;
      const classId = classMap.get(String(student.class || '').trim().toUpperCase()) || null;
      counts[record.status] += 1;

      if (existing) {
        await execute(
          `UPDATE student_attendance
           SET status = ?, remarks = COALESCE(?, remarks), school_id = COALESCE(?, school_id),
               class_id = COALESCE(?, class_id), recorded_by = ?, updated_at = ?
           WHERE id = ?`,
          [record.status, remarks, schoolId || null, classId, req.user.id, timestamp, existing.id]
        );
      } else {
        await execute(
          `INSERT INTO student_attendance
             (id, student_id, school_id, class_id, \`date\`, status, remarks, recorded_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId('att'),
            record.studentId,
            schoolId || null,
            classId,
            date,
            record.status,
            remarks,
            req.user.id,
            timestamp,
            timestamp,
          ]
        );
      }

      if (record.status !== 'absent') continue;

      const guardian = matchGuardian(guardians, student);
      const contact =
        String(student.parent_email || '').trim() || String(student.parent_phone || '').trim();
      const existingAbsence = absencesByStudent.get(student.id);

      if (existingAbsence) {
        alerts.push({
          studentId: student.id,
          studentName: student.name,
          className: student.class,
          guardianName: guardian?.name || '',
          contact: existingAbsence.guardian_contact || contact,
          smsSent: true,
          notified: Boolean(existingAbsence.guardian_user_id),
          reason: 'already-notified',
          sms: existingAbsence.sms,
        });
        continue;
      }

      if (!contact) {
        alerts.push({
          studentId: student.id,
          studentName: student.name,
          className: student.class,
          guardianName: guardian?.name || '',
          contact: '',
          smsSent: false,
          notified: false,
          reason: 'no-contact',
          sms: '',
        });
        continue;
      }

      const { sms, source } = await composeAbsenceSms({
        studentName: student.name,
        className: student.class,
        date,
        language: guardian?.language || 'en',
      });

      await execute(
        `INSERT INTO student_absences
           (id, student_id, \`date\`, kind, remarks, guardian_user_id, guardian_contact, sms, sms_source, created_by, created_at)
         VALUES (?, ?, ?, 'absence', ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId('abs'),
          student.id,
          date,
          remarks,
          guardian?.id || null,
          contact,
          sms,
          source,
          req.user.id,
          timestamp,
        ]
      );

      if (guardian) {
        await execute(
          `INSERT INTO notifications (id, user_id, type, title, message, \`read\`, \`date\`, channel, created_at)
           VALUES (?, ?, 'school', ?, ?, 0, ?, 'sms', ?)`,
          [newId('ntf'), guardian.id, `${student.name} (${student.class}) was absent`, sms, date, timestamp]
        );
      }

      alerts.push({
        studentId: student.id,
        studentName: student.name,
        className: student.class,
        guardianName: guardian?.name || '',
        contact,
        smsSent: true,
        notified: Boolean(guardian),
        reason: guardian ? 'notified' : 'saved',
        sms,
      });
    }

    await refreshAttendanceRates(studentIds);

    audit(req, 'student.attendance.bulk', 'student', null, {
      date,
      ...counts,
      smsSent: alerts.filter((alert) => alert.smsSent).length,
    });

    const savedRows = await query(
      `SELECT a.*, s.name AS student_name, s.\`class\` AS student_class,
              u.name AS marked_by_name, sc.name AS school_name, c.name AS class_name
       FROM student_attendance a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.recorded_by
       LEFT JOIN schools sc ON sc.id = a.school_id
       LEFT JOIN classes c ON c.id = a.class_id
       WHERE a.\`date\` = ? AND a.student_id IN (${placeholders})
       ORDER BY s.name ASC`,
      [date, ...studentIds]
    );

    res.status(201).json({
      date,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      excused: counts.excused,
      smsSent: alerts.filter((alert) => alert.smsSent).length,
      alerts,
      attendance: savedRows.map(serializeAttendance),
    });
  })
);

router.post(
  '/students/:id/attendance',
  asyncHandler(async (req, res) => {
    if (!canManageEducation(req.user)) {
      throw new AppError(403, 'Only teachers and administrators can record attendance.');
    }

    const data = parseBody(attendanceSchema, req.body);
    const date = data.date || today();
    const student = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) throw new AppError(404, 'Student not found.');

    const timestamp = nowIso();
    const remarks = String(data.remarks || '').trim() || null;
    const schoolId = await ensureSchoolId(data.schoolId);
    const classMap = await classIdsByName();
    const classId = classMap.get(String(student.class || '').trim().toUpperCase()) || null;
    const existing = await queryOne(
      'SELECT * FROM student_attendance WHERE student_id = ? AND `date` = ?',
      [student.id, date]
    );

    if (existing) {
      await execute(
        `UPDATE student_attendance
         SET status = ?, remarks = COALESCE(?, remarks), school_id = COALESCE(?, school_id),
             class_id = COALESCE(?, class_id), recorded_by = ?, updated_at = ?
         WHERE id = ?`,
        [data.status, remarks, schoolId || null, classId, req.user.id, timestamp, existing.id]
      );
    } else {
      await execute(
        `INSERT INTO student_attendance
           (id, student_id, school_id, class_id, \`date\`, status, remarks, recorded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId('att'),
          student.id,
          schoolId || null,
          classId,
          date,
          data.status,
          remarks,
          req.user.id,
          timestamp,
          timestamp,
        ]
      );
    }

    await refreshAttendanceRates([student.id]);

    audit(req, 'student.attendance', 'student', student.id, { date, status: data.status, remarks });

    const row = await queryOne(
      `SELECT a.*, s.name AS student_name, s.\`class\` AS student_class,
              u.name AS marked_by_name, sc.name AS school_name, c.name AS class_name
       FROM student_attendance a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.recorded_by
       LEFT JOIN schools sc ON sc.id = a.school_id
       LEFT JOIN classes c ON c.id = a.class_id
       WHERE a.student_id = ? AND a.\`date\` = ?`,
      [student.id, date]
    );

    res.status(existing ? 200 : 201).json({ attendance: serializeAttendance(row) });
  })
);

router.post(
  '/students/:id/absence',
  asyncHandler(async (req, res) => {
    if (!canManageEducation(req.user)) {
      throw new AppError(403, 'Only teachers and administrators can record absences.');
    }

    const data = parseBody(absenceSchema, req.body);
    const date = data.date || today();
    const student = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) throw new AppError(404, 'Student not found.');

    const parentEmail = String(student.parent_email || '').trim();
    const parentPhone = String(student.parent_phone || '').trim();
    if (!parentEmail && !parentPhone) {
      throw new AppError(
        422,
        'Add a guardian email or phone number to this student before sending an absence alert.'
      );
    }

    const existing = await queryOne(
      'SELECT id FROM student_absences WHERE student_id = ? AND `date` = ?',
      [student.id, date]
    );
    if (existing) {
      throw new AppError(409, `${student.name} is already marked absent for ${date}.`);
    }

    const guardian = matchGuardian(await activeGuardianAccounts(), student);
    const { sms, source } = await composeAbsenceSms({
      studentName: student.name,
      className: student.class,
      date,
      language: guardian?.language || 'en',
    });

    const id = newId('abs');
    const timestamp = nowIso();
    const guardianContact = parentEmail || parentPhone;

    await execute(
      `INSERT INTO student_absences
         (id, student_id, \`date\`, guardian_user_id, guardian_contact, sms, sms_source, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, student.id, date, guardian?.id || null, guardianContact, sms, source, req.user.id, timestamp]
    );

    let notificationId = null;
    if (guardian) {
      notificationId = newId('ntf');
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, \`read\`, \`date\`, channel, created_at)
         VALUES (?, ?, 'school', ?, ?, 0, ?, 'sms', ?)`,
        [notificationId, guardian.id, `${student.name} (${student.class}) was absent`, sms, date, timestamp]
      );
    }

    audit(req, 'student.absence', 'student', student.id, {
      date,
      notified: Boolean(guardian),
      guardianUserId: guardian?.id || null,
      smsSource: source,
    });

    const row = await queryOne(
      `SELECT a.*, s.name AS student_name, s.\`class\` AS student_class, u.name AS guardian_name
       FROM student_absences a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.guardian_user_id
       WHERE a.id = ?`,
      [id]
    );

    res.status(201).json({
      absence: serializeAbsence(row),
      guardian: guardian
        ? { id: guardian.id, name: guardian.name, email: guardian.email, phone: guardian.phone || '' }
        : null,
      guardianContact,
      notified: Boolean(guardian),
      notificationId,
      sms,
      smsSource: source,
    });
  })
);

router.post(
  '/students/:id/leave-school',
  asyncHandler(async (req, res) => {
    if (!canManageEducation(req.user)) {
      throw new AppError(403, 'Only teachers and administrators can record early departures.');
    }

    const data = parseBody(leaveSchema, req.body);
    const date = data.date || today();
    const student = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) throw new AppError(404, 'Student not found.');

    const parentEmail = String(student.parent_email || '').trim();
    const parentPhone = String(student.parent_phone || '').trim();
    if (!parentEmail && !parentPhone) {
      throw new AppError(
        422,
        'Add a guardian email or phone number to this student before sending a leave alert.'
      );
    }

    const existing = await queryOne(
      'SELECT id, kind FROM student_absences WHERE student_id = ? AND `date` = ?',
      [student.id, date]
    );
    if (existing) {
      const label = existing.kind === 'leave' ? 'leave' : 'absence';
      throw new AppError(409, `${student.name} already has ${label === 'absence' ? 'an' : 'a'} ${label} alert for ${date}.`);
    }

    const guardian = matchGuardian(await activeGuardianAccounts(), student);
    const reason = String(data.reason || '').trim();
    const sms = localLeaveSms({
      studentName: student.name,
      className: student.class,
      date,
      language: guardian?.language || 'en',
      reason,
    });

    const id = newId('abs');
    const timestamp = nowIso();
    const guardianContact = parentEmail || parentPhone;

    await execute(
      `INSERT INTO student_absences
         (id, student_id, \`date\`, kind, remarks, guardian_user_id, guardian_contact, sms, sms_source, created_by, created_at)
       VALUES (?, ?, ?, 'leave', ?, ?, ?, ?, 'local', ?, ?)`,
      [id, student.id, date, reason || null, guardian?.id || null, guardianContact, sms, req.user.id, timestamp]
    );

    let notificationId = null;
    if (guardian) {
      notificationId = newId('ntf');
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, \`read\`, \`date\`, channel, created_at)
         VALUES (?, ?, 'school', ?, ?, 0, ?, 'sms', ?)`,
        [notificationId, guardian.id, `${student.name} (${student.class}) left school early`, sms, date, timestamp]
      );
    }

    audit(req, 'student.leave_school', 'student', student.id, {
      date,
      reason,
      notified: Boolean(guardian),
      guardianUserId: guardian?.id || null,
    });

    const row = await queryOne(
      `SELECT a.*, s.name AS student_name, s.\`class\` AS student_class, u.name AS guardian_name
       FROM student_absences a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.guardian_user_id
       WHERE a.id = ?`,
      [id]
    );

    res.status(201).json({
      alert: serializeAbsence(row),
      guardian: guardian
        ? { id: guardian.id, name: guardian.name, email: guardian.email, phone: guardian.phone || '' }
        : null,
      guardianContact,
      notified: Boolean(guardian),
      notificationId,
      sms,
      smsSource: 'local',
    });
  })
);

router.get(
  '/teachers',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM teachers ORDER BY name ASC');
    res.json({ teachers: rows.map(serializeTeacher) });
  })
);

router.post(
  '/teachers',
  asyncHandler(async (req, res) => {
    const data = parseBody(teacherSchema, req.body);
    const id = newId('tch');

    await execute(
      `INSERT INTO teachers (id, name, subjects, classes, students, phone, email, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        JSON.stringify(data.subjects),
        JSON.stringify(data.classes),
        data.students,
        data.phone || null,
        data.email || null,
        nowIso(),
      ]
    );

    const row = await queryOne('SELECT * FROM teachers WHERE id = ?', [id]);
    audit(req, 'teacher.create', 'teacher', id);
    res.status(201).json({ teacher: serializeTeacher(row) });
  })
);

router.get(
  '/schools',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM schools ORDER BY name ASC');
    res.json({ schools: rows.map(serializeSchool) });
  })
);

router.post(
  '/schools',
  asyncHandler(async (req, res) => {
    const data = parseBody(schoolSchema, req.body);
    const id = newId('sch');

    await execute(
      `INSERT INTO schools (id, name, district, level, students, teachers, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.district, data.level, data.students, data.teachers, nowIso()]
    );

    const row = await queryOne('SELECT * FROM schools WHERE id = ?', [id]);
    audit(req, 'school.create', 'school', id, { name: data.name });
    res.status(201).json({ school: serializeSchool(row) });
  })
);

router.get(
  '/classes',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM classes ORDER BY name ASC');
    res.json({ classes: rows.map(serializeClassRecord) });
  })
);

router.post(
  '/classes/bulk',
  asyncHandler(async (req, res) => {
    const { classes: incoming } = parseBody(bulkClassSchema, req.body);
    const existing = await query('SELECT name FROM classes');
    const taken = new Set(existing.map((row) => String(row.name).toLowerCase()));
    const timestamp = nowIso();
    const created = [];
    const skipped = [];

    for (const data of incoming) {
      const key = data.name.toLowerCase();
      if (taken.has(key)) {
        skipped.push(data.name);
        continue;
      }
      taken.add(key);
      const id = newId('cls');
      await execute(
        `INSERT INTO classes (id, name, teacher, students, room, subjects, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, data.name, data.teacher, data.students, data.room || null, data.subjects, timestamp]
      );
      created.push({ id, name: data.name, teacher: data.teacher, students: data.students, room: data.room || '', subjects: data.subjects });
    }

    if (created.length === 0) {
      throw new AppError(409, 'All of those classes already exist.');
    }

    audit(req, 'class.bulk-create', 'class', created.map((row) => row.id).join(','), {
      count: created.length,
      skipped,
    });
    res.status(201).json({ created, skipped });
  })
);

router.post(
  '/classes',
  asyncHandler(async (req, res) => {
    const data = parseBody(classSchema, req.body);
    const id = newId('cls');

    await execute(
      `INSERT INTO classes (id, name, teacher, students, room, subjects, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.teacher, data.students, data.room || null, data.subjects, nowIso()]
    );

    const row = await queryOne('SELECT * FROM classes WHERE id = ?', [id]);
    audit(req, 'class.create', 'class', id, { name: data.name });
    res.status(201).json({ class: serializeClassRecord(row) });
  })
);

router.get(
  '/subjects',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM subjects ORDER BY name ASC');
    res.json({ subjects: rows.map(serializeSubject) });
  })
);

router.post(
  '/subjects',
  asyncHandler(async (req, res) => {
    const data = parseBody(subjectSchema, req.body);
    const id = newId('sub');

    await execute(
      `INSERT INTO subjects (id, name, teacher, classes, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.name, data.teacher || null, JSON.stringify(data.classes), nowIso()]
    );

    const row = await queryOne('SELECT * FROM subjects WHERE id = ?', [id]);
    audit(req, 'subject.create', 'subject', id, { name: data.name });
    res.status(201).json({ subject: serializeSubject(row) });
  })
);

router.get(
  '/lessons',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM lessons ORDER BY `date` DESC, title ASC');
    res.json({ lessons: rows.map(serializeLesson) });
  })
);

router.post(
  '/lessons',
  asyncHandler(async (req, res) => {
    const data = parseBody(lessonSchema, req.body);
    const id = newId('lsn');

    await execute(
      `INSERT INTO lessons (id, title, subject, \`class\`, \`date\`, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.subject, data.class, data.date, data.status, nowIso()]
    );

    const row = await queryOne('SELECT * FROM lessons WHERE id = ?', [id]);
    audit(req, 'lesson.create', 'lesson', id, { title: data.title });
    res.status(201).json({ lesson: serializeLesson(row) });
  })
);

router.get(
  '/assignments',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM assignments ORDER BY due_date ASC, title ASC');
    res.json({ assignments: rows.map(serializeAssignment) });
  })
);

router.post(
  '/assignments',
  asyncHandler(async (req, res) => {
    const data = parseBody(assignmentSchema, req.body);
    const id = newId('asg');

    await execute(
      `INSERT INTO assignments (id, title, subject, \`class\`, due_date, submitted, total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.subject, data.class, data.due, data.submitted, data.total, nowIso()]
    );

    const row = await queryOne('SELECT * FROM assignments WHERE id = ?', [id]);
    audit(req, 'assignment.create', 'assignment', id, { title: data.title });
    res.status(201).json({ assignment: serializeAssignment(row) });
  })
);

router.get(
  '/results',
  asyncHandler(async (req, res) => {
    const studentId = String(req.query.studentId || '').trim();
    const rows = studentId
      ? await query('SELECT * FROM results WHERE student_id = ? ORDER BY subject ASC', [studentId])
      : await query('SELECT * FROM results ORDER BY subject ASC');
    res.json({ results: rows.map(serializeResult) });
  })
);

router.post(
  '/results',
  asyncHandler(async (req, res) => {
    const data = parseBody(resultSchema, req.body);
    const student = await queryOne('SELECT * FROM students WHERE id = ?', [data.studentId]);
    if (!student) throw new AppError(404, 'Student not found.');

    const id = newId('res');
    await execute(
      `INSERT INTO results (id, student_id, subject, term, academic_year, marks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, student.id, data.subject, data.term, data.academicYear || null, data.marks, nowIso()]
    );

    const row = await queryOne('SELECT * FROM results WHERE id = ?', [id]);
    audit(req, 'result.create', 'result', id, { studentId: student.id, subject: data.subject });
    res.status(201).json({ result: serializeResult(row) });
  })
);

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const students = await query('SELECT * FROM students');
    const teachers = await queryOne('SELECT COUNT(*) AS count FROM teachers');

    const total = students.length;
    const attendance = total
      ? students.reduce((sum, row) => sum + Number(row.attendance), 0) / total
      : 0;
    const performance = total
      ? students.reduce((sum, row) => sum + Number(row.performance), 0) / total
      : 0;

    res.json({
      summary: {
        students: total,
        teachers: Number(teachers.count),
        atRisk: students.filter((row) => row.status === 'at-risk').length,
        dropped: students.filter((row) => row.status === 'dropped').length,
        averageAttendance: Math.round(attendance * 10) / 10,
        averagePerformance: Math.round(performance * 10) / 10,
      },
    });
  })
);

export default router;
