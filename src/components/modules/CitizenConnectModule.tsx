import { useState } from 'react';
import {
  AlertCircle, FileText, Search, Lightbulb, MessageSquare, Building2,
  Megaphone, Shield, ClipboardList, FolderOpen, Users, MapPin,
  Calendar, CheckCircle, Clock, XCircle, Plus, ArrowLeft,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Button, Badge, SectionHeader, SubModuleGrid, EmptyState, StatCard } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiList } from '@/lib/hooks';
import type { Complaint } from '@/types';

const subModules = [
  { id: 'report', label: 'Report a Problem', icon: <AlertCircle className="w-5 h-5" /> },
  { id: 'complaints', label: 'My Complaints', icon: <FileText className="w-5 h-5" /> },
  { id: 'track', label: 'Track Complaint', icon: <Search className="w-5 h-5" /> },
  { id: 'ideas', label: 'Submit an Idea', icon: <Lightbulb className="w-5 h-5" /> },
  { id: 'community', label: 'Community Issues', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'gov-info', label: 'Government Information', icon: <Building2 className="w-5 h-5" /> },
  { id: 'announcements', label: 'Public Announcements', icon: <Megaphone className="w-5 h-5" /> },
  { id: 'security', label: 'Security Information', icon: <Shield className="w-5 h-5" /> },
  { id: 'surveys', label: 'Surveys', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'applications', label: 'My Applications', icon: <FolderOpen className="w-5 h-5" /> },
];

const statusConfig: Record<Complaint['status'], { label: string; variant: 'warning' | 'info' | 'success' | 'error'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'warning', icon: <Clock className="w-3 h-3" /> },
  'in-review': { label: 'In Review', variant: 'info', icon: <Search className="w-3 h-3" /> },
  resolved: { label: 'Resolved', variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', variant: 'error', icon: <XCircle className="w-3 h-3" /> },
};

const surveyCatalog = [
  {
    id: 's1',
    title: 'Community Infrastructure Survey',
    description: 'Help prioritize infrastructure improvements in your sector',
    deadline: '2026-11-20',
    status: 'active' as const,
    respondents: 1240,
    questions: [
      { id: 'q1', text: 'Which infrastructure issue affects you most?', options: ['Roads', 'Street lighting', 'Water supply', 'Drainage'] },
      { id: 'q2', text: 'How would you rate road quality in your cell?', options: ['Very good', 'Good', 'Poor', 'Very poor'] },
      { id: 'q3', text: 'Which service should be fixed first?', options: ['Public transport stops', 'Waste collection', 'Street lighting', 'Water points'] },
      { id: 'q4', text: 'How often do you report problems to local leaders?', options: ['Always', 'Sometimes', 'Rarely', 'Never'] },
    ],
  },
  {
    id: 's2',
    title: 'Public Health Awareness Survey',
    description: 'Share your knowledge and needs around health services',
    deadline: '2026-11-15',
    status: 'active' as const,
    respondents: 856,
    questions: [
      { id: 'q1', text: 'How far is the nearest health centre?', options: ['Under 30 minutes', '30–60 minutes', 'Over 1 hour'] },
      { id: 'q2', text: 'Do you know your child vaccination schedule?', options: ['Yes, fully', 'Partly', 'No'] },
      { id: 'q3', text: 'Which health topic would you like more information on?', options: ['Maternal health', 'Nutrition', 'Malaria prevention', 'Child development'] },
      { id: 'q4', text: 'Have you used a community health worker in the last year?', options: ['Yes', 'No'] },
    ],
  },
  {
    id: 's3',
    title: 'Education Quality Feedback',
    description: 'Rate the quality of education services in your area',
    deadline: '2026-09-30',
    status: 'completed' as const,
    respondents: 2100,
    questions: [
      { id: 'q1', text: 'How satisfied are you with teaching quality?', options: ['Very satisfied', 'Satisfied', 'Dissatisfied'] },
      { id: 'q2', text: 'Are learning materials sufficient?', options: ['Yes', 'Partially', 'No'] },
      { id: 'q3', text: 'How is communication with teachers?', options: ['Excellent', 'Fair', 'Poor'] },
    ],
  },
];

const SURVEY_STORAGE_KEY = 'ihuriro.surveys';

export function CitizenConnectModule() {
  const { currentSection, navigate } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [ideaSuccess, setIdeaSuccess] = useState(false);
  const [ideaSubmitting, setIdeaSubmitting] = useState(false);
  const [govServiceId, setGovServiceId] = useState<string | null>(null);
  const [surveyState, setSurveyState] = useState<
    Record<string, { answers: Record<string, string>; submitted: boolean }>
  >(() => {
    try {
      const raw = localStorage.getItem(SURVEY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [surveyError, setSurveyError] = useState<{ id: string; message: string } | null>(null);

  const persistSurveys = (next: Record<string, { answers: Record<string, string>; submitted: boolean }>) => {
    setSurveyState(next);
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(next));
  };

  const answerSurvey = (surveyId: string, questionId: string, option: string) => {
    const current = surveyState[surveyId] ?? { answers: {}, submitted: false };
    persistSurveys({
      ...surveyState,
      [surveyId]: { ...current, answers: { ...current.answers, [questionId]: option } },
    });
    setSurveyError(null);
  };

  const submitSurvey = (survey: (typeof surveyCatalog)[number]) => {
    const entry = surveyState[survey.id];
    const answers = entry?.answers ?? {};
    if (!survey.questions.every((question) => answers[question.id])) {
      setSurveyError({ id: survey.id, message: `Answer all ${survey.questions.length} questions before submitting.` });
      return;
    }
    persistSurveys({
      ...surveyState,
      [survey.id]: { answers, submitted: true },
    });
    setSurveyError(null);
  };

  const { data: complaints, refresh: refreshComplaints } = useApiList(() =>
    api.complaints.list().then((result) => result.complaints)
  );
  const { data: announcements } = useApiList(() =>
    api.announcements.list().then((result) => result.announcements)
  );
  const { data: govServices } = useApiList(() =>
    api.governmentServices.list().then((result) => result.services)
  );

  const categories = ['Infrastructure', 'Utilities', 'Security', 'Transport', 'Environment', 'Health', 'Education', 'Other'];

  const submitReport = async () => {
    if (!formCategory || !formTitle.trim() || !formDesc.trim() || !formLocation.trim()) {
      setFormError('Please choose a category and fill in every field.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.complaints.create({
        category: formCategory,
        title: formTitle.trim(),
        description: formDesc.trim(),
        location: formLocation.trim(),
      });
      await refreshComplaints();
      setShowForm(false);
      setFormSuccess(true);
      setFormCategory('');
      setFormTitle('');
      setFormDesc('');
      setFormLocation('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit your report. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitIdea = async () => {
    if (!ideaTitle.trim() || !ideaDesc.trim()) {
      setIdeaError('Please add a title and a description.');
      return;
    }
    setIdeaSubmitting(true);
    setIdeaError(null);
    try {
      await api.ideas.create({ title: ideaTitle.trim(), description: ideaDesc.trim() });
      setIdeaSuccess(true);
      setIdeaTitle('');
      setIdeaDesc('');
    } catch (err) {
      setIdeaError(err instanceof Error ? err.message : 'Could not submit your idea. Try again.');
    } finally {
      setIdeaSubmitting(false);
    }
  };

  if (!currentSection) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="CitizenConnect"
          subtitle="Report problems, track complaints, and engage with your community"
          icon={<Users className="w-5 h-5" />}
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('citizenconnect', 'report')}>New Report</Button>}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Reports" value={complaints.length} icon={<FileText className="w-5 h-5" />} color="primary" />
          <StatCard label="Pending" value={complaints.filter(c => c.status === 'pending').length} icon={<Clock className="w-5 h-5" />} color="warning" />
          <StatCard label="In Review" value={complaints.filter(c => c.status === 'in-review').length} icon={<Search className="w-5 h-5" />} color="info" />
          <StatCard label="Resolved" value={complaints.filter(c => c.status === 'resolved').length} icon={<CheckCircle className="w-5 h-5" />} color="success" />
        </div>

        <SubModuleGrid items={subModules} onSelect={(id) => navigate('citizenconnect', id)} />

        <Card className="p-5 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-800">Have a community issue?</h3>
              <p className="text-sm text-neutral-600 mt-0.5">Report it quickly and track progress until resolution.</p>
            </div>
            <Button onClick={() => navigate('citizenconnect', 'report')} size="sm">Report Now</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'report') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Report a Problem" subtitle="Submit a community issue for government review" icon={<AlertCircle className="w-5 h-5" />} />

        {formSuccess && (
          <Card className="p-4 bg-success-50 border-success-200 text-sm text-success-800 flex items-center justify-between gap-4">
            <span>Your report was submitted successfully and is now pending review.</span>
            <Button size="sm" variant="outline" onClick={() => navigate('citizenconnect', 'complaints')}>View Complaints</Button>
          </Card>
        )}

        {showForm ? (
          <Card className="p-6 max-w-2xl">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFormCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                        formCategory === cat
                          ? 'border-primary-400 bg-primary-50 text-primary-700 font-semibold'
                          : 'border-neutral-200 text-neutral-600 hover:border-primary-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Brief summary of the problem"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g., Kimisagara, Nyarugenge"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{formError}</div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowForm(false); setFormError(null); }}>Cancel</Button>
                <Button onClick={submitReport} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-neutral-800 text-lg">Report a Community Problem</h3>
            <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
              Help improve your community by reporting issues like damaged roads, water outages, security concerns, or other problems that need government attention.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6 mb-6">
              {categories.map((cat) => (
                <Badge key={cat} variant="default" size="md">{cat}</Badge>
              ))}
            </div>
            <Button size="lg" icon={<Plus className="w-5 h-5" />} onClick={() => { setShowForm(true); setFormSuccess(false); }}>Start New Report</Button>
          </Card>
        )}
      </div>
    );
  }

  if (currentSection === 'complaints' || currentSection === 'track') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title={currentSection === 'track' ? 'Track Complaint' : 'My Complaints'}
          subtitle="Monitor the status of your submitted reports"
          icon={currentSection === 'track' ? <Search className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        />
        <div className="space-y-3">
          {complaints.length === 0 && (
            <Card className="p-8 text-center text-sm text-neutral-500">You have not submitted any reports yet.</Card>
          )}
          {complaints.map((c) => {
            const status = statusConfig[c.status];
            return (
              <Card key={c.id} className="p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-neutral-800 text-sm">{c.title}</h3>
                      <Badge variant={status.variant} size="sm">{status.icon} {status.label}</Badge>
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.date}</span>
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {c.category}</span>
                      <span className="font-mono text-primary-600">#{c.id.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (currentSection === 'ideas') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Submit an Idea" subtitle="Share your ideas to improve your community" icon={<Lightbulb className="w-5 h-5" />} />
        <Card className="p-6 max-w-2xl">
          <div className="space-y-4">
            {ideaError && (
              <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{ideaError}</div>
            )}
            {ideaSuccess && (
              <div className="p-3 rounded-lg bg-success-50 border border-success-200 text-sm text-success-700">Thanks! Your idea has been submitted.</div>
            )}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Your Idea</label>
              <input
                type="text"
                placeholder="What's your idea?"
                value={ideaTitle}
                onChange={(event) => { setIdeaTitle(event.target.value); setIdeaSuccess(false); }}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">Description</label>
              <textarea
                rows={4}
                placeholder="Explain your idea in detail..."
                value={ideaDesc}
                onChange={(event) => { setIdeaDesc(event.target.value); setIdeaSuccess(false); }}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
              />
            </div>
            <Button icon={<Lightbulb className="w-4 h-4" />} onClick={submitIdea} disabled={ideaSubmitting}>
              {ideaSubmitting ? 'Submitting…' : 'Submit Idea'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'announcements') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Public Announcements" subtitle="Official news and updates from the government" icon={<Megaphone className="w-5 h-5" />} />
        <div className="space-y-3">
          {announcements.length === 0 && (
            <Card className="p-8 text-center text-sm text-neutral-500">No announcements right now.</Card>
          )}
          {announcements.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.category === 'Government' ? 'bg-primary-50 text-primary-600' :
                  a.category === 'Health' ? 'bg-error-50 text-error-600' :
                  a.category === 'Education' ? 'bg-secondary-50 text-secondary-600' :
                  'bg-accent-50 text-accent-600'
                }`}>
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-800">{a.title}</h3>
                    <Badge variant="default" size="sm">{a.category}</Badge>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">{a.content}</p>
                  <p className="text-xs text-neutral-400 mt-2">{a.date}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentSection === 'gov-info') {
    const selectedService = govServices.find((service) => service.id === govServiceId);

    if (selectedService) {
      return (
        <div className="space-y-6 animate-fade-in">
          <SectionHeader
            title={selectedService.title}
            subtitle={selectedService.summary}
            icon={<Building2 className="w-5 h-5" />}
            action={
              <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setGovServiceId(null)}>
                Back
              </Button>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 lg:col-span-2">
              <Badge variant="info" size="sm">{selectedService.category}</Badge>
              <p className="text-sm text-neutral-600 mt-3 leading-relaxed">{selectedService.description}</p>

              <h3 className="font-semibold text-neutral-800 mt-6 mb-2">Requirements</h3>
              <ul className="space-y-2">
                {selectedService.requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-2 text-sm text-neutral-600">
                    <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                    {requirement}
                  </li>
                ))}
              </ul>

              <h3 className="font-semibold text-neutral-800 mt-6 mb-2">How to apply</h3>
              <ol className="space-y-3">
                {selectedService.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-neutral-600">
                    <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="p-5 space-y-4 h-fit">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Fee</p>
                <p className="text-sm text-neutral-700 mt-1">{selectedService.fee}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Processing time</p>
                <p className="text-sm text-neutral-700 mt-1">{selectedService.processingTime}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Where to go</p>
                <p className="text-sm text-neutral-700 mt-1 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                  {selectedService.office}
                </p>
              </div>
              {selectedService.contact && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Contact</p>
                  <p className="text-sm text-neutral-700 mt-1">{selectedService.contact}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Government Information" subtitle="Access government services and information" icon={<Building2 className="w-5 h-5" />} />
        {govServices.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-8 h-8" />}
            title="No services available"
            description="Government service information will appear here once it is published."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {govServices.map((service) => (
              <Card key={service.id} hover onClick={() => setGovServiceId(service.id)} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 text-sm">{service.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{service.summary}</p>
                    <p className="text-xs text-primary-600 mt-2">View requirements, fees and process</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (currentSection === 'security') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Security Information" subtitle="Stay informed about safety in your community" icon={<Shield className="w-5 h-5" />} />
        <Card className="p-5 bg-error-50 border-error-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-error-800">Emergency Numbers</h3>
              <p className="text-sm text-error-700 mt-1">Police: 112 | Ambulance: 912 | Fire: 102</p>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Community Safety Tips', desc: 'Guidelines for keeping your neighborhood safe' },
            { title: 'Report Suspicious Activity', desc: 'How to report security concerns anonymously' },
            { title: 'Neighborhood Watch', desc: 'Join or start a community watch program' },
            { title: 'Emergency Preparedness', desc: 'What to do during natural disasters and emergencies' },
          ].map((s, i) => (
            <Card key={i} hover className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-error-50 text-error-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 text-sm">{s.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{s.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentSection === 'community') {
    const communityIssues = [
      { id: 'ci1', title: 'Potholes on KN 5 Road', location: 'Nyarugenge', votes: 142, status: 'in-review' as const, category: 'Infrastructure' },
      { id: 'ci2', title: 'Street lights not working in Kimisagara', location: 'Nyarugenge', votes: 87, status: 'pending' as const, category: 'Utilities' },
      { id: 'ci3', title: 'Water shortage in Gikondo', location: 'Kicukiro', votes: 213, status: 'resolved' as const, category: 'Utilities' },
      { id: 'ci4', title: 'Need a pedestrian crossing near GS Saint Patrick', location: 'Gasabo', votes: 56, status: 'pending' as const, category: 'Transport' },
      { id: 'ci5', title: 'Waste collection missed in Kacyiru', location: 'Gasabo', votes: 34, status: 'in-review' as const, category: 'Environment' },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Community Issues" subtitle="Issues raised by your community — vote and comment to prioritize" icon={<MessageSquare className="w-5 h-5" />} />
        <div className="space-y-3">
          {communityIssues.map((issue) => {
            const status = statusConfig[issue.status];
            return (
              <Card key={issue.id} className="p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                      {issue.votes}
                    </div>
                    <span className="text-[10px] text-neutral-400">votes</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-neutral-800 text-sm">{issue.title}</h3>
                      <Badge variant={status.variant} size="sm">{status.icon} {status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {issue.location}</span>
                      <span>{issue.category}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />}>Vote</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (currentSection === 'surveys') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Surveys" subtitle="Every survey, its questions and response data in one view" icon={<ClipboardList className="w-5 h-5" />} />
        <div className="space-y-4">
          {surveyCatalog.map((survey) => {
            const entry = surveyState[survey.id];
            const submitted = Boolean(entry?.submitted);
            const answers = entry?.answers ?? {};
            const answeredCount = survey.questions.filter((question) => answers[question.id]).length;
            const responses = survey.status === 'active' && submitted ? survey.respondents + 1 : survey.respondents;

            return (
              <Card key={survey.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-neutral-800">{survey.title}</h3>
                      <Badge variant={survey.status === 'active' ? 'success' : 'default'} size="sm">
                        {survey.status === 'active' ? (submitted ? 'Submitted' : 'Active') : 'Completed'}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500">{survey.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400 flex-wrap">
                      <span>{survey.questions.length} questions</span>
                      <span>{responses.toLocaleString()} responses</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {survey.deadline}</span>
                      {survey.status === 'active' && !submitted && (
                        <span>{answeredCount} of {survey.questions.length} answered</span>
                      )}
                    </div>
                  </div>
                </div>

                {survey.status === 'completed' && (
                  <div className="mt-4 rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-sm text-neutral-600">
                    This survey closed on {survey.deadline}. {responses.toLocaleString()} residents took part.
                  </div>
                )}

                {survey.status === 'active' && submitted && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-success-50 border border-success-200 p-4 text-sm text-success-700">
                    <CheckCircle className="w-4 h-4" />
                    Thanks! Your responses were recorded.
                  </div>
                )}

                {survey.status === 'active' && !submitted && (
                  <div className="mt-5 space-y-4">
                    {survey.questions.map((question, questionIndex) => (
                      <div key={question.id} className="rounded-xl border border-neutral-200 p-4">
                        <p className="text-sm font-medium text-neutral-800 mb-3">
                          {questionIndex + 1}. {question.text}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {question.options.map((option) => (
                            <label
                              key={option}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all ${
                                answers[question.id] === option
                                  ? 'border-primary-400 bg-primary-50 text-primary-800'
                                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`${survey.id}-${question.id}`}
                                checked={answers[question.id] === option}
                                onChange={() => answerSurvey(survey.id, question.id, option)}
                                className="accent-primary-600"
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {surveyError?.id === survey.id && (
                      <p className="text-sm text-error-600">{surveyError.message}</p>
                    )}
                    <Button size="sm" onClick={() => submitSurvey(survey)}>Submit Responses</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (currentSection === 'applications') {
    const applications = [
      { id: 'a1', title: 'National ID Replacement', ref: 'APP-2026-0142', date: '2026-10-02', status: 'in-review' as const },
      { id: 'a2', title: 'Birth Certificate Request', ref: 'APP-2026-0098', date: '2026-09-25', status: 'resolved' as const },
      { id: 'a3', title: 'Driving License Renewal', ref: 'APP-2026-0203', date: '2026-10-05', status: 'pending' as const },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="My Applications" subtitle="Track your government service applications" icon={<FolderOpen className="w-5 h-5" />} />
        <Card className="p-5 bg-primary-50 border-primary-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-800">Need to apply for a service?</h3>
              <p className="text-sm text-neutral-600 mt-0.5">Browse available government services and submit your application online.</p>
            </div>
            <Button size="sm" onClick={() => navigate('citizenconnect', 'gov-info')}>Browse Services</Button>
          </div>
        </Card>
        <div className="space-y-3">
          {applications.map((app) => {
            const status = statusConfig[app.status];
            return (
              <Card key={app.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-neutral-800 text-sm">{app.title}</h3>
                      <Badge variant={status.variant} size="sm">{status.icon} {status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="font-mono text-primary-600">{app.ref}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {app.date}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Details</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <EmptyState
        icon={<FolderOpen className="w-8 h-8" />}
        title="Coming Soon"
        description="This section is being developed. Check back soon!"
      />
    </div>
  );
}
