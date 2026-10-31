import { useState } from 'react';
import {
  Bell, MessageSquare, Mail, Megaphone, GraduationCap, Heart,
  Briefcase, Settings, CheckCheck, Filter,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Badge, SectionHeader, StatCard, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiList } from '@/lib/hooks';
import type { Notification } from '@/types';

const typeConfig: Record<Notification['type'], { icon: React.ReactNode; color: string; label: string }> = {
  system: { icon: <Bell className="w-4 h-4" />, color: 'bg-neutral-100 text-neutral-600', label: 'System' },
  sms: { icon: <MessageSquare className="w-4 h-4" />, color: 'bg-primary-100 text-primary-600', label: 'SMS' },
  email: { icon: <Mail className="w-4 h-4" />, color: 'bg-accent-100 text-accent-600', label: 'Email' },
  government: { icon: <Megaphone className="w-4 h-4" />, color: 'bg-primary-100 text-primary-600', label: 'Government' },
  school: { icon: <GraduationCap className="w-4 h-4" />, color: 'bg-secondary-100 text-secondary-600', label: 'School' },
  health: { icon: <Heart className="w-4 h-4" />, color: 'bg-error-100 text-error-600', label: 'Health' },
  business: { icon: <Briefcase className="w-4 h-4" />, color: 'bg-accent-100 text-accent-600', label: 'Business' },
};

const filters = ['all', 'unread', 'system', 'sms', 'email', 'government', 'school', 'health', 'business'];

export function NotificationsModule() {
  const { navigate } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');
  const { data: notifications, loading, error, refresh } = useApiList(() =>
    api.notifications.list().then((result) => result.notifications)
  );

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      await refresh();
    } catch {
      // keep the current list if the request fails
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      await refresh();
    } catch {
      // keep the current list if the request fails
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Notifications"
        subtitle="All your alerts and messages in one place"
        icon={<Bell className="w-5 h-5" />}
        action={<Button size="sm" variant="outline" icon={<CheckCheck className="w-4 h-4" />} onClick={markAllRead}>Mark all read</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={notifications.length} icon={<Bell className="w-5 h-5" />} color="primary" />
        <StatCard label="Unread" value={notifications.filter(n => !n.read).length} icon={<Bell className="w-5 h-5" />} color="warning" />
        <StatCard label="SMS" value={notifications.filter(n => n.channel === 'sms').length} icon={<MessageSquare className="w-5 h-5" />} color="accent" />
        <StatCard label="Email" value={notifications.filter(n => n.channel === 'email').length} icon={<Mail className="w-5 h-5" />} color="error" />
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading notifications…</p>}
      {error && <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{error}</div>}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-neutral-400" />
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              activeFilter === f
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No notifications in this category.</p>
          </Card>
        ) : (
          filtered.map((n) => {
            const config = typeConfig[n.type];
            return (
              <Card key={n.id} className={`p-4 transition-all ${!n.read ? 'border-l-4 border-l-primary-500' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-neutral-800 text-sm">{n.title}</h3>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                      <Badge variant="default" size="sm">{config.label}</Badge>
                      <span>via {n.channel}</span>
                      <span>•</span>
                      <span>{n.date}</span>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className="ml-auto text-primary-600 font-semibold hover:text-primary-700"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Preferences */}
      <Card className="p-5 bg-gradient-to-br from-primary-50/50 to-accent-50/50 border-primary-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-800 text-sm">Notification Preferences</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Manage how and when you receive notifications</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('profile')}>Manage</Button>
        </div>
      </Card>
    </div>
  );
}
