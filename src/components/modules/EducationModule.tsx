import { useState } from 'react';
import {
  GraduationCap, User, Presentation, School, BookOpen, BookMarked,
  Library, PenTool, HelpCircle, CalendarCheck, Files, TrendingUp,
  AlertTriangle, Mail, BarChart3, Plus, Search, CheckCircle,
  XCircle, UserPlus, Loader2, Download, Printer, MessageSquare,
  ClipboardCheck, Clock, FileText, LogOut, Table2, Trash2,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Badge, SectionHeader, SubModuleGrid, StatCard, ProgressBar, EmptyState, Button, Modal, FormField, Input, Select, InfoModal } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useApiList, useApiQuery } from '@/lib/hooks';
import type { AbsenceResult, AttendanceRecord, BulkAttendanceResult, LeaveSchoolResult, Lesson, Result, School as SchoolRecord, Student } from '@/types';

const subModules = [
  { id: 'students', label: 'Students', icon: <User className="w-5 h-5" />, description: 'Profiles, records, and class assignment' },
  { id: 'teachers', label: 'Teachers', icon: <Presentation className="w-5 h-5" />, description: 'Profiles, subjects, and assigned classes' },
  { id: 'schools', label: 'Schools', icon: <School className="w-5 h-5" />, description: 'School information and administration' },
  { id: 'classes', label: 'Classes', icon: <BookOpen className="w-5 h-5" />, description: 'Class management and scheduling' },
  { id: 'subjects', label: 'Subjects', icon: <BookMarked className="w-5 h-5" />, description: 'Subject catalog and curriculum' },
  { id: 'lessons', label: 'Lessons', icon: <Library className="w-5 h-5" />, description: 'Learning materials and activities' },
  { id: 'assignments', label: 'Assignments', icon: <PenTool className="w-5 h-5" />, description: 'Create and track assignments' },
  { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle className="w-5 h-5" />, description: 'Interactive quizzes and tests' },
  { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-5 h-5" />, description: 'Track student attendance' },
  { id: 'records', label: 'Academic Records', icon: <Files className="w-5 h-5" />, description: 'Grades and academic history' },
  { id: 'progress', label: 'Student Progress', icon: <TrendingUp className="w-5 h-5" />, description: 'Performance tracking and analytics' },
  { id: 'dropout', label: 'Dropout Monitoring', icon: <AlertTriangle className="w-5 h-5" />, description: 'Students needing attention' },
  { id: 'parent-comm', label: 'Parent Communication', icon: <Mail className="w-5 h-5" />, description: 'SMS, announcements, meetings' },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, description: 'Performance and attendance reports' },
];

const studentStatusConfig: Record<Student['status'], { label: string; variant: 'success' | 'warning' | 'error' }> = {
  active: { label: 'Active', variant: 'success' },
  'at-risk': { label: 'At Risk', variant: 'warning' },
  dropped: { label: 'Dropped', variant: 'error' },
};

const attendanceStatusConfig: Record<
  AttendanceRecord['status'],
  { label: string; variant: 'success' | 'error' | 'warning' | 'info'; icon: React.ReactNode }
> = {
  present: { label: 'Present', variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
  absent: { label: 'Absent', variant: 'error', icon: <XCircle className="w-3 h-3" /> },
  late: { label: 'Late', variant: 'warning', icon: <Clock className="w-3 h-3" /> },
  excused: { label: 'Excused', variant: 'info', icon: <FileText className="w-3 h-3" /> },
};

function gradeForScore(score: number) {
  return score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'E';
}

function gradeVariantFor(grade: string): 'success' | 'warning' | 'error' {
  return grade === 'A' || grade === 'B' ? 'success' : grade === 'C' || grade === 'D' ? 'warning' : 'error';
}

function averageOfResults(rows: Result[]) {
  if (rows.length === 0) return null;
  return Math.round((rows.reduce((total, row) => total + row.marks, 0) / rows.length) * 10) / 10;
}

const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function EducationModule() {
  const { currentSection, navigate, user } = useApp();
  const canRecordAbsences = user?.role === 'teacher' || user?.role === 'admin';
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [addKind, setAddKind] = useState<AddKind | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [reportClass, setReportClass] = useState('all');
  const [reportStudent, setReportStudent] = useState<Student | null>(null);
  const [showAddResult, setShowAddResult] = useState(false);
  const [absenceStudent, setAbsenceStudent] = useState<Student | null>(null);
  const [showMakeAttendance, setShowMakeAttendance] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceNotice, setAttendanceNotice] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(todayIso());
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('all');
  const [attendanceSchoolFilter, setAttendanceSchoolFilter] = useState('all');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<'all' | AttendanceRecord['status']>('all');
  const [leaveStudent, setLeaveStudent] = useState<Student | null>(null);
  const [infoItem, setInfoItem] = useState<{ title: string; description: string; details?: React.ReactNode } | null>(null);
  const { data: students, refresh: refreshStudents } = useApiList(() =>
    api.education.students().then((result) => result.students)
  );
  const { data: teachers, refresh: refreshTeachers } = useApiList(() =>
    api.education.teachers().then((result) => result.teachers)
  );
  const { data: schools, refresh: refreshSchools } = useApiList(() =>
    api.education.schools().then((result) => result.schools)
  );
  const { data: classList, refresh: refreshClasses } = useApiList(() =>
    api.education.classes().then((result) => result.classes)
  );
  const { data: subjects, refresh: refreshSubjects } = useApiList(() =>
    api.education.subjects().then((result) => result.subjects)
  );
  const { data: lessons, refresh: refreshLessons } = useApiList(() =>
    api.education.lessons().then((result) => result.lessons)
  );
  const { data: assignments, refresh: refreshAssignments } = useApiList(() =>
    api.education.assignments().then((result) => result.assignments)
  );
  const { data: results, refresh: refreshResults } = useApiList(() =>
    api.education.results().then((result) => result.results)
  );
  const { data: absences, refresh: refreshAbsences } = useApiList(() =>
    api.education.absences().then((result) => result.absences)
  );
  const { data: attendance, refresh: refreshAttendance } = useApiList(() =>
    api.education.attendance().then((result) => result.attendance)
  );
  const { data: attendanceReport } = useApiQuery(
    () => api.education.attendanceReports({ class: reportClass === 'all' ? undefined : reportClass }),
    [reportClass, attendance]
  );
  const normalizedQuery = studentQuery.trim().toLowerCase();
  const visibleStudents = normalizedQuery
    ? students.filter((student) => student.name.toLowerCase().includes(normalizedQuery) || student.class.toLowerCase().includes(normalizedQuery))
    : students;
  const average = (values: number[]) =>
    values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;

  const recordAttendance = async (
    student: Student,
    status: AttendanceRecord['status'],
    date = attendanceDate || todayIso()
  ) => {
    setAttendanceSaving(student.id);
    setAttendanceError(null);
    setAttendanceNotice(null);
    try {
      await api.education.markAttendance(student.id, status, date);

      if (status === 'absent') {
        const alreadyNotified = absences.some(
          (record) => record.studentId === student.id && record.date === date
        );

        if (!alreadyNotified) {
          try {
            const result = await api.education.markAbsence(student.id, date);
            setAttendanceNotice(
              result.notified
                ? `${student.name} is absent. SMS sent to ${result.guardian?.name || 'the parent'}${result.guardianContact ? ` (${result.guardianContact})` : ''}.`
                : `${student.name} is absent. SMS saved, but no parent account is linked — share it with ${student.parentName || 'the parent'} directly.`
            );
          } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
              // the absence alert for today already exists
            } else if (err instanceof ApiError && err.status === 422) {
              setAttendanceError(
                `${student.name} is marked absent, but no SMS was sent: ${err.message}`
              );
            } else {
              setAttendanceError(
                err instanceof Error ? err.message : 'Could not send the absence SMS.'
              );
            }
          }
        }
      }

      await Promise.all([refreshAttendance(), refreshAbsences(), refreshStudents()]);
    } catch (err) {
      setAttendanceError(err instanceof Error ? err.message : 'Could not save attendance.');
    } finally {
      setAttendanceSaving(null);
    }
  };

  if (!currentSection) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Education"
          subtitle="Education Management & Learning Platform"
          icon={<GraduationCap className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddStudent(true)}>Add Student</Button>}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={students.length} icon={<User className="w-5 h-5" />} color="secondary" />
          <StatCard label="Teachers" value={teachers.length} icon={<Presentation className="w-5 h-5" />} color="primary" />
          <StatCard label="At-Risk Students" value={students.filter(s => s.status === 'at-risk').length} icon={<AlertTriangle className="w-5 h-5" />} color="warning" />
          <StatCard label="Avg Attendance" value={`${average(students.map(s => s.attendance))}%`} icon={<CalendarCheck className="w-5 h-5" />} color="success" />
        </div>

        <SubModuleGrid items={subModules} onSelect={(id) => navigate('education', id)} columns={3} />

        {/* At-risk alert */}
        <Card className="p-5 bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warning-800">Dropout Monitoring Alert</h3>
              <p className="text-sm text-warning-700 mt-0.5">
                {students.filter(s => s.status === 'at-risk').length} students are showing low attendance and performance. Review needed.
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('education', 'dropout')}>Review Students</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'students') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Students" subtitle="Manage student profiles and academic records" icon={<User className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddStudent(true)}>Add Student</Button>} />
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studentQuery}
              onChange={(event) => setStudentQuery(event.target.value)}
              placeholder="Search students by name or class..."
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <span className="text-xs text-neutral-400 whitespace-nowrap">{visibleStudents.length} of {students.length}</span>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Name</th>
                  <th className="text-left px-5 py-3 font-semibold">Class</th>
                  <th className="text-left px-5 py-3 font-semibold">Guardian</th>
                  <th className="text-left px-5 py-3 font-semibold">Attendance</th>
                  <th className="text-left px-5 py-3 font-semibold">Performance</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visibleStudents.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-neutral-400">
                    {students.length === 0 ? 'No students recorded yet.' : 'No students match your search.'}
                  </td></tr>
                )}
                {visibleStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50 transition-all">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 text-white flex items-center justify-center text-xs font-semibold">
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-neutral-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{s.class}</td>
                    <td className="px-5 py-3">
                      {s.parentName || s.parentPhone || s.parentEmail ? (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-neutral-700">{s.parentName || 'Parent / guardian'}</p>
                          <p className="text-xs text-neutral-500">{s.parentPhone || s.parentEmail}</p>
                          <Badge size="sm" variant={s.guardianLinked ? 'success' : 'warning'}>
                            {s.guardianLinked ? `Linked · ${s.guardianUserName}` : 'No parent account'}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16"><ProgressBar value={s.attendance} color={s.attendance >= 80 ? 'success' : s.attendance >= 60 ? 'warning' : 'error'} /></div>
                        <span className="text-xs text-neutral-600 font-medium">{s.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16"><ProgressBar value={s.performance} color={s.performance >= 80 ? 'success' : s.performance >= 60 ? 'warning' : 'error'} /></div>
                        <span className="text-xs text-neutral-600 font-medium">{s.performance}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={studentStatusConfig[s.status].variant}>{studentStatusConfig[s.status].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <AddPersonModal type="student" open={showAddStudent} onClose={() => setShowAddStudent(false)} onSaved={refreshStudents} />
      <AddPersonModal type="teacher" open={showAddTeacher} onClose={() => setShowAddTeacher(false)} onSaved={refreshTeachers} />
      </>
    );
  }

  if (currentSection === 'teachers') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Teachers" subtitle="Manage teacher profiles and assignments" icon={<Presentation className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddTeacher(true)}>Add Teacher</Button>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teachers.length === 0 && (
            <Card className="p-8 text-center text-sm text-neutral-500 sm:col-span-2">No teachers recorded yet.</Card>
          )}
          {teachers.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-semibold">
                  {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-800">{t.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {t.subjects.map((s) => <Badge key={s} variant="info" size="sm">{s}</Badge>)}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                    <span>Classes: {t.classes.join(', ')}</span>
                    <span>•</span>
                    <span>{t.students} students</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <AddPersonModal type="teacher" open={showAddTeacher} onClose={() => setShowAddTeacher(false)} onSaved={refreshTeachers} />
      <AddPersonModal type="student" open={showAddStudent} onClose={() => setShowAddStudent(false)} onSaved={refreshStudents} />
      </>
    );
  }

  if (currentSection === 'attendance') {
    const selectedDate = attendanceDate || todayIso();
    const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const recordsForDate = attendance.filter((record) => record.date === selectedDate);
    const attendanceByStudent = new Map(recordsForDate.map((record) => [record.studentId, record]));
    const alertsForDate = absences.filter((record) => record.date === selectedDate);
    const alertSentIds = new Set(alertsForDate.map((record) => record.studentId));
    const classOptions = Array.from(new Set(students.map((s) => s.class))).sort();
    const classStudents =
      attendanceClassFilter === 'all' ? students : students.filter((s) => s.class === attendanceClassFilter);
    const matchesFilters = (record?: AttendanceRecord) => {
      if (!record) return attendanceStatusFilter === 'all' && attendanceSchoolFilter === 'all';
      if (attendanceSchoolFilter !== 'all' && record.schoolId !== attendanceSchoolFilter) return false;
      if (attendanceStatusFilter !== 'all' && record.status !== attendanceStatusFilter) return false;
      return true;
    };
    const rollCallStudents = classStudents.filter((student) =>
      matchesFilters(attendanceByStudent.get(student.id))
    );
    const filteredRecords = recordsForDate.filter(
      (record) =>
        (attendanceClassFilter === 'all' || record.className === attendanceClassFilter) &&
        (attendanceSchoolFilter === 'all' || record.schoolId === attendanceSchoolFilter) &&
        (attendanceStatusFilter === 'all' || record.status === attendanceStatusFilter)
    );
    const countByStatus = (status: AttendanceRecord['status']) =>
      filteredRecords.filter((record) => record.status === status).length;
    const presentCount = countByStatus('present');
    const absentCount = countByStatus('absent');
    const lateCount = countByStatus('late');
    const excusedCount = countByStatus('excused');
    const unmarkedCount =
      attendanceStatusFilter === 'all' && attendanceSchoolFilter === 'all'
        ? classStudents.filter((student) => !attendanceByStudent.get(student.id)).length
        : 0;
    const notifiedToday = alertsForDate.filter((record) => record.guardianUserId).length;

    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Attendance" subtitle={`${selectedDate === todayIso() ? 'Today' : 'Selected day'} — ${dateLabel}`} icon={<CalendarCheck className="w-5 h-5" />}
          action={canRecordAbsences ? (
            <Button size="sm" icon={<ClipboardCheck className="w-4 h-4" />} onClick={() => setShowMakeAttendance(true)}>
              Make Attendance
            </Button>
          ) : undefined} />
        {!canRecordAbsences && (
          <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            You can view attendance records. Sign in as a teacher or administrator to mark students present, absent, late or excused.
          </div>
        )}
        {attendanceError && (
          <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">{attendanceError}</div>
        )}
        {attendanceNotice && (
          <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">{attendanceNotice}</div>
        )}
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <span className="block mb-1">Date</span>
              <Input
                type="date"
                value={selectedDate}
                max={todayIso()}
                onChange={(event) => setAttendanceDate(event.target.value || todayIso())}
                className="w-[175px]"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <span className="block mb-1">Class</span>
              <Select
                value={attendanceClassFilter}
                onChange={(event) => setAttendanceClassFilter(event.target.value)}
                className="w-[150px]"
              >
                <option value="all">All classes</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <span className="block mb-1">School</span>
              <Select
                value={attendanceSchoolFilter}
                onChange={(event) => setAttendanceSchoolFilter(event.target.value)}
                className="w-[190px]"
              >
                <option value="all">All schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <span className="block mb-1">Status</span>
              <Select
                value={attendanceStatusFilter}
                onChange={(event) => setAttendanceStatusFilter(event.target.value as 'all' | AttendanceRecord['status'])}
                className="w-[150px]"
              >
                <option value="all">All statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </Select>
            </label>
            <span className="text-xs text-neutral-400 pb-2 ml-auto">
              {filteredRecords.length} records · {unmarkedCount} not marked · {notifiedToday} parent SMS
            </span>
          </div>
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Present" value={presentCount} icon={<CheckCircle className="w-5 h-5" />} color="success" />
          <StatCard label="Absent" value={absentCount} icon={<XCircle className="w-5 h-5" />} color="error" />
          <StatCard label="Late" value={lateCount} icon={<Clock className="w-5 h-5" />} color="warning" />
          <StatCard label="Excused" value={excusedCount} icon={<FileText className="w-5 h-5" />} color="accent" />
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Student</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Remarks</th>
                  <th className="text-left px-5 py-3 font-semibold">School</th>
                  <th className="text-left px-5 py-3 font-semibold">Marked by</th>
                  {canRecordAbsences && <th className="text-right px-5 py-3 font-semibold">Mark attendance</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {students.length === 0 && (
                  <tr><td colSpan={canRecordAbsences ? 6 : 5} className="px-5 py-8 text-center text-neutral-400">No students recorded yet.</td></tr>
                )}
                {students.length > 0 && rollCallStudents.length === 0 && (
                  <tr><td colSpan={canRecordAbsences ? 6 : 5} className="px-5 py-8 text-center text-neutral-400">No students match these filters.</td></tr>
                )}
                {rollCallStudents.map((s) => {
                  const record = attendanceByStudent.get(s.id);
                  const saving = attendanceSaving === s.id;
                  const alertSent = alertSentIds.has(s.id);
                  const config = record ? attendanceStatusConfig[record.status] : null;
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-neutral-800">{s.name}</p>
                        <p className="text-xs text-neutral-400">Class {s.class} · {s.attendance}% overall</p>
                      </td>
                      <td className="px-5 py-3">
                        {config ? (
                          <Badge variant={config.variant}>{config.icon} {config.label}</Badge>
                        ) : (
                          <Badge variant="default">Not marked</Badge>
                        )}
                        {record?.status === 'absent' && alertSent && (
                          <p className="text-[11px] text-success-600 mt-1">Parent alerted</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-neutral-600 max-w-[220px]">
                        <span className="text-xs">{record?.remarks || '—'}</span>
                      </td>
                      <td className="px-5 py-3 text-neutral-600 text-xs">{record?.schoolName || '—'}</td>
                      <td className="px-5 py-3 text-neutral-600 text-xs">{record?.markedByName || '—'}</td>
                      {canRecordAbsences && (
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={
                                  record?.status === status
                                    ? status === 'absent'
                                      ? 'danger'
                                      : status === 'present'
                                        ? 'primary'
                                        : 'secondary'
                                    : 'outline'
                                }
                                disabled={saving}
                                onClick={() => void recordAttendance(s, status, selectedDate)}
                              >
                                {attendanceStatusConfig[status].label}
                              </Button>
                            ))}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={saving}
                              icon={<LogOut className="w-4 h-4" />}
                              onClick={() => setLeaveStudent(s)}
                            >
                              Left school
                            </Button>
                            {record?.status === 'absent' && !alertSent && (
                              <Button size="sm" variant="ghost" icon={<MessageSquare className="w-4 h-4" />} onClick={() => setAbsenceStudent(s)}>
                                SMS alert
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-semibold text-neutral-800 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-500" /> Absence &amp; leave SMS alerts
            </h3>
            <span className="text-xs text-neutral-400">{absences.length} recorded</span>
          </div>
          {absences.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No alerts yet. Mark a student absent or record an early departure to notify their parent or guardian.
            </p>
          ) : (
            <div className="space-y-3">
              {absences.slice(0, 6).map((record) => (
                <div key={record.id} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 rounded-xl border border-neutral-100 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-800">{record.studentName}</span>
                      <Badge size="sm" variant="default">{record.className}</Badge>
                      <Badge size="sm" variant={record.kind === 'leave' ? 'warning' : 'info'}>
                        {record.kind === 'leave' ? 'Left school' : 'Absent'}
                      </Badge>
                      <span className="text-xs text-neutral-400">{record.date}</span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">{record.sms}</p>
                    {record.remarks && <p className="text-xs text-neutral-400 mt-1">Remarks: {record.remarks}</p>}
                  </div>
                  <Badge variant={record.guardianUserId ? 'success' : 'warning'} size="sm">
                    {record.guardianUserId ? `To ${record.guardianName || 'parent'}` : 'No parent account'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <AbsenceAlertModal
        key={absenceStudent?.id ?? 'none'}
        student={absenceStudent}
        onClose={() => setAbsenceStudent(null)}
        onSent={() => { void refreshAbsences(); void refreshStudents(); }}
      />
      <MakeAttendanceModal
        key={showMakeAttendance ? 'make-attendance-open' : 'make-attendance-closed'}
        open={showMakeAttendance}
        students={students}
        attendance={attendance}
        schools={schools}
        onClose={() => setShowMakeAttendance(false)}
        onSaved={() => {
          void refreshAttendance();
          void refreshAbsences();
          void refreshStudents();
        }}
      />
      <LeaveSchoolModal
        key={leaveStudent?.id ?? 'none'}
        student={leaveStudent}
        onClose={() => setLeaveStudent(null)}
        onSent={() => { void refreshAbsences(); }}
      />
      </>
    );
  }

  if (currentSection === 'dropout') {
    const atRisk = students.filter(s => s.status !== 'active');
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Dropout Monitoring" subtitle="Students needing attention based on attendance and performance" icon={<AlertTriangle className="w-5 h-5" />} />
        <Card className="p-5 bg-warning-50 border-warning-200">
          <p className="text-sm text-warning-800">
            <span className="font-semibold">{atRisk.length} students</span> are flagged as at-risk or dropped. Please review and take appropriate action.
          </p>
        </Card>
        <div className="space-y-3">
          {atRisk.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-semibold">
                    {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 text-sm">{s.name}</h3>
                    <p className="text-xs text-neutral-500">Class {s.class}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-neutral-400">Attendance</p>
                    <p className={`font-bold text-sm ${s.attendance < 50 ? 'text-error-600' : 'text-warning-600'}`}>{s.attendance}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-400">Performance</p>
                    <p className={`font-bold text-sm ${s.performance < 50 ? 'text-error-600' : 'text-warning-600'}`}>{s.performance}%</p>
                  </div>
                  <Badge variant={studentStatusConfig[s.status].variant}>{studentStatusConfig[s.status].label}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentSection === 'parent-comm') {
    const todayKey = todayIso();
    const alertsToday = absences.filter((record) => record.date === todayKey);
    const linkedGuardians = students.filter((student) => student.guardianLinked).length;

    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Parent Communication" subtitle="Send notifications and manage parent engagement" icon={<Mail className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Attendance SMS', desc: 'Automatic SMS to parents when students are absent', icon: <Mail className="w-5 h-5" />, count: `${alertsToday.length} sent today` },
            { title: 'School Announcements', desc: 'Send announcements to all parents', icon: <Presentation className="w-5 h-5" />, count: '5 active' },
            { title: 'Meeting Notices', desc: 'Schedule and notify parents about meetings', icon: <CalendarCheck className="w-5 h-5" />, count: '2 upcoming' },
            { title: 'Progress Reports', desc: 'Share student progress with parents', icon: <TrendingUp className="w-5 h-5" />, count: '8 pending' },
            { title: 'Event Notifications', desc: 'Notify parents about school events', icon: <CalendarCheck className="w-5 h-5" />, count: '3 this week' },
            { title: 'Emergency Alerts', desc: 'Send urgent messages to parents', icon: <AlertTriangle className="w-5 h-5" />, count: 'Ready' },
          ].map((item, i) => (
            <Card
              key={i}
              hover
              className="p-5"
              onClick={() => setInfoItem({
                title: item.title,
                description: item.desc,
                details: item.title === 'Attendance SMS' ? (
                  <>
                    <p className="font-semibold">Current status: {item.count}</p>
                    <p className="mt-1">{linkedGuardians} of {students.length} students have a parent account linked by email or phone.</p>
                    {alertsToday.length > 0 ? (
                      <p className="mt-2 text-xs text-neutral-500">Latest: {alertsToday[0].studentName} — “{alertsToday[0].sms}”</p>
                    ) : (
                      <p className="mt-2 text-xs text-neutral-500">Open Attendance to mark a student absent and send the alert.</p>
                    )}
                  </>
                ) : (
                  <><p className="font-semibold">Current status: {item.count}</p><p className="mt-1">Open this service to review recipients, schedules, and delivery history.</p></>
                ),
              })}
            >
              <div className="w-11 h-11 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <h3 className="font-semibold text-neutral-800 text-sm">{item.title}</h3>
              <p className="text-xs text-neutral-500 mt-1">{item.desc}</p>
              <p className="text-xs text-primary-600 font-medium mt-3">{item.count}</p>
            </Card>
          ))}
        </div>
        <InfoModal item={infoItem} onClose={() => setInfoItem(null)} />
      </div>
    );
  }

  if (currentSection === 'reports') {
    const reportClasses = Array.from(new Set(students.map((s) => s.class))).sort();
    const reportStudents = reportClass === 'all' ? students : students.filter((s) => s.class === reportClass);
    const dailyLatest = attendanceReport ? attendanceReport.daily[attendanceReport.daily.length - 1] : null;
    const weeklyLatest = attendanceReport ? attendanceReport.weekly[attendanceReport.weekly.length - 1] : null;
    const monthlyLatest = attendanceReport ? attendanceReport.monthly[attendanceReport.monthly.length - 1] : null;

    const exportCsv = () => {
      const header = ['Name', 'Class', 'Attendance %', 'Performance %', 'Grade', 'Status'];
      const rows = reportStudents.map((s) => [
        s.name,
        s.class,
        String(s.attendance),
        String(s.performance),
        gradeForScore(s.performance),
        studentStatusConfig[s.status].label,
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ihuriro-report-${reportClass === 'all' ? 'all-classes' : reportClass}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    };

    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Reports" subtitle="Class reports, grades and printable report cards" icon={<BarChart3 className="w-5 h-5" />}
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" icon={<Download className="w-4 h-4" />} onClick={exportCsv}>Export CSV</Button>
              <Button size="sm" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>Print</Button>
            </div>
          } />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Avg Performance" value={`${average(reportStudents.map(s => s.performance))}%`} icon={<TrendingUp className="w-5 h-5" />} color="success" />
          <StatCard label="Avg Attendance" value={`${average(reportStudents.map(s => s.attendance))}%`} icon={<CalendarCheck className="w-5 h-5" />} color="primary" />
          <StatCard label="Active Students" value={reportStudents.filter(s => s.status === 'active').length} icon={<User className="w-5 h-5" />} color="accent" />
          <StatCard label="Need Attention" value={reportStudents.filter(s => s.status !== 'active').length} icon={<AlertTriangle className="w-5 h-5" />} color="warning" />
        </div>

        {attendanceReport && (
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-primary-500" /> Attendance reports
              </h3>
              <span className="text-xs text-neutral-400">
                {attendanceReport.from} → {attendanceReport.to} · {attendanceReport.totals.marked} records
                {reportClass !== 'all' ? ` · class ${reportClass}` : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Today', bucket: dailyLatest, hint: dailyLatest?.date || '' },
                {
                  label: 'This week',
                  bucket: weeklyLatest,
                  hint: weeklyLatest ? `${weeklyLatest.start} → ${weeklyLatest.end}` : '',
                },
                { label: 'This month', bucket: monthlyLatest, hint: monthlyLatest?.month || '' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-neutral-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{item.label}</p>
                  <p className="text-2xl font-bold text-neutral-800 mt-1">{item.bucket ? `${item.bucket.rate}%` : '—'}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{item.bucket ? `${item.bucket.marked} marked · ${item.hint}` : 'No records'}</p>
                  <div className="mt-2">
                    <ProgressBar
                      value={item.bucket?.rate || 0}
                      color={(item.bucket?.rate || 0) >= 80 ? 'success' : (item.bucket?.rate || 0) >= 60 ? 'warning' : 'error'}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="rounded-lg bg-success-50 px-3 py-2 text-success-700"><span className="font-bold text-base">{attendanceReport.totals.present}</span> present</div>
              <div className="rounded-lg bg-error-50 px-3 py-2 text-error-700"><span className="font-bold text-base">{attendanceReport.totals.absent}</span> absent</div>
              <div className="rounded-lg bg-warning-50 px-3 py-2 text-warning-700"><span className="font-bold text-base">{attendanceReport.totals.late}</span> late</div>
              <div className="rounded-lg bg-primary-50 px-3 py-2 text-primary-700"><span className="font-bold text-base">{attendanceReport.totals.excused}</span> excused</div>
            </div>
            {attendanceReport.byClass.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">By class</p>
                <div className="space-y-3">
                  {attendanceReport.byClass.map((row) => (
                    <div key={row.className}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-neutral-700">Class {row.className}</span>
                        <span className="text-neutral-500">
                          {row.rate}% · {row.marked} marked
                        </span>
                      </div>
                      <ProgressBar value={row.rate} color={row.rate >= 80 ? 'success' : row.rate >= 60 ? 'warning' : 'error'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-neutral-400 mt-4">
              Attendance rate counts Present + Late over all marked records; Excused is tracked separately.
            </p>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Class report</span>
            <Select value={reportClass} onChange={(event) => setReportClass(event.target.value)} className="max-w-[220px]">
              <option value="all">All classes</option>
              {reportClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </Select>
            <span className="text-xs text-neutral-400">{reportStudents.length} students</span>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Student</th>
                  <th className="text-left px-5 py-3 font-semibold">Class</th>
                  <th className="text-left px-5 py-3 font-semibold">Attendance</th>
                  <th className="text-left px-5 py-3 font-semibold">Performance</th>
                  <th className="text-left px-5 py-3 font-semibold">Grade</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-right px-5 py-3 font-semibold">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {reportStudents.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-neutral-400">No students in this class yet.</td></tr>
                )}
                {reportStudents.map((s) => {
                  const grade = gradeForScore(s.performance);
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3 font-medium text-neutral-800">{s.name}</td>
                      <td className="px-5 py-3 text-neutral-600">{s.class}</td>
                      <td className="px-5 py-3 text-neutral-600">{s.attendance}%</td>
                      <td className="px-5 py-3 text-neutral-600">{s.performance}%</td>
                      <td className="px-5 py-3"><Badge variant={gradeVariantFor(grade)}>{grade}</Badge></td>
                      <td className="px-5 py-3"><Badge variant={studentStatusConfig[s.status].variant}>{studentStatusConfig[s.status].label}</Badge></td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => setReportStudent(s)}>View</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">Class Performance Overview</h3>
          <div className="space-y-4">
            {reportClasses.length === 0 && <p className="text-sm text-neutral-400">No class data yet.</p>}
            {reportClasses.map((cls) => {
              const classStudents = students.filter(s => s.class === cls);
              const avg = classStudents.length > 0 ? Math.round(classStudents.reduce((a, s) => a + s.performance, 0) / classStudents.length) : 0;
              return (
                <div key={cls}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-neutral-700">Class {cls}</span>
                    <span className="text-neutral-500">{avg}% avg • {classStudents.length} students</span>
                  </div>
                  <ProgressBar value={avg} color={avg >= 75 ? 'success' : avg >= 50 ? 'warning' : 'error'} showLabel />
                </div>
              );
            })}
          </div>
        </Card>

        <p className="text-xs text-neutral-400">Grading scale: A ≥ 80% · B ≥ 70% · C ≥ 60% · D ≥ 50% · E below 50%.</p>
      </div>

      <AcademicReportModal
        student={reportStudent}
        students={students}
        results={results}
        onClose={() => setReportStudent(null)}
      />
      </>
    );
  }

  if (currentSection === 'schools') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Schools" subtitle="Manage school information and administration" icon={<School className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setAddKind('school')}>Add School</Button>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {schools.length === 0 && (
            <Card className="p-8 text-center text-sm text-neutral-500 sm:col-span-2">No schools recorded yet.</Card>
          )}
          {schools.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center flex-shrink-0">
                  <School className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-800">{s.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{s.level} • {s.district} District</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                    <span><User className="w-3 h-3 inline mr-1" />{s.students} students</span>
                    <span><Presentation className="w-3 h-3 inline mr-1" />{s.teachers} teachers</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <AddEducationModal kind="school" open={addKind === 'school'} onClose={() => setAddKind(null)} onSaved={refreshSchools} />
      </>
    );
  }

  if (currentSection === 'classes') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Classes" subtitle="Class management and scheduling" icon={<BookOpen className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setAddKind('class')}>Add Class</Button>} />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Class</th>
                  <th className="text-left px-5 py-3 font-semibold">Teacher</th>
                  <th className="text-left px-5 py-3 font-semibold">Students</th>
                  <th className="text-left px-5 py-3 font-semibold">Room</th>
                  <th className="text-left px-5 py-3 font-semibold">Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {classList.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-400">No classes recorded yet.</td></tr>
                )}
                {classList.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-semibold text-neutral-800">{c.name}</td>
                    <td className="px-5 py-3 text-neutral-600">{c.teacher}</td>
                    <td className="px-5 py-3 text-neutral-600">{c.students}</td>
                    <td className="px-5 py-3 text-neutral-600">{c.room || '—'}</td>
                    <td className="px-5 py-3 text-neutral-600">{c.subjects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <ClassListModal open={addKind === 'class'} onClose={() => setAddKind(null)} onSaved={refreshClasses} />
      </>
    );
  }

  if (currentSection === 'subjects') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Subjects" subtitle="Subject catalog and curriculum" icon={<BookMarked className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setAddKind('subject')}>Add Subject</Button>} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.length === 0 && (
            <Card className="p-8 text-center text-sm text-neutral-500 sm:col-span-2 lg:col-span-3">No subjects recorded yet.</Card>
          )}
          {subjects.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 text-sm">{s.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1">Teacher: {s.teacher || 'Unassigned'}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.classes.map((c) => <Badge key={c} variant="info" size="sm">{c}</Badge>)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <AddEducationModal kind="subject" open={addKind === 'subject'} onClose={() => setAddKind(null)} onSaved={refreshSubjects} />
      </>
    );
  }

  if (currentSection === 'lessons') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Lessons" subtitle="Learning materials and scheduled lessons" icon={<Library className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setAddKind('lesson')}>Add Lesson</Button>} />
        <div className="space-y-3">
          {lessons.length === 0 && (
            <Card className="p-8 text-center text-sm text-neutral-500">No lessons recorded yet.</Card>
          )}
          {lessons.map((l) => (
            <Card key={l.id} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-neutral-800 text-sm">{l.title}</h3>
                    <Badge variant={l.status === 'completed' ? 'success' : l.status === 'cancelled' ? 'error' : 'info'} size="sm">{l.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>{l.subject}</span>
                    <span>Class {l.class}</span>
                    <span>{l.date}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInfoItem({
                    title: l.title,
                    description: `${l.subject} lesson for Class ${l.class}. Scheduled for ${l.date}.`,
                    details: <p>Status: <span className="font-semibold capitalize">{l.status}</span>. Use this lesson to review learning materials and classroom activity.</p>,
                  })}
                >View</Button>
              </div>
            </Card>
          ))}
        </div>
        <InfoModal item={infoItem} onClose={() => setInfoItem(null)} />
      </div>
      <AddEducationModal kind="lesson" open={addKind === 'lesson'} onClose={() => setAddKind(null)} onSaved={refreshLessons} />
      </>
    );
  }

  if (currentSection === 'assignments') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Assignments" subtitle="Create and track student assignments" icon={<PenTool className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setAddKind('assignment')}>Add Assignment</Button>} />
        <div className="space-y-3">
          {assignments.length === 0 && (
            <Card className="p-8 text-center text-sm text-neutral-500">No assignments recorded yet.</Card>
          )}
          {assignments.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-800 text-sm">{a.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2">
                    <span>{a.subject}</span>
                    <span>Class {a.class}</span>
                    <span>Due: {a.due}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-24"><ProgressBar value={a.total > 0 ? (a.submitted / a.total) * 100 : 0} color="primary" /></div>
                    <span className="text-xs text-neutral-500">{a.submitted}/{a.total} submitted</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInfoItem({
                    title: a.title,
                    description: `${a.subject} assignment for Class ${a.class}, due ${a.due}.`,
                    details: <p><span className="font-semibold">{a.submitted} of {a.total}</span> students have submitted this assignment.</p>,
                  })}
                >Review</Button>
              </div>
            </Card>
          ))}
        </div>
        <InfoModal item={infoItem} onClose={() => setInfoItem(null)} />
      </div>
      <AddEducationModal kind="assignment" open={addKind === 'assignment'} onClose={() => setAddKind(null)} onSaved={refreshAssignments} />
      </>
    );
  }

  if (currentSection === 'records') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-start">
          <img
            src="/education/ministry-of-education.png"
            alt="Republic of Rwanda — Ministry of Education"
            className="h-20 w-auto"
          />
        </div>
        <SectionHeader title="Academic Records" subtitle="Subject marks, averages and report cards" icon={<Files className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddResult(true)}>Add Marks</Button>} />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Student</th>
                  <th className="text-left px-5 py-3 font-semibold">Class</th>
                  <th className="text-left px-5 py-3 font-semibold">Subjects</th>
                  <th className="text-left px-5 py-3 font-semibold">Average</th>
                  <th className="text-left px-5 py-3 font-semibold">Grade</th>
                  <th className="text-right px-5 py-3 font-semibold">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {students.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-neutral-400">No students recorded yet.</td></tr>
                )}
                {students.map((s) => {
                  const own = results.filter((row) => row.studentId === s.id);
                  const avg = averageOfResults(own);
                  const grade = avg === null ? null : gradeForScore(avg);
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3 font-medium text-neutral-800">{s.name}</td>
                      <td className="px-5 py-3 text-neutral-600">{s.class}</td>
                      <td className="px-5 py-3 text-neutral-600">{own.length} recorded</td>
                      <td className="px-5 py-3 font-semibold text-neutral-800">{avg === null ? '—' : `${avg}%`}</td>
                      <td className="px-5 py-3">
                        {grade ? <Badge variant={gradeVariantFor(grade)}>{grade}</Badge> : <span className="text-xs text-neutral-400">No marks</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => setReportStudent(s)}>View</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-xs text-neutral-400">Marks are entered per subject and combined into the student's average, grade and class position.</p>
      </div>
      <AcademicReportModal
        student={reportStudent}
        students={students}
        results={results}
        onClose={() => setReportStudent(null)}
      />
      <AddResultModal
        open={showAddResult}
        students={students}
        subjects={subjects}
        onClose={() => setShowAddResult(false)}
        onSaved={refreshResults}
      />
      </>
    );
  }

  if (currentSection === 'progress') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Student Progress" subtitle="Performance tracking and analytics" icon={<TrendingUp className="w-5 h-5" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Top Performers" value={students.filter(s => s.performance >= 80).length} icon={<CheckCircle className="w-5 h-5" />} color="success" />
          <StatCard label="Improving" value={students.filter(s => s.performance >= 60 && s.performance < 80).length} icon={<TrendingUp className="w-5 h-5" />} color="primary" />
          <StatCard label="Need Support" value={students.filter(s => s.performance < 60).length} icon={<AlertTriangle className="w-5 h-5" />} color="warning" />
          <StatCard label="Avg Performance" value={`${average(students.map(s => s.performance))}%`} icon={<BarChart3 className="w-5 h-5" />} color="accent" />
        </div>
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">Student Performance Breakdown</h3>
          <div className="space-y-4">
            {students.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-neutral-700">{s.name}</span>
                  <span className="text-neutral-500">Class {s.class} • {s.performance}%</span>
                </div>
                <ProgressBar value={s.performance} color={s.performance >= 80 ? 'success' : s.performance >= 60 ? 'warning' : 'error'} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'quizzes') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Quizzes" subtitle="Interactive quizzes and tests" icon={<HelpCircle className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setInfoItem({ title: 'Create Quiz', description: 'Quizzes are managed in Learn Rwanda, where learners can test their knowledge of Rwanda history, civics, and culture.', details: <p>Select <span className="font-semibold">Go to Quizzes</span> below to open the available quiz library.</p> })}>Create Quiz</Button>} />
        <Card className="p-5 bg-secondary-50 border-secondary-100">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-secondary-700">
              Interactive quizzes are available in the <span className="font-semibold">Learn Rwanda</span> module. Visit it to test your knowledge of Rwanda's history, civics, and culture with 70 questions.
            </p>
          </div>
        </Card>
        <Button onClick={() => navigate('learnrwanda', 'quizzes')}>Go to Quizzes</Button>
        <InfoModal item={infoItem} onClose={() => setInfoItem(null)} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <EmptyState
        icon={<BookOpen className="w-8 h-8" />}
        title="Section Coming Soon"
        description="This education section is being developed with full functionality."
      />
    </div>
  );
}

const alertReasonConfig: Record<
  BulkAttendanceResult['alerts'][number]['reason'],
  { label: string; variant: 'default' | 'success' | 'warning' }
> = {
  notified: { label: 'SMS sent · parent notified', variant: 'success' },
  saved: { label: 'SMS saved · no linked parent account', variant: 'warning' },
  'no-contact': { label: 'No guardian phone or email', variant: 'warning' },
  'already-notified': { label: 'Already notified today', variant: 'default' },
};

function MakeAttendanceModal({
  open,
  students,
  attendance,
  schools,
  onClose,
  onSaved,
}: {
  open: boolean;
  students: Student[];
  attendance: AttendanceRecord[];
  schools: SchoolRecord[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(todayIso());
  const [overrides, setOverrides] = useState<Record<string, AttendanceRecord['status']>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [schoolId, setSchoolId] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkAttendanceResult | null>(null);

  if (!open) return null;

  const classes = Array.from(new Set(students.map((student) => student.class))).sort();
  const normalizedQuery = query.trim().toLowerCase();
  const visibleStudents = students.filter((student) => {
    if (classFilter !== 'all' && student.class !== classFilter) return false;
    if (!normalizedQuery) return true;
    return (
      student.name.toLowerCase().includes(normalizedQuery) ||
      student.class.toLowerCase().includes(normalizedQuery)
    );
  });

  const recorded = (studentId: string) =>
    attendance.find((row) => row.studentId === studentId && row.date === date);
  const recordedStatus = (studentId: string) => recorded(studentId)?.status;

  const statusFor = (student: Student): AttendanceRecord['status'] =>
    overrides[student.id] ?? recordedStatus(student.id) ?? 'present';

  const setStatus = (studentId: string, status: AttendanceRecord['status']) =>
    setOverrides((current) => ({ ...current, [studentId]: status }));

  const markAll = (status: AttendanceRecord['status']) => {
    const next: Record<string, AttendanceRecord['status']> = {};
    for (const student of students) next[student.id] = status;
    setOverrides(next);
  };

  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const student of students) counts[statusFor(student)] += 1;
  const missingContact = students.filter(
    (student) => statusFor(student) === 'absent' && !student.parentPhone && !student.parentEmail
  ).length;

  const changeDate = (next: string) => {
    setDate(next || todayIso());
    setOverrides({});
    setRemarks({});
    setResult(null);
    setError(null);
  };

  const save = async () => {
    if (students.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const response = await api.education.saveAttendance(
        students.map((student) => ({
          studentId: student.id,
          status: statusFor(student),
          remarks: (remarks[student.id] ?? recorded(student.id)?.remarks ?? '').trim() || undefined,
        })),
        date,
        schoolId || undefined
      );
      setResult(response);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={result ? 'Attendance saved' : 'Make Attendance'}
      subtitle={result ? result.date : `${date} • ${students.length} students`}
      icon={<ClipboardCheck className="w-5 h-5" />}
      footer={
        result ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              onClick={save}
              disabled={saving || students.length === 0}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            >
              {saving ? 'Saving…' : 'Save attendance'}
            </Button>
          </>
        )
      }
    >
      {error && <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{error}</div>}
      {result ? (
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-success-200 bg-success-50 p-3">
            <p className="font-semibold text-success-800">Attendance saved for {result.date}</p>
            <p className="text-xs text-success-700 mt-1">
              {result.present} present · {result.absent} absent · {result.late} late · {result.excused} excused · {result.smsSent} absence SMS recorded
            </p>
          </div>
          {result.alerts.length === 0 ? (
            <p className="text-neutral-600">No students were marked absent, so no SMS was needed.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {result.alerts.map((alert) => {
                const config = alertReasonConfig[alert.reason];
                return (
                  <div key={alert.studentId} className="rounded-xl border border-neutral-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-neutral-800">{alert.studentName}</p>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {alert.contact
                        ? `${alert.guardianName || 'Parent / guardian'} · ${alert.contact}`
                        : `Class ${alert.className}`}
                    </p>
                    {alert.sms && <p className="text-xs text-neutral-600 mt-1">{alert.sms}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600">
            Choose Present, Absent, Late or Excused for each student, then add remarks where needed.
            When a student is marked absent, an SMS is sent automatically to their parent or guardian.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Attendance date">
              <Input type="date" value={date} max={todayIso()} onChange={(event) => changeDate(event.target.value)} />
            </FormField>
            <FormField label="School">
              <Select value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>
                <option value="">No school selected</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search students..."
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="sm:max-w-[170px]">
              <option value="all">All classes</option>
              {classes.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => markAll('present')}>All present</Button>
              <Button size="sm" variant="ghost" onClick={() => markAll('absent')}>All absent</Button>
            </div>
            <span className="text-xs text-neutral-400">{visibleStudents.length} of {students.length}</span>
          </div>
          <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
            {visibleStudents.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-6">No students match this filter.</p>
            )}
            {visibleStudents.map((student) => {
              const status = statusFor(student);
              const hasContact = Boolean(student.parentPhone || student.parentEmail);
              return (
                <div key={student.id} className="rounded-xl border border-neutral-100 px-3 py-2 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{student.name}</p>
                      <p className={`text-xs ${status === 'absent' && !hasContact ? 'text-warning-600' : 'text-neutral-400'}`}>
                        Class {student.class}
                        {status === 'absent' && (hasContact ? ' · SMS to guardian' : ' · no guardian contact')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                      {(['present', 'absent', 'late', 'excused'] as const).map((option) => (
                        <Button
                          key={option}
                          size="sm"
                          variant={
                            status === option
                              ? option === 'absent'
                                ? 'danger'
                                : option === 'present'
                                  ? 'primary'
                                  : 'secondary'
                              : 'outline'
                          }
                          onClick={() => setStatus(student.id, option)}
                        >
                          {attendanceStatusConfig[option].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Input
                    value={remarks[student.id] ?? recorded(student.id)?.remarks ?? ''}
                    onChange={(event) =>
                      setRemarks((current) => ({ ...current, [student.id]: event.target.value }))
                    }
                    placeholder="Remarks (optional)"
                    className="text-xs"
                  />
                </div>
              );
            })}
          </div>
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
            <span><span className="font-semibold text-success-600">{counts.present}</span> present</span>
            <span><span className="font-semibold text-error-600">{counts.absent}</span> absent</span>
            <span><span className="font-semibold text-warning-600">{counts.late}</span> late</span>
            <span><span className="font-semibold text-primary-600">{counts.excused}</span> excused</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{counts.absent} absence SMS</span>
          </div>
          {missingContact > 0 && (
            <div className="rounded-lg bg-warning-50 border border-warning-200 px-3 py-2 text-xs text-warning-800">
              {missingContact} absent {missingContact === 1 ? 'student has' : 'students have'} no guardian phone or
              email, so no SMS will be sent for them.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function AbsenceAlertModal({
  student,
  onClose,
  onSent,
}: {
  student: Student | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AbsenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!student) return null;

  const contact = student.parentPhone || student.parentEmail || '';
  const linked = Boolean(student.guardianLinked);

  const send = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await api.education.markAbsence(student.id, todayIso());
      setResult(response);
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the absence alert.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={result ? 'Absence alert sent' : 'Mark student absent'}
      subtitle={`${student.name} • Class ${student.class}`}
      icon={result ? <CheckCircle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      footer={
        result ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={send}
              disabled={saving || !contact}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            >
              {saving ? 'Sending…' : 'Send SMS alert'}
            </Button>
          </>
        )
      }
    >
      {error && <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{error}</div>}
      {result ? (
        <div className="space-y-4 text-sm">
          <div className={`rounded-xl border p-3 ${result.notified ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'}`}>
            <p className={`font-semibold ${result.notified ? 'text-success-800' : 'text-warning-800'}`}>
              {result.notified ? 'Parent notified in IHURIRO' : 'Alert saved — no linked parent account'}
            </p>
            <p className={`text-xs mt-1 ${result.notified ? 'text-success-700' : 'text-warning-700'}`}>
              {result.notified
                ? `${result.guardian?.name || 'The parent'} sees it under Notifications → School (via sms).`
                : 'Share this message with the parent directly until they register with this contact.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-neutral-400">Sent to</p>
              <p className="font-medium text-neutral-800">{result.guardian?.name || student.parentName || 'Parent / guardian'}</p>
              <p className="text-xs text-neutral-500">{result.guardianContact}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Channel</p>
              <p className="font-medium text-neutral-800">SMS · {result.smsSource === 'anthropic' ? 'AI generated' : 'Template'}</p>
              <p className="text-xs text-neutral-500">{result.absence.date}</p>
            </div>
          </div>
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
            <p className="text-xs text-neutral-400 mb-1">SMS message</p>
            <p className="text-sm text-neutral-800">{result.sms}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600">
            Mark {student.name} absent today and send a short SMS to the parent or guardian. The message is AI generated when an AI key is configured, otherwise a built-in template is used.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-neutral-400">Guardian contact</p>
              <p className="font-medium text-neutral-800">{contact || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Parent account</p>
              <Badge variant={linked ? 'success' : 'warning'}>{linked ? `Linked · ${student.guardianUserName}` : 'Not linked'}</Badge>
            </div>
          </div>
          {!contact && (
            <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 text-xs text-warning-800">
              This student has no guardian phone or email. Add one when creating the student profile first.
            </div>
          )}
          {contact && !linked && (
            <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 text-xs text-warning-800">
              No parent account matches this contact yet. The SMS is saved in the absence log, but it only appears in Notifications once a parent registers with this email or phone.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

type AddPersonType = 'student' | 'teacher';

function LeaveSchoolModal({
  student,
  onClose,
  onSent,
}: {
  student: Student | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<LeaveSchoolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!student) return null;

  const contact = student.parentPhone || student.parentEmail || '';
  const linked = Boolean(student.guardianLinked);

  const send = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await api.education.leaveSchool(student.id, {
        date: todayIso(),
        reason: reason.trim() || undefined,
      });
      setResult(response);
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the leave alert.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={result ? 'Leave alert sent' : 'Student left school'}
      subtitle={`${student.name} • Class ${student.class}`}
      icon={result ? <CheckCircle className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
      footer={
        result ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={send}
              disabled={saving || !contact}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            >
              {saving ? 'Sending…' : 'Notify parent'}
            </Button>
          </>
        )
      }
    >
      {error && <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{error}</div>}
      {result ? (
        <div className="space-y-3 text-sm">
          <div className={`rounded-xl border p-3 ${result.notified ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'}`}>
            <p className={`font-semibold ${result.notified ? 'text-success-800' : 'text-warning-800'}`}>
              {result.notified ? 'Parent notified in IHURIRO' : 'Alert saved — no linked parent account'}
            </p>
            <p className={`text-xs mt-1 ${result.notified ? 'text-success-700' : 'text-warning-700'}`}>
              Sent to {result.guardian?.name || student.parentName || 'parent / guardian'}
              {result.guardianContact ? ` · ${result.guardianContact}` : ''}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
            <p className="text-xs text-neutral-400 mb-1">SMS message</p>
            <p className="text-sm text-neutral-800">{result.sms}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="text-neutral-600">
            Record that {student.name} left school early today and send the parent or guardian an SMS.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-neutral-400">Guardian contact</p>
              <p className="font-medium text-neutral-800">{contact || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Parent account</p>
              <Badge variant={linked ? 'success' : 'warning'}>{linked ? `Linked · ${student.guardianUserName}` : 'Not linked'}</Badge>
            </div>
          </div>
          <FormField label="Reason (optional)">
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Medical appointment"
              maxLength={255}
            />
          </FormField>
          {!contact && (
            <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 text-xs text-warning-800">
              This student has no guardian phone or email, so no SMS can be sent.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

type StudentDraft = {
  rowId: string;
  name: string;
  class: string;
  dateOfBirth: string;
  gender: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
};

const blankStudentRow = (): StudentDraft => ({
  rowId: Math.random().toString(36).slice(2),
  name: '',
  class: '',
  dateOfBirth: '',
  gender: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
});

const studentDraftColumns: { key: keyof Omit<StudentDraft, 'rowId'>; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Full name', placeholder: 'Grace Uwase' },
  { key: 'class', label: 'Class', placeholder: 'P6A' },
  { key: 'dateOfBirth', label: 'Date of birth', placeholder: '2012-05-14' },
  { key: 'gender', label: 'Gender', placeholder: 'female' },
  { key: 'parentName', label: 'Parent name', placeholder: 'Eric Mugisha' },
  { key: 'parentPhone', label: 'Parent phone', placeholder: '+250 788 123 456' },
  { key: 'parentEmail', label: 'Parent email', placeholder: 'parent@example.rw' },
];

function AddPersonModal({ type, open, onClose, onSaved }: { type: AddPersonType; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formParentEmail, setFormParentEmail] = useState('');
  const [formSubjects, setFormSubjects] = useState('');
  const [formClasses, setFormClasses] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [studentRows, setStudentRows] = useState<StudentDraft[]>(() => Array.from({ length: 6 }, blankStudentRow));
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: string[] } | null>(null);
  if (!open) return null;

  const isStudent = type === 'student';
  const title = isStudent ? 'Add New Student' : 'Add New Teacher';
  const subtitle = isStudent ? 'Create one student or paste a whole student list' : 'Create a new teacher profile';
  const icon = isStudent ? <UserPlus className="w-5 h-5" /> : <Presentation className="w-5 h-5" />;
  const submitLabel = isStudent ? 'Add Student' : 'Add Teacher';
  const filledStudentRows = studentRows.filter((row) => row.name.trim());

  const updateStudentRow = (rowId: string, key: keyof Omit<StudentDraft, 'rowId'>, value: string) =>
    setStudentRows((current) => current.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row)));
  const addStudentRow = () => setStudentRows((current) => [...current, blankStudentRow()]);
  const removeStudentRow = (rowId: string) =>
    setStudentRows((current) => (current.length <= 1 ? [blankStudentRow()] : current.filter((row) => row.rowId !== rowId)));
  const clearStudentRows = () => setStudentRows(Array.from({ length: 6 }, blankStudentRow));

  const handleStudentPaste = (event: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    const text = event.clipboardData.getData('text/plain');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;
    event.preventDefault();
    const lines = text.replace(/\r/g, '').split('\n').filter((line) => line.trim() !== '');
    setStudentRows((current) => {
      const next = current.map((row) => ({ ...row }));
      lines.forEach((line, lineOffset) => {
        while (next.length <= rowIndex + lineOffset) next.push(blankStudentRow());
        line.split('\t').forEach((cell, cellOffset) => {
          const column = studentDraftColumns[colIndex + cellOffset];
          if (column) next[rowIndex + lineOffset][column.key] = cell.trim();
        });
      });
      return next;
    });
  };

  const saveStudentList = async () => {
    if (filledStudentRows.length === 0) {
      setSaveError('Add at least one student name.');
      return;
    }
    const missingClass = studentRows.findIndex((row) => row.name.trim() && !row.class.trim());
    if (missingClass !== -1) {
      setSaveError(`Row ${missingClass + 1}: enter the class.`);
      return;
    }
    const invalidEmail = studentRows.findIndex(
      (row) => row.name.trim() && row.parentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.parentEmail.trim())
    );
    if (invalidEmail !== -1) {
      setSaveError(`Row ${invalidEmail + 1}: enter a valid guardian email.`);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await api.education.createStudentsBulk({
        students: filledStudentRows.map((row) => ({
          name: row.name.trim(),
          class: row.class.trim(),
          dateOfBirth: row.dateOfBirth.trim(),
          gender: ['male', 'female'].includes(row.gender.trim().toLowerCase()) ? row.gender.trim().toLowerCase() : '',
          parentName: row.parentName.trim(),
          parentPhone: row.parentPhone.trim(),
          parentEmail: row.parentEmail.trim(),
        })),
      });
      await onSaved();
      setBulkResult({ created: response.created.length, skipped: response.skipped });
      setSubmitted(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save the student list.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setSaveError('Full name is required');
      return;
    }

    const subjectList = formSubjects.split(',').map((value) => value.trim()).filter(Boolean);
    const classList = formClasses.split(',').map((value) => value.trim()).filter(Boolean);

    if (isStudent && !formClass) {
      setSaveError('Choose a class for the student.');
      return;
    }
    if (isStudent && formParentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formParentEmail.trim())) {
      setSaveError('Enter a valid guardian email address.');
      return;
    }
    if (!isStudent && (subjectList.length === 0 || classList.length === 0)) {
      setSaveError('Add at least one subject and one assigned class.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      if (isStudent) {
        await api.education.createStudent({
          name: formName.trim(),
          class: formClass,
          dateOfBirth: formDob || '',
          gender: formGender === 'male' || formGender === 'female' ? formGender : '',
          academicYear: formYear.trim() || '',
          parentName: formParentName.trim() || '',
          parentPhone: formParentPhone.trim() || '',
          parentEmail: formParentEmail.trim() || '',
        });
      } else {
        await api.education.createTeacher({
          name: formName.trim(),
          subjects: subjectList,
          classes: classList,
          phone: formPhone.trim() || '',
          email: formEmail.trim() || '',
        });
      }
      await onSaved();
      setSubmitted(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormDob(''); setFormGender(''); setFormClass('');
    setFormYear(''); setFormParentName(''); setFormParentPhone(''); setFormParentEmail('');
    setFormSubjects(''); setFormClasses(''); setFormPhone(''); setFormEmail('');
    setMode('single'); setStudentRows(Array.from({ length: 6 }, blankStudentRow)); setBulkResult(null);
    setSaveError(null); setSubmitted(false);
  };

  if (submitted) {
    return (
      <Modal
        open={open}
        onClose={() => { resetForm(); onClose(); }}
        title="Success"
        subtitle="The profile has been created"
        icon={<CheckCircle className="w-5 h-5" />}
        footer={<Button onClick={() => { resetForm(); onClose(); }}>Done</Button>}
      >
        {bulkResult ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-success-200 bg-success-50 p-3">
              <p className="font-semibold text-success-800">
                {bulkResult.created} {bulkResult.created === 1 ? 'student was' : 'students were'} added.
              </p>
            </div>
            {bulkResult.skipped.length > 0 && (
              <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-warning-800">
                <p className="font-medium">Skipped — already in that class:</p>
                <p className="mt-1 text-xs">{bulkResult.skipped.join(', ')}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-600">The {isStudent ? 'student' : 'teacher'} has been added successfully.</p>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => { resetForm(); onClose(); }}
      title={title}
      subtitle={subtitle}
      icon={icon}
      wide={isStudent && mode === 'bulk'}
      footer={
        <>
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
          {isStudent && mode === 'bulk' ? (
            <Button onClick={saveStudentList} disabled={saving || filledStudentRows.length === 0}>
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : `Save ${filledStudentRows.length || ''} ${filledStudentRows.length === 1 ? 'student' : 'students'}`.trim()}
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
            </Button>
          )}
        </>
      }
    >
      {saveError && <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{saveError}</div>}
      {isStudent && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => { setMode('single'); setSaveError(null); }}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              mode === 'single' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Single student
          </button>
          <button
            type="button"
            onClick={() => { setMode('bulk'); setSaveError(null); }}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              mode === 'bulk' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Table2 className="w-4 h-4" /> Excel list
          </button>
        </div>
      )}
      {isStudent && mode === 'bulk' ? (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">
            Type rows directly, or copy a range from Excel and paste it into any cell. Columns: Full name, Class, Date
            of birth, Gender, Parent name, Parent phone, Parent email.
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="w-9 border-b border-r border-neutral-200 px-1 py-2 text-xs font-semibold text-neutral-400">#</th>
                  {studentDraftColumns.map((column) => (
                    <th key={column.key} className="border-b border-r border-neutral-200 px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500 whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                  <th className="w-9 border-b border-neutral-200 px-1 py-2" />
                </tr>
              </thead>
              <tbody>
                {studentRows.map((row, rowIndex) => (
                  <tr key={row.rowId} className={rowIndex % 2 === 1 ? 'bg-neutral-50/60' : 'bg-white'}>
                    <td className="border-b border-r border-neutral-200 px-1 py-1 text-center text-xs text-neutral-400">{rowIndex + 1}</td>
                    {studentDraftColumns.map((column, colIndex) => (
                      <td key={column.key} className="border-b border-r border-neutral-200 p-0">
                        <input
                          value={row[column.key]}
                          onChange={(event) => updateStudentRow(row.rowId, column.key, event.target.value)}
                          onPaste={(event) => handleStudentPaste(event, rowIndex, colIndex)}
                          placeholder={rowIndex === 0 ? column.placeholder : ''}
                          className="w-full min-w-[110px] bg-transparent px-2 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-300 focus:bg-primary-50/70"
                        />
                      </td>
                    ))}
                    <td className="border-b border-neutral-200 px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeStudentRow(row.rowId)}
                        title="Delete row"
                        className="w-6 h-6 rounded-md text-neutral-300 hover:text-error-600 hover:bg-error-50 inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={addStudentRow} icon={<Plus className="w-4 h-4" />}>Add row</Button>
              <Button size="sm" variant="ghost" onClick={clearStudentRows}>Clear</Button>
            </div>
            <span className="text-xs text-neutral-400">{filledStudentRows.length} of {studentRows.length} rows filled</span>
          </div>
        </div>
      ) : (
      <>
      <FormField label="Full Name">
        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={isStudent ? "e.g., Grace Uwase" : "e.g., Paul Kagame"} />
      </FormField>
      {isStudent && (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date of Birth">
            <Input type="date" value={formDob} onChange={(e) => setFormDob(e.target.value)} />
          </FormField>
          <FormField label="Gender">
            <Select value={formGender} onChange={(e) => setFormGender(e.target.value)}>
              <option value="" disabled>Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </FormField>
        </div>
      )}
      {isStudent ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Class">
              <Select value={formClass} onChange={(e) => setFormClass(e.target.value)}>
                <option value="" disabled>Select class</option>
                <option value="P4B">P4B</option>
                <option value="P5A">P5A</option>
                <option value="P6A">P6A</option>
                <option value="S1A">S1A</option>
                <option value="S2C">S2C</option>
                <option value="S3B">S3B</option>
              </Select>
            </FormField>
            <FormField label="Academic Year">
              <Input value={formYear} onChange={(e) => setFormYear(e.target.value)} placeholder="e.g., 2026" />
            </FormField>
          </div>
          <FormField label="Parent / Guardian Name">
            <Input value={formParentName} onChange={(e) => setFormParentName(e.target.value)} placeholder="e.g., Eric Mugisha" />
          </FormField>
          <FormField label="Parent Phone Number">
            <Input value={formParentPhone} onChange={(e) => setFormParentPhone(e.target.value)} placeholder="e.g., +250 788 123 456" />
          </FormField>
          <FormField label="Parent Email">
            <Input type="email" value={formParentEmail} onChange={(e) => setFormParentEmail(e.target.value)} placeholder="e.g., parent@example.rw" />
          </FormField>
          <p className="text-xs text-neutral-500 -mt-1 mb-3">
            When this email or phone matches a parent's IHURIRO account, absence alerts appear in their Notifications as a short SMS.
          </p>
        </>
      ) : (
        <>
          <FormField label="Subjects">
            <Input value={formSubjects} onChange={(e) => setFormSubjects(e.target.value)} placeholder="e.g., Mathematics, Science" />
          </FormField>
          <FormField label="Assigned Classes">
            <Input value={formClasses} onChange={(e) => setFormClasses(e.target.value)} placeholder="e.g., P6A, S3B" />
          </FormField>
          <FormField label="Phone Number">
            <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="e.g., +250 788 123 456" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g., teacher@school.rw" />
          </FormField>
        </>
      )}
      </>
      )}
    </Modal>
  );
}

type AddKind = 'school' | 'class' | 'subject' | 'lesson' | 'assignment';

type AddField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'number' | 'select' | 'list';
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
};

const addForms: Record<AddKind, { title: string; subtitle: string; submitLabel: string; fields: AddField[] }> = {
  school: {
    title: 'Add New School',
    subtitle: 'Register a school in the platform',
    submitLabel: 'Add School',
    fields: [
      { key: 'name', label: 'School Name', placeholder: 'e.g., GS Muhima', required: true },
      { key: 'district', label: 'District', placeholder: 'e.g., Nyarugenge', required: true },
      { key: 'level', label: 'Level', placeholder: 'e.g., Primary & Secondary', required: true },
      { key: 'students', label: 'Students', placeholder: 'e.g., 842', type: 'number' },
      { key: 'teachers', label: 'Teachers', placeholder: 'e.g., 38', type: 'number' },
    ],
  },
  class: {
    title: 'Add New Class',
    subtitle: 'Create a class and assign a teacher',
    submitLabel: 'Add Class',
    fields: [
      { key: 'name', label: 'Class Name', placeholder: 'e.g., P6A', required: true },
      { key: 'teacher', label: 'Class Teacher', placeholder: 'e.g., Mr. Habimana', required: true },
      { key: 'students', label: 'Students', placeholder: 'e.g., 32', type: 'number' },
      { key: 'room', label: 'Room', placeholder: 'e.g., Room 12' },
      { key: 'subjects', label: 'Subjects', placeholder: 'e.g., 8', type: 'number' },
    ],
  },
  subject: {
    title: 'Add New Subject',
    subtitle: 'Add a subject to the curriculum',
    submitLabel: 'Add Subject',
    fields: [
      { key: 'name', label: 'Subject Name', placeholder: 'e.g., Mathematics', required: true },
      { key: 'teacher', label: 'Teacher', placeholder: 'e.g., Mr. Habimana' },
      { key: 'classes', label: 'Assigned Classes', placeholder: 'e.g., P6A, S3B', type: 'list', required: true },
    ],
  },
  lesson: {
    title: 'Add New Lesson',
    subtitle: 'Schedule a lesson for a class',
    submitLabel: 'Add Lesson',
    fields: [
      { key: 'title', label: 'Lesson Title', placeholder: 'e.g., Introduction to Fractions', required: true },
      { key: 'subject', label: 'Subject', placeholder: 'e.g., Mathematics', required: true },
      { key: 'class', label: 'Class', placeholder: 'e.g., P6A', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        defaultValue: 'scheduled',
        options: [
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      },
    ],
  },
  assignment: {
    title: 'Add New Assignment',
    subtitle: 'Create an assignment and track submissions',
    submitLabel: 'Add Assignment',
    fields: [
      { key: 'title', label: 'Assignment Title', placeholder: 'e.g., Math Worksheet: Fractions', required: true },
      { key: 'subject', label: 'Subject', placeholder: 'e.g., Mathematics', required: true },
      { key: 'class', label: 'Class', placeholder: 'e.g., P6A', required: true },
      { key: 'due', label: 'Due Date', type: 'date', required: true },
      { key: 'total', label: 'Total Students', placeholder: 'e.g., 32', type: 'number' },
      { key: 'submitted', label: 'Submitted', placeholder: 'e.g., 0', type: 'number' },
    ],
  },
};

const splitList = (value?: string) =>
  (value || '').split(',').map((part) => part.trim()).filter(Boolean);

function AddEducationModal({ kind, open, onClose, onSaved }: { kind: AddKind; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const form = addForms[kind];
  const setValue = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setValues({});
    setSaveError(null);
    setSaving(false);
    setSaved(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    for (const field of form.fields) {
      if (field.required && !(values[field.key] ?? '').trim()) {
        setSaveError(`${field.label} is required.`);
        return;
      }
    }

    const number = (key: string) => Number(values[key] || 0);
    setSaving(true);
    setSaveError(null);

    try {
      if (kind === 'school') {
        await api.education.createSchool({
          name: values.name.trim(),
          district: values.district.trim(),
          level: values.level.trim(),
          students: number('students'),
          teachers: number('teachers'),
        });
      } else if (kind === 'class') {
        await api.education.createClass({
          name: values.name.trim(),
          teacher: values.teacher.trim(),
          students: number('students'),
          room: (values.room ?? '').trim(),
          subjects: number('subjects'),
        });
      } else if (kind === 'subject') {
        await api.education.createSubject({
          name: values.name.trim(),
          teacher: (values.teacher ?? '').trim(),
          classes: splitList(values.classes),
        });
      } else if (kind === 'lesson') {
        await api.education.createLesson({
          title: values.title.trim(),
          subject: values.subject.trim(),
          class: values.class.trim(),
          date: values.date,
          status: (values.status as Lesson['status']) || 'scheduled',
        });
      } else {
        await api.education.createAssignment({
          title: values.title.trim(),
          subject: values.subject.trim(),
          class: values.class.trim(),
          due: values.due,
          total: number('total'),
          submitted: number('submitted'),
        });
      }
      await onSaved();
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Modal
        open={open}
        onClose={close}
        title="Success"
        subtitle="The record has been created"
        icon={<CheckCircle className="w-5 h-5" />}
        footer={<Button onClick={close}>Done</Button>}
      >
        <p className="text-sm text-neutral-600">The {kind} has been added successfully.</p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={form.title}
      subtitle={form.subtitle}
      icon={<Plus className="w-5 h-5" />}
      footer={
        <>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : form.submitLabel}
          </Button>
        </>
      }
    >
      {saveError && <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{saveError}</div>}
      {form.fields.map((field) => (
        <FormField key={field.key} label={field.label}>
          {field.type === 'select' ? (
            <Select
              value={values[field.key] ?? field.defaultValue ?? ''}
              onChange={(event) => setValue(field.key, event.target.value)}
            >
              {(field.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          ) : (
            <Input
              type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
              value={values[field.key] ?? ''}
              onChange={(event) => setValue(field.key, event.target.value)}
              placeholder={field.placeholder}
            />
          )}
        </FormField>
      ))}
    </Modal>
  );
}

type ClassDraft = {
  rowId: string;
  name: string;
  teacher: string;
  students: string;
  room: string;
  subjects: string;
};

const blankClassRow = (): ClassDraft => ({
  rowId: Math.random().toString(36).slice(2),
  name: '',
  teacher: '',
  students: '',
  room: '',
  subjects: '',
});

const classDraftColumns: { key: keyof Omit<ClassDraft, 'rowId'>; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Class name', placeholder: 'P6A' },
  { key: 'teacher', label: 'Class teacher', placeholder: 'Mr. Habimana' },
  { key: 'students', label: 'Students', placeholder: '32' },
  { key: 'room', label: 'Room', placeholder: 'Room 12' },
  { key: 'subjects', label: 'Subjects', placeholder: '8' },
];

function ClassListModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [single, setSingle] = useState({ name: '', teacher: '', students: '', room: '', subjects: '' });
  const [rows, setRows] = useState<ClassDraft[]>(() => Array.from({ length: 6 }, blankClassRow));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: string[] } | null>(null);

  if (!open) return null;

  const reset = () => {
    setMode('single');
    setSingle({ name: '', teacher: '', students: '', room: '', subjects: '' });
    setRows(Array.from({ length: 6 }, blankClassRow));
    setSaving(false);
    setError(null);
    setResult(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const setSingleValue = (key: keyof typeof single, value: string) =>
    setSingle((current) => ({ ...current, [key]: value }));
  const updateRow = (rowId: string, key: keyof Omit<ClassDraft, 'rowId'>, value: string) =>
    setRows((current) => current.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row)));
  const addRow = () => setRows((current) => [...current, blankClassRow()]);
  const removeRow = (rowId: string) =>
    setRows((current) => (current.length <= 1 ? [blankClassRow()] : current.filter((row) => row.rowId !== rowId)));
  const clearRows = () => setRows(Array.from({ length: 6 }, blankClassRow));

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    const text = event.clipboardData.getData('text/plain');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;
    event.preventDefault();
    const lines = text.replace(/\r/g, '').split('\n').filter((line) => line.trim() !== '');
    setRows((current) => {
      const next = current.map((row) => ({ ...row }));
      lines.forEach((line, lineOffset) => {
        while (next.length <= rowIndex + lineOffset) next.push(blankClassRow());
        line.split('\t').forEach((cell, cellOffset) => {
          const column = classDraftColumns[colIndex + cellOffset];
          if (column) next[rowIndex + lineOffset][column.key] = cell.trim();
        });
      });
      return next;
    });
  };

  const filledRows = rows.filter((row) => row.name.trim());

  const saveSingle = async () => {
    if (!single.name.trim()) { setError('Enter the class name.'); return; }
    if (single.teacher.trim().length < 2) { setError('Enter the class teacher.'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.education.createClass({
        name: single.name.trim(),
        teacher: single.teacher.trim(),
        students: Number(single.students) || 0,
        room: single.room.trim(),
        subjects: Number(single.subjects) || 0,
      });
      await onSaved();
      setResult({ created: 1, skipped: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the class.');
    } finally {
      setSaving(false);
    }
  };

  const saveBulk = async () => {
    if (filledRows.length === 0) { setError('Add at least one class name.'); return; }
    const missingTeacher = rows.findIndex((row) => row.name.trim() && row.teacher.trim().length < 2);
    if (missingTeacher !== -1) {
      setError(`Row ${missingTeacher + 1}: enter the class teacher.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await api.education.createClassesBulk({
        classes: filledRows.map((row) => ({
          name: row.name.trim(),
          teacher: row.teacher.trim(),
          students: Number(row.students) || 0,
          room: row.room.trim(),
          subjects: Number(row.subjects) || 0,
        })),
      });
      await onSaved();
      setResult({ created: response.created.length, skipped: response.skipped });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the class list.');
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <Modal
        open={open}
        onClose={close}
        title="Classes saved"
        subtitle={`${result.created} ${result.created === 1 ? 'class' : 'classes'} added`}
        icon={<CheckCircle className="w-5 h-5" />}
        footer={<Button onClick={close}>Done</Button>}
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-success-200 bg-success-50 p-3">
            <p className="font-semibold text-success-800">
              {result.created} {result.created === 1 ? 'class was' : 'classes were'} created.
            </p>
          </div>
          {result.skipped.length > 0 && (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-warning-800">
              <p className="font-medium">Skipped — already exist:</p>
              <p className="mt-1 text-xs">{result.skipped.join(', ')}</p>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add New Class"
      subtitle="Create one class or paste a whole class list"
      icon={<Plus className="w-5 h-5" />}
      wide={mode === 'bulk'}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
          {mode === 'single' ? (
            <Button onClick={saveSingle} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Class'}
            </Button>
          ) : (
            <Button onClick={saveBulk} disabled={saving || filledRows.length === 0}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Save ${filledRows.length || ''} ${filledRows.length === 1 ? 'class' : 'classes'}`.trim()}
            </Button>
          )}
        </>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => { setMode('single'); setError(null); }}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            mode === 'single' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Plus className="w-4 h-4" /> Single class
        </button>
        <button
          type="button"
          onClick={() => { setMode('bulk'); setError(null); }}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            mode === 'bulk' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Table2 className="w-4 h-4" /> Excel list
        </button>
      </div>

      {error && <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{error}</div>}

      {mode === 'single' ? (
        <div className="space-y-3">
          <FormField label="Class Name">
            <Input value={single.name} onChange={(event) => setSingleValue('name', event.target.value)} placeholder="e.g., P6A" />
          </FormField>
          <FormField label="Class Teacher">
            <Input value={single.teacher} onChange={(event) => setSingleValue('teacher', event.target.value)} placeholder="e.g., Mr. Habimana" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Students">
              <Input type="number" value={single.students} onChange={(event) => setSingleValue('students', event.target.value)} placeholder="e.g., 32" />
            </FormField>
            <FormField label="Room">
              <Input value={single.room} onChange={(event) => setSingleValue('room', event.target.value)} placeholder="e.g., Room 12" />
            </FormField>
          </div>
          <FormField label="Subjects">
            <Input type="number" value={single.subjects} onChange={(event) => setSingleValue('subjects', event.target.value)} placeholder="e.g., 8" />
          </FormField>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">
            Type rows directly, or copy a range from Excel and paste it into any cell. Columns: Class name, Class
            teacher, Students, Room, Subjects.
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="w-9 border-b border-r border-neutral-200 px-1 py-2 text-xs font-semibold text-neutral-400">#</th>
                  {classDraftColumns.map((column) => (
                    <th key={column.key} className="border-b border-r border-neutral-200 px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      {column.label}
                    </th>
                  ))}
                  <th className="w-9 border-b border-neutral-200 px-1 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.rowId} className={rowIndex % 2 === 1 ? 'bg-neutral-50/60' : 'bg-white'}>
                    <td className="border-b border-r border-neutral-200 px-1 py-1 text-center text-xs text-neutral-400">{rowIndex + 1}</td>
                    {classDraftColumns.map((column, colIndex) => (
                      <td key={column.key} className="border-b border-r border-neutral-200 p-0">
                        <input
                          value={row[column.key]}
                          onChange={(event) => updateRow(row.rowId, column.key, event.target.value)}
                          onPaste={(event) => handlePaste(event, rowIndex, colIndex)}
                          placeholder={rowIndex === 0 ? column.placeholder : ''}
                          inputMode={column.key === 'students' || column.key === 'subjects' ? 'numeric' : 'text'}
                          className="w-full bg-transparent px-2 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-300 focus:bg-primary-50/70"
                        />
                      </td>
                    ))}
                    <td className="border-b border-neutral-200 px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.rowId)}
                        title="Delete row"
                        className="w-6 h-6 rounded-md text-neutral-300 hover:text-error-600 hover:bg-error-50 inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={addRow} icon={<Plus className="w-4 h-4" />}>Add row</Button>
              <Button size="sm" variant="ghost" onClick={clearRows}>Clear</Button>
            </div>
            <span className="text-xs text-neutral-400">{filledRows.length} of {rows.length} rows filled</span>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AcademicReportModal({ student, students, results, onClose }: { student: Student | null; students: Student[]; results: Result[]; onClose: () => void }) {
  if (!student) return null;

  const own = results.filter((row) => row.studentId === student.id);
  const average = averageOfResults(own);
  const total = own.reduce((sum, row) => sum + row.marks, 0);
  const grade = average === null ? null : gradeForScore(average);
  const classPeers = students
    .filter((peer) => peer.class === student.class)
    .map((peer) => ({ id: peer.id, average: averageOfResults(results.filter((row) => row.studentId === peer.id)) }))
    .filter((peer) => peer.average !== null)
    .sort((a, b) => (b.average as number) - (a.average as number));
  const position = classPeers.findIndex((peer) => peer.id === student.id) + 1;
  const academicYear = own.find((row) => row.academicYear)?.academicYear || student.academicYear || '—';
  const term = own[0]?.term || '—';

  return (
    <Modal
      open
      onClose={onClose}
      title="Academic Report Card"
      subtitle={`${student.name} • Class ${student.class}`}
      icon={<BarChart3 className="w-5 h-5" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>Print</Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex justify-start">
          <img
            src="/education/ministry-of-education.png"
            alt="Republic of Rwanda — Ministry of Education"
            className="h-16 w-auto"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-neutral-400">Academic year</p><p className="font-medium text-neutral-800">{academicYear}</p></div>
          <div><p className="text-xs text-neutral-400">Term</p><p className="font-medium text-neutral-800">{term}</p></div>
          <div><p className="text-xs text-neutral-400">Attendance</p><p className="font-medium text-neutral-800">{student.attendance}%</p></div>
          <div><p className="text-xs text-neutral-400">Status</p><Badge variant={studentStatusConfig[student.status].variant}>{studentStatusConfig[student.status].label}</Badge></div>
          <div><p className="text-xs text-neutral-400">Parent / Guardian</p><p className="font-medium text-neutral-800">{student.parentName || '—'}</p></div>
          <div><p className="text-xs text-neutral-400">Parent phone</p><p className="font-medium text-neutral-800">{student.parentPhone || '—'}</p></div>
          <div><p className="text-xs text-neutral-400">Parent email</p><p className="font-medium text-neutral-800 break-words">{student.parentEmail || '—'}</p></div>
          <div><p className="text-xs text-neutral-400">Parent account</p><Badge variant={student.guardianLinked ? 'success' : 'warning'}>{student.guardianLinked ? `Linked · ${student.guardianUserName}` : 'Not linked'}</Badge></div>
        </div>

        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Subject</th>
                <th className="text-left px-4 py-2.5 font-semibold">Marks</th>
                <th className="text-left px-4 py-2.5 font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {own.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-400">No marks recorded yet.</td></tr>
              )}
              {own.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5 font-medium text-neutral-800">{row.subject}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{row.marks}%</td>
                  <td className="px-4 py-2.5"><Badge variant={gradeVariantFor(gradeForScore(row.marks))}>{gradeForScore(row.marks)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-400">Subjects</p><p className="font-semibold text-neutral-800">{own.length}</p></div>
          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-400">Total</p><p className="font-semibold text-neutral-800">{own.length ? `${Math.round(total * 10) / 10}` : '—'}</p></div>
          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-400">Average</p><p className="font-semibold text-neutral-800">{average === null ? '—' : `${average}%`}</p></div>
          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-400">Position</p><p className="font-semibold text-neutral-800">{position > 0 ? `${position} of ${classPeers.length}` : '—'}</p></div>
        </div>

        {grade && <p className="text-sm text-neutral-600">Overall grade: <Badge variant={gradeVariantFor(grade)}>{grade}</Badge></p>}
        <p className="text-xs text-neutral-400">Grading scale: A ≥ 80% · B ≥ 70% · C ≥ 60% · D ≥ 50% · E below 50%.</p>
      </div>
    </Modal>
  );
}

function AddResultModal({ open, students, subjects, onClose, onSaved }: { open: boolean; students: Student[]; subjects: { name: string }[]; onClose: () => void; onSaved: () => void }) {
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState('2026');
  const [marks, setMarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStudentId('');
    setSubject('');
    setTerm('Term 1');
    setAcademicYear('2026');
    setMarks('');
    setSaving(false);
    setSaveError(null);
    setSaved(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!studentId) {
      setSaveError('Choose a student.');
      return;
    }
    if (!subject.trim()) {
      setSaveError('Enter the subject.');
      return;
    }
    const value = Number(marks);
    if (marks === '' || Number.isNaN(value) || value < 0 || value > 100) {
      setSaveError('Enter marks between 0 and 100.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await api.education.createResult({
        studentId,
        subject: subject.trim(),
        term,
        academicYear: academicYear.trim(),
        marks: value,
      });
      await onSaved();
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Modal
        open={open}
        onClose={close}
        title="Success"
        subtitle="The marks have been recorded"
        icon={<CheckCircle className="w-5 h-5" />}
        footer={<Button onClick={close}>Done</Button>}
      >
        <p className="text-sm text-neutral-600">The subject marks were added to the student's academic record.</p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add Subject Marks"
      subtitle="Record a mark for a student and subject"
      icon={<Files className="w-5 h-5" />}
      footer={
        <>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Marks'}
          </Button>
        </>
      }
    >
      {saveError && <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{saveError}</div>}
      <FormField label="Student">
        <Select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
          <option value="" disabled>Select student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>{student.name} — {student.class}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Subject">
        {subjects.length > 0 ? (
          <Select value={subject} onChange={(event) => setSubject(event.target.value)}>
            <option value="" disabled>Select subject</option>
            {subjects.map((item) => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
          </Select>
        ) : (
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g., Mathematics" />
        )}
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Term">
          <Select value={term} onChange={(event) => setTerm(event.target.value)}>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </Select>
        </FormField>
        <FormField label="Academic Year">
          <Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="e.g., 2026" />
        </FormField>
      </div>
      <FormField label="Marks (0–100)">
        <Input type="number" min={0} max={100} value={marks} onChange={(event) => setMarks(event.target.value)} placeholder="e.g., 78" />
      </FormField>
    </Modal>
  );
}
