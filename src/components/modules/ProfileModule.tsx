import { useState } from 'react';
import {
  UserCircle, Mail, Phone, Lock, Bell, Globe, Activity,
  FolderOpen, MessageSquare, Check, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Badge, SectionHeader, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiList } from '@/lib/hooks';
import type { Language } from '@/types';

type Feedback = { type: 'success' | 'error'; text: string } | null;

export function ProfileModule() {
  const { user, language, setLanguage, updateUser } = useApp();
  const [activeTab, setActiveTab] = useState('personal');
  const [formName, setFormName] = useState(user?.name || '');
  const [formPhone, setFormPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const { data: notifications } = useApiList(() => api.notifications.list().then((result) => result.notifications));
  const { data: complaints } = useApiList(() => api.complaints.list().then((result) => result.complaints));

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <UserCircle className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact', icon: <Phone className="w-4 h-4" /> },
    { id: 'password', label: 'Password', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'language', label: 'Language', icon: <Globe className="w-4 h-4" /> },
    { id: 'activity', label: 'My Activity', icon: <Activity className="w-4 h-4" /> },
    { id: 'applications', label: 'My Applications', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'messages', label: 'My Messages', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  const activity = [
    ...complaints.map((complaint) => ({
      id: `c-${complaint.id}`,
      action: `Reported "${complaint.title}"`,
      module: `CitizenConnect • ${complaint.status}`,
      date: complaint.date,
    })),
    ...notifications.map((notification) => ({
      id: `n-${notification.id}`,
      action: notification.title,
      module: `Notification • ${notification.type}`,
      date: notification.date,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const saveProfile = async (patch: { name?: string; phone?: string }) => {
    setSaving(true);
    setFeedback(null);
    try {
      const result = await api.auth.updateProfile(patch);
      updateUser(result.user);
      setFeedback({ type: 'success', text: 'Your changes have been saved.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Could not save your changes.' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setFeedback(null);
    if (newPassword.length < 8) {
      setFeedback({ type: 'error', text: 'The new password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ type: 'success', text: 'Your password has been updated.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Could not update your password.' });
    } finally {
      setSaving(false);
    }
  };

  const feedbackBanner = feedback && (
    <div className={`p-3 rounded-lg border text-sm ${
      feedback.type === 'success'
        ? 'bg-success-50 border-success-200 text-success-700'
        : 'bg-error-50 border-error-200 text-error-700'
    }`}>
      {feedback.text}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Profile" subtitle="Manage your account and preferences" icon={<UserCircle className="w-5 h-5" />} />

      <Card className="p-6 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center text-xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-neutral-800">{user?.name || 'Guest User'}</h2>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="info" size="sm">
                <span className="capitalize">{user?.role || 'citizen'}</span>
              </Badge>
              <Badge variant={user?.status === 'suspended' ? 'error' : 'accent'} size="sm">
                <span className="capitalize">{user?.status || 'active'}</span>
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setFeedback(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'personal' && (
        <Card className="p-6 max-w-2xl">
          <div className="space-y-4">
            {feedbackBanner}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Role</label>
              <div className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600 capitalize">
                {user?.role}
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">Roles are assigned by a platform administrator.</p>
            </div>
            <Button
              icon={<Check className="w-4 h-4" />}
              disabled={saving || !formName.trim()}
              onClick={() => saveProfile({ name: formName.trim() })}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'contact' && (
        <Card className="p-6 max-w-2xl">
          <div className="space-y-4">
            {feedbackBanner}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-500 outline-none"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">Email changes are handled by an administrator.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(event) => setFormPhone(event.target.value)}
                  placeholder="e.g., +250 788 123 456"
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            <Button
              icon={<Check className="w-4 h-4" />}
              disabled={saving}
              onClick={() => saveProfile({ phone: formPhone.trim() })}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card className="p-6 max-w-2xl">
          <div className="space-y-4">
            {feedbackBanner}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <Button
              icon={<Lock className="w-4 h-4" />}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              onClick={changePassword}
            >
              {saving ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className="p-6 max-w-2xl">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 border border-warning-200 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning-800">Delivery channels are not configurable yet</p>
              <p className="text-xs text-warning-700 mt-1">
                IHURIRO currently delivers notifications in-app only. SMS and email delivery need an approved gateway
                configured on the server, so per-channel preferences are not stored.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {['Government Alerts', 'School Notifications', 'Health Reminders', 'Business Notifications', 'System Notifications'].map((pref) => (
              <div key={pref} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                <div>
                  <p className="font-semibold text-neutral-800 text-sm">{pref}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Delivered in-app</p>
                </div>
                <Badge variant="success" size="sm">On</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-4">Manage your messages on the Notifications page.</p>
        </Card>
      )}

      {activeTab === 'language' && (
        <Card className="p-6 max-w-2xl">
          <p className="text-sm text-neutral-500 mb-4">Choose your preferred language. This is saved to your account.</p>
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  language === lang.code
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-semibold text-neutral-800 flex-1 text-left">{lang.label}</span>
                {language === lang.code && <Check className="w-5 h-5 text-primary-600" />}
              </button>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-3">
          {activity.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No activity recorded for your account yet.</p>
            </Card>
          ) : (
            activity.slice(0, 20).map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{entry.action}</p>
                    <p className="text-xs text-neutral-400 capitalize">{entry.module} • {entry.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <Card className="p-8 text-center">
          <FolderOpen className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">You have no submitted applications yet.</p>
          <p className="text-xs text-neutral-400 mt-1">Official applications are completed through the responsible institution's authorised channel.</p>
        </Card>
      )}

      {activeTab === 'messages' && (
        <Card className="p-8 text-center">
          <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No messages in your inbox.</p>
        </Card>
      )}
    </div>
  );
}
