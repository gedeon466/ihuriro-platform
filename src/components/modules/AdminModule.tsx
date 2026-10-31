import { useState } from 'react';
import {
  Settings, LayoutDashboard, Users, Shield, FileEdit, FileText,
  Bot, MessageSquare, History, AlertTriangle,
  CheckCircle, UserPlus, Loader2, Search, Plus, Megaphone, Server,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Badge, SectionHeader, StatCard, SubModuleGrid, EmptyState, Button, Modal, FormField, Input, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiList, useApiQuery } from '@/lib/hooks';
import type { Announcement, AppUser, Complaint } from '@/types';

const subModules = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { id: 'roles', label: 'Roles', icon: <Shield className="w-5 h-5" /> },
  { id: 'content', label: 'Content', icon: <FileEdit className="w-5 h-5" /> },
  { id: 'complaints', label: 'Complaints', icon: <FileText className="w-5 h-5" /> },
  { id: 'ai-mgmt', label: 'AI Management', icon: <Bot className="w-5 h-5" /> },
  { id: 'sms', label: 'SMS Management', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'audit', label: 'Audit Logs', icon: <History className="w-5 h-5" /> },
  { id: 'settings', label: 'System Settings', icon: <Settings className="w-5 h-5" /> },
];

const roleLabels: Record<string, string> = {
  citizen: 'Citizen',
  student: 'Student',
  parent: 'Parent',
  teacher: 'Teacher',
  business: 'Business Owner',
  health: 'Health Professional',
  government: 'Government Officer',
  admin: 'Administrator',
};

const rolePermissions: Record<string, string[]> = {
  citizen: ['View public information', 'Report problems', 'Submit ideas'],
  student: ['View lessons', 'Take quizzes', 'View own records'],
  parent: ['View child information', 'Receive notifications', 'School communication'],
  teacher: ['Manage students and teachers', 'Record attendance', 'Review performance'],
  business: ['Manage inventory', 'Record sales', 'Track loans and reports'],
  health: ['View health module content', 'Receive health notifications'],
  government: ['Manage complaints', 'Publish announcements', 'View platform activity'],
  admin: ['Full platform access', 'Manage users and roles', 'Review audit logs'],
};

const complaintStatusLabel: Record<Complaint['status'], string> = {
  pending: 'Pending',
  'in-review': 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export function AdminModule() {
  const { currentSection, navigate, user } = useApp();
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [rowAction, setRowAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: summary } = useApiQuery(() => api.admin.summary().then((result) => result.summary));
  const { data: users, refresh: refreshUsers } = useApiList(() => api.admin.users().then((result) => result.users));
  const { data: logs } = useApiList(() => api.admin.auditLogs().then((result) => result.logs));
  const { data: complaints, refresh: refreshComplaints } = useApiList(() =>
    api.complaints.list().then((result) => result.complaints)
  );
  const { data: complaintSummary, refresh: refreshComplaintSummary } = useApiQuery(() =>
    api.complaints.summary().then((result) => result.summary)
  );
  const { data: announcements, refresh: refreshAnnouncements } = useApiList(() =>
    api.announcements.list().then((result) => result.announcements)
  );
  const { data: aiStatus } = useApiQuery(() => api.ai.status());

  const activeUsers = summary?.status.find((row) => row.status === 'active')?.count ?? 0;
  const totalUsers = summary?.users ?? users.length;
  const openComplaints = (complaintSummary?.pending ?? 0) + (complaintSummary?.['in-review'] ?? 0);
  const normalizedQuery = userQuery.trim().toLowerCase();
  const filteredUsers = users.filter((item) => {
    const matchesQuery = normalizedQuery
      ? item.name.toLowerCase().includes(normalizedQuery) || item.email.toLowerCase().includes(normalizedQuery)
      : true;
    const matchesRole = roleFilter ? item.role === roleFilter : true;
    return matchesQuery && matchesRole;
  });

  const updateUser = async (id: string, patch: Partial<Pick<AppUser, 'role' | 'status'>>) => {
    setRowAction(id);
    setActionError(null);
    try {
      await api.admin.updateUser(id, patch);
      await refreshUsers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update this user.');
    } finally {
      setRowAction(null);
    }
  };

  const updateComplaintStatus = async (id: string, status: Complaint['status']) => {
    setRowAction(id);
    setActionError(null);
    try {
      await api.complaints.update(id, { status });
      await Promise.all([refreshComplaints(), refreshComplaintSummary()]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update this complaint.');
    } finally {
      setRowAction(null);
    }
  };

  if (!currentSection) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Admin Dashboard" subtitle="Platform management and oversight" icon={<Settings className="w-5 h-5" />} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={summary?.users ?? users.length} icon={<Users className="w-5 h-5" />} color="primary" />
          <StatCard label="Open Complaints" value={openComplaints} icon={<AlertTriangle className="w-5 h-5" />} color="warning" />
          <StatCard label="Resolved Complaints" value={complaintSummary?.resolved ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="success" />
          <StatCard label="Audit Events" value={summary?.auditEvents ?? logs.length} icon={<History className="w-5 h-5" />} color="accent" />
        </div>

        <SubModuleGrid items={subModules} onSelect={(id) => navigate('admin', id)} columns={3} />
      </div>
    );
  }

  if (currentSection === 'dashboard') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Dashboard" subtitle="Platform overview from live records" icon={<LayoutDashboard className="w-5 h-5" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={summary?.users ?? users.length} icon={<Users className="w-5 h-5" />} color="primary" />
          <StatCard label="Active Users" value={activeUsers} icon={<CheckCircle className="w-5 h-5" />} color="success" />
          <StatCard label="Complaints" value={summary?.complaints ?? complaints.length} icon={<FileText className="w-5 h-5" />} color="warning" />
          <StatCard label="Audit Events" value={summary?.auditEvents ?? logs.length} icon={<History className="w-5 h-5" />} color="accent" />
        </div>

        <Card className="p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">Users by role</h3>
          {(summary?.byRole.length ?? 0) === 0 ? (
            <p className="text-sm text-neutral-500">No user accounts registered yet.</p>
          ) : (
            <div className="space-y-4">
              {summary?.byRole.map((row) => {
                const share = totalUsers > 0 ? Math.round((row.count / totalUsers) * 100) : 0;
                return (
                  <div key={row.role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-700">{roleLabels[row.role] || row.role}</span>
                      <span className="text-neutral-500">{row.count} users</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-500" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">Recent activity</h3>
          {(summary?.recentActivity.length ?? 0) === 0 ? (
            <p className="text-sm text-neutral-500">No recorded activity yet.</p>
          ) : (
            <div className="space-y-3">
              {summary?.recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center flex-shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800">{entry.action}</p>
                    <p className="text-xs text-neutral-400">
                      {entry.resource}{entry.resourceId ? ` • ${entry.resourceId}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (currentSection === 'users') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Users" subtitle="Manage platform accounts and roles" icon={<Users className="w-5 h-5" />}
          action={<Button size="sm" icon={<UserPlus className="w-4 h-4" />} onClick={() => setShowAddUser(true)}>Add User</Button>} />

        {actionError && <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{actionError}</div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="sm:w-56">
            <option value="">All roles</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Name</th>
                  <th className="text-left px-5 py-3 font-semibold">Email</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Joined</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-neutral-400">No users match this filter.</td></tr>
                ) : (
                  filteredUsers.map((item) => {
                    const isSelf = item.id === user?.id;
                    const busy = rowAction === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 text-white flex items-center justify-center text-xs font-semibold">
                              {item.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium text-neutral-800">{item.name}</span>
                              {isSelf && <span className="block text-[11px] text-neutral-400">This is you</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-neutral-600">{item.email}</td>
                        <td className="px-5 py-3">
                          <Select
                            value={item.role}
                            disabled={isSelf || busy}
                            onChange={(event) => updateUser(item.id, { role: event.target.value as AppUser['role'] })}
                            className="text-xs py-1.5 w-40"
                          >
                            {Object.entries(roleLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={item.status === 'suspended' ? 'error' : 'success'} size="sm">
                            <span className="capitalize">{item.status || 'active'}</span>
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-neutral-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSelf || busy}
                            onClick={() => updateUser(item.id, { status: item.status === 'suspended' ? 'active' : 'suspended' })}
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <AddUserModal open={showAddUser} onClose={() => setShowAddUser(false)} onCreated={refreshUsers} />
      </>
    );
  }

  if (currentSection === 'roles') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Roles & Permissions" subtitle="Access levels enforced by the IHURIRO API" icon={<Shield className="w-5 h-5" />} />
        <Card className="p-5 bg-primary-50 border-primary-100">
          <p className="text-sm text-primary-800">
            Permissions are enforced on the server for every request. Changing a role here takes effect immediately
            for that account.
          </p>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(roleLabels).map(([role, label]) => {
            const count = summary?.byRole.find((row) => row.role === role)?.count ?? 0;
            return (
              <Card key={role} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800 text-sm">{label}</h3>
                      <p className="text-xs text-neutral-400">{count} {count === 1 ? 'user' : 'users'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rolePermissions[role].map((permission) => (
                    <Badge key={permission} variant="default" size="sm">{permission}</Badge>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (currentSection === 'audit') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Audit Logs" subtitle="Recorded platform actions" icon={<History className="w-5 h-5" />} />
        <Card className="overflow-hidden">
          {logs.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">No audit events recorded yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {logs.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center flex-shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800">{entry.action}</p>
                    <p className="text-xs text-neutral-400">
                      {entry.resource}{entry.resourceId ? ` • ${entry.resourceId}` : ''} • {entry.ip || 'unknown IP'}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (currentSection === 'content') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Content Management"
          subtitle="Official announcements shown across IHURIRO"
          icon={<FileEdit className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAnnouncement(true)}>New Announcement</Button>}
        />
        {actionError && <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{actionError}</div>}
        <div className="space-y-3">
          {announcements.length === 0 && (
            <Card className="p-8 text-center text-sm text-neutral-500">No announcements published yet.</Card>
          )}
          {announcements.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-800 text-sm">{item.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{item.content}</p>
                  <p className="text-xs text-neutral-400 mt-1">{item.category} • {item.date}</p>
                </div>
                <Badge variant="success" size="sm">Published</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={rowAction === item.id}
                  onClick={async () => {
                    setRowAction(item.id);
                    setActionError(null);
                    try {
                      await api.announcements.remove(item.id);
                      await refreshAnnouncements();
                    } catch (err) {
                      setActionError(err instanceof Error ? err.message : 'Could not remove this announcement.');
                    } finally {
                      setRowAction(null);
                    }
                  }}
                >
                  {rowAction === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Remove'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <AnnouncementModal open={showAnnouncement} onClose={() => setShowAnnouncement(false)} onCreated={refreshAnnouncements} />
      </>
    );
  }

  if (currentSection === 'complaints') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Complaint Management" subtitle="Review and route citizen reports" icon={<FileText className="w-5 h-5" />} />
        {actionError && <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{actionError}</div>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending" value={complaintSummary?.pending ?? 0} icon={<AlertTriangle className="w-5 h-5" />} color="warning" />
          <StatCard label="In Review" value={complaintSummary?.['in-review'] ?? 0} icon={<Search className="w-5 h-5" />} color="primary" />
          <StatCard label="Resolved" value={complaintSummary?.resolved ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="success" />
          <StatCard label="Total" value={complaintSummary?.total ?? complaints.length} icon={<FileText className="w-5 h-5" />} color="accent" />
        </div>
        <Card className="overflow-hidden">
          {complaints.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">No complaints submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Complaint</th>
                    <th className="text-left px-5 py-3 font-semibold">Category</th>
                    <th className="text-left px-5 py-3 font-semibold">Location</th>
                    <th className="text-left px-5 py-3 font-semibold">Date</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <span className="font-medium text-neutral-800">{complaint.title}</span>
                        <span className="block text-[11px] text-neutral-400 font-mono mt-0.5">#{complaint.id}</span>
                      </td>
                      <td className="px-5 py-3 text-neutral-600">{complaint.category}</td>
                      <td className="px-5 py-3 text-neutral-600">{complaint.location}</td>
                      <td className="px-5 py-3 text-neutral-400">{complaint.date}</td>
                      <td className="px-5 py-3">
                        {rowAction === complaint.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                        ) : (
                          <Select
                            value={complaint.status}
                            onChange={(event) => updateComplaintStatus(complaint.id, event.target.value as Complaint['status'])}
                            className="text-xs py-1.5 w-36"
                          >
                            {Object.entries(complaintStatusLabel).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </Select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (currentSection === 'ai-mgmt') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="AI Management" subtitle="Assistant configuration and limits" icon={<Bot className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-sm text-neutral-500 font-medium">Reply provider</p>
            <p className="text-2xl font-bold text-neutral-800 mt-1 font-heading capitalize">{aiStatus?.provider ?? '…'}</p>
            <p className="text-xs text-neutral-400 mt-1">
              {aiStatus?.externalProviderConfigured ? 'External model configured on the server' : 'Built-in knowledge base replies'}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-neutral-500 font-medium">Model</p>
            <p className="text-2xl font-bold text-neutral-800 mt-1 font-heading">{aiStatus?.model || '—'}</p>
            <p className="text-xs text-neutral-400 mt-1">Set through server environment variables</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-neutral-500 font-medium">Request limit</p>
            <p className="text-2xl font-bold text-neutral-800 mt-1 font-heading">40 / 5 min</p>
            <p className="text-xs text-neutral-400 mt-1">Per authenticated account</p>
          </Card>
        </div>
        <Card className="p-5 bg-neutral-50 border-neutral-200">
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-neutral-800">Conversation analytics are not collected</h3>
              <p className="text-sm text-neutral-600 mt-1">
                IHURIRO does not store AI conversations or per-topic usage counts, so no usage charts or ratings are
                displayed here. Assistant requests are audited only as request events.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'sms') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="SMS Management" subtitle="Outbound messaging channels" icon={<MessageSquare className="w-5 h-5" />} />
        <Card className="p-5 bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-800">No SMS gateway is connected</h3>
              <p className="text-sm text-warning-700 mt-1">
                IHURIRO cannot send SMS until an approved gateway is configured on the server. No messages have been
                delivered through this module.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-800 mb-3">What is available today</h3>
          <p className="text-sm text-neutral-600">
            In-app notifications are delivered inside IHURIRO and are visible on the Notifications page. Account
            creation sends one system notification to the new user. External SMS campaigns are not supported yet.
          </p>
        </Card>
      </div>
    );
  }

  if (currentSection === 'settings') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="System Settings" subtitle="Server-managed platform configuration" icon={<Settings className="w-5 h-5" />} />
        <Card className="divide-y divide-neutral-100">
          {[
            { title: 'Account registration', description: 'Citizens, students, parents, business and health accounts can self-register.', value: 'Open' },
            { title: 'Staff accounts', description: 'Teacher, government and administrator accounts are created by an administrator.', value: 'Admin-issued' },
            { title: 'AI assistant', description: 'Reply provider configured on the server.', value: aiStatus?.provider ?? '…' },
            { title: 'External integrations', description: 'Government, bank, tax and SMS connections require approved credentials.', value: 'Pending' },
          ].map((setting) => (
            <div key={setting.title} className="flex items-center gap-4 p-5">
              <Server className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-800 text-sm">{setting.title}</h3>
                <p className="text-xs text-neutral-500 mt-1">{setting.description}</p>
              </div>
              <Badge variant={setting.value === 'Pending' ? 'warning' : 'default'} size="sm">
                <span className="capitalize">{setting.value}</span>
              </Badge>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <p className="text-sm text-neutral-600">
            These values come from server configuration. Changes are applied through environment variables and a
            backend restart, not from the browser.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <EmptyState
        icon={<Settings className="w-8 h-8" />}
        title="Section Coming Soon"
        description="This admin section is being developed with full functionality."
      />
    </div>
  );
}

function AddUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void | Promise<void> }) {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('citizen');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formPassword, setFormPassword] = useState('Welcome@123');

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      setSaveError('Name and email are required');
      return;
    }
    if (formPassword.length < 8) {
      setSaveError('Temporary password must be at least 8 characters');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await api.admin.createUser({
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        status: formStatus,
        password: formPassword,
      });
      await onCreated();
      setSubmitted(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not create the user.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormEmail(''); setFormPhone('');
    setFormRole('citizen'); setFormStatus('active'); setFormPassword('Welcome@123');
    setSaveError(null); setSubmitted(false);
  };

  if (submitted) {
    return (
      <Modal
        open={open}
        onClose={() => { resetForm(); onClose(); }}
        title="User Added"
        subtitle="The new user has been created successfully"
        icon={<CheckCircle className="w-5 h-5" />}
        footer={<Button onClick={() => { resetForm(); onClose(); }}>Done</Button>}
      >
        <p className="text-sm text-neutral-600">
          The account has been created and a system notification has been sent to the user. Share the temporary
          password securely so they can sign in and change it.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => { resetForm(); onClose(); }}
      title="Add New User"
      subtitle="Create a new platform user account"
      icon={<UserPlus className="w-5 h-5" />}
      footer={
        <>
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add User'}
          </Button>
        </>
      }
    >
      {saveError && <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{saveError}</div>}
      <FormField label="Full Name">
        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Eric Mugisha" />
      </FormField>
      <FormField label="Email Address">
        <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g., eric@example.rw" />
      </FormField>
      <FormField label="Phone Number" hint="Optional">
        <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="e.g., +250 788 123 456" />
      </FormField>
      <FormField label="Role">
        <Select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Status">
        <Select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'active' | 'suspended')}>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </FormField>
      <FormField label="Temporary Password" hint="Share this with the user; they can change it later">
        <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="At least 8 characters" />
      </FormField>
    </Modal>
  );
}

function AnnouncementModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void | Promise<void> }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Government');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const reset = () => {
    setTitle(''); setCategory('Government'); setDate(new Date().toISOString().slice(0, 10));
    setContent(''); setError(null); setSaved(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Add a title and the announcement text.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.announcements.create({ title: title.trim(), category, date, content: content.trim() });
      await onCreated();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish the announcement.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Modal
        open={open}
        onClose={() => { reset(); onClose(); }}
        title="Announcement Published"
        subtitle="It is now visible to platform users"
        icon={<CheckCircle className="w-5 h-5" />}
        footer={<Button onClick={() => { reset(); onClose(); }}>Done</Button>}
      >
        <p className="text-sm text-neutral-600">The announcement has been saved and appears on the home dashboard.</p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="New Announcement"
      subtitle="Publish an official platform announcement"
      icon={<Megaphone className="w-5 h-5" />}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
          </Button>
        </>
      }
    >
      {error && <div className="mb-3 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{error}</div>}
      <FormField label="Title">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g., Umuganda this Saturday" />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Category">
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="Government">Government</option>
            <option value="Health">Health</option>
            <option value="Education">Education</option>
            <option value="Business">Business</option>
            <option value="Community">Community</option>
          </Select>
        </FormField>
        <FormField label="Date">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </FormField>
      </div>
      <FormField label="Message">
        <Textarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder="What should people know?" />
      </FormField>
    </Modal>
  );
}
