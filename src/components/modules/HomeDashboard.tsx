import {
  Users, GraduationCap, Heart, Briefcase, BookOpen, Sparkles,
  Megaphone, ArrowRight, TrendingUp, ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, ModuleCard, Badge, SectionHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiList, useApiQuery } from '@/lib/hooks';
import type { ModuleId } from '@/types';

const formatNumber = (value: number) => value.toLocaleString('en-US');

export function HomeDashboard() {
  const { navigate, toggleAIPanel, t } = useApp();
  const { data: announcements } = useApiList(() =>
    api.announcements.list().then((result) => result.announcements)
  );
  const { data: dashboard } = useApiQuery(() => api.dashboard.summary());

  const modules: { id: ModuleId; icon: React.ReactNode; title: string; desc: string; color: string }[] = [
    { id: 'citizenconnect', icon: <Users className="w-6 h-6" />, title: 'CitizenConnect', desc: 'Report problems, track complaints, submit ideas, and access government services', color: 'primary' },
    { id: 'education', icon: <GraduationCap className="w-6 h-6" />, title: 'Education', desc: 'Students, teachers, schools, lessons, attendance, progress, and parent communication', color: 'secondary' },
    { id: 'parentcare', icon: <Heart className="w-6 h-6" />, title: 'ParentCare23', desc: 'Pregnancy tracking, child care, vaccination, nutrition, and health education', color: 'error' },
    { id: 'biz360', icon: <Briefcase className="w-6 h-6" />, title: 'Biz360 Rwanda', desc: 'Inventory, sales, customers, payments, loans, taxes, and business reports', color: 'accent' },
    { id: 'learnrwanda', icon: <BookOpen className="w-6 h-6" />, title: 'Learn Rwanda', desc: 'Rwanda history, culture, civic education, peace, reconciliation, and quizzes', color: 'secondary' },
  ];

  const platform = dashboard?.platform;
  const stats = [
    { label: 'Active Users', value: formatNumber(platform?.users ?? 0), icon: <Users className="w-5 h-5" />, detail: 'Registered accounts', color: 'primary' },
    { label: 'Complaints Resolved', value: formatNumber(platform?.complaintsResolved ?? 0), icon: <ShieldCheck className="w-5 h-5" />, detail: `${formatNumber(platform?.complaints ?? 0)} submitted`, color: 'success' },
    { label: 'Students Tracked', value: formatNumber(platform?.students ?? 0), icon: <GraduationCap className="w-5 h-5" />, detail: `${formatNumber(platform?.studentsAtRisk ?? 0)} need support`, color: 'secondary' },
    { label: 'Products Tracked', value: formatNumber(platform?.products ?? 0), icon: <Briefcase className="w-5 h-5" />, detail: `${formatNumber(platform?.lowStock ?? 0)} low or out of stock`, color: 'accent' },
  ];

  const featuredServices = [
    { title: 'Report a Community Problem', desc: 'Quickly report issues like damaged roads or water outages', icon: <Megaphone className="w-5 h-5" />, module: 'citizenconnect' as ModuleId, section: 'report' },
    { title: 'Check Child Vaccination', desc: 'View vaccination schedules and track your child\'s immunization', icon: <Heart className="w-5 h-5" />, module: 'parentcare' as ModuleId, section: 'vaccination' },
    { title: 'Business Inventory', desc: 'Manage stock levels and get low-stock alerts', icon: <Briefcase className="w-5 h-5" />, module: 'biz360' as ModuleId, section: 'inventory' },
    { title: 'Rwanda History Quiz', desc: 'Test your knowledge of Rwanda\'s rich history', icon: <BookOpen className="w-5 h-5" />, module: 'learnrwanda' as ModuleId, section: 'quizzes' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 text-white p-6 sm:p-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-secondary-400/20 rounded-full translate-y-1/2" />

        <div className="relative z-10">
          <Badge variant="info" size="md">
            <Sparkles className="w-3 h-3" /> AI-Powered Platform
          </Badge>
          <h1 className="font-heading font-bold text-2xl sm:text-4xl mt-4 leading-tight max-w-2xl">
            {t('home.welcome')}
          </h1>
          <p className="text-white/80 text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
            {t('home.subtitle')}
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => navigate('citizenconnect', 'report')}
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:shadow-lg transition-all group"
            >
              Report a Problem
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={toggleAIPanel}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/25 transition-all border border-white/20"
            >
              <Sparkles className="w-4 h-4" />
              Ask IHURIRO AI
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-5 animate-slide-up" >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                s.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                s.color === 'success' ? 'bg-success-50 text-success-600' :
                s.color === 'secondary' ? 'bg-secondary-50 text-secondary-600' :
                'bg-accent-50 text-accent-600'
              }`}>
                {s.icon}
              </div>
              <span className="text-[11px] text-neutral-400 font-medium text-right">{s.detail}</span>
            </div>
            <p className="text-2xl font-bold text-neutral-800 font-heading">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Quick Access Modules */}
      <div>
        <SectionHeader title={t('home.quickAccess')} subtitle="Jump into any service module" icon={<Sparkles className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              icon={m.icon}
              title={m.title}
              description={m.desc}
              color={m.color}
              onClick={() => navigate(m.id)}
            />
          ))}

          {/* AI Assistant Card */}
          <Card hover onClick={toggleAIPanel} className="p-5 border-2 border-dashed border-primary-200 hover:border-primary-400 bg-gradient-to-br from-primary-50/50 to-accent-50/50">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center text-2xl flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-800 font-heading">Ask IHURIRO AI</h3>
                <p className="text-sm text-neutral-500 mt-1">Your intelligent assistant, available on every page</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Featured Services */}
      <div>
        <SectionHeader title={t('home.features')} subtitle="Popular actions you can take right now" icon={<TrendingUp className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featuredServices.map((svc, i) => (
            <Card key={i} hover onClick={() => navigate(svc.module, svc.section)} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  {svc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-800 text-sm">{svc.title}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{svc.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div>
        <SectionHeader
          title={t('home.announcements')}
          subtitle="Latest news and updates"
          icon={<Megaphone className="w-5 h-5" />}
          action={<button onClick={() => navigate('citizenconnect', 'announcements')} className="text-sm text-primary-600 font-semibold hover:text-primary-700">View All</button>}
        />
        <div className="space-y-3">
          {announcements.length === 0 && (
            <Card className="p-6 text-center text-sm text-neutral-500">No announcements published yet.</Card>
          )}
          {announcements.slice(0, 3).map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.category === 'Government' ? 'bg-primary-50 text-primary-600' :
                  a.category === 'Health' ? 'bg-error-50 text-error-600' :
                  a.category === 'Education' ? 'bg-secondary-50 text-secondary-600' :
                  'bg-accent-50 text-accent-600'
                }`}>
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-800 text-sm">{a.title}</h3>
                    <Badge variant="default" size="sm">{a.category}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-[10px] text-neutral-400 mt-1.5">{a.date}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
