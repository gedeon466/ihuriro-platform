import {
  Heart, Baby, TrendingUp, Syringe, Apple, Activity, BookHeart,
  Stethoscope, UserCheck, History, Siren, AlertCircle,
  CheckCircle, Clock, ArrowLeft, Search,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Card, Badge, SectionHeader, SubModuleGrid, StatCard, EmptyState, Button, ProgressBar } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiList } from '@/lib/hooks';

const subModules = [
  { id: 'pregnancy', label: 'Pregnancy', icon: <Baby className="w-5 h-5" />, description: 'Week-by-week tracking and information' },
  { id: 'childcare', label: 'Child Care', icon: <Heart className="w-5 h-5" />, description: 'Daily care guidelines for children' },
  { id: 'development', label: 'Child Development', icon: <TrendingUp className="w-5 h-5" />, description: 'Milestone tracking 0-5 years' },
  { id: 'vaccination', label: 'Vaccination', icon: <Syringe className="w-5 h-5" />, description: 'Immunization schedule and records' },
  { id: 'nutrition', label: 'Nutrition', icon: <Apple className="w-5 h-5" />, description: 'Nutritional guidelines by age' },
  { id: 'diseases', label: 'Diseases', icon: <Activity className="w-5 h-5" />, description: 'Common diseases and prevention' },
  { id: 'health-edu', label: 'Health Education', icon: <BookHeart className="w-5 h-5" />, description: 'Educational health resources' },
  { id: 'consultation', label: 'Consultation', icon: <Stethoscope className="w-5 h-5" />, description: 'Request and view consultations' },
  { id: 'professionals', label: 'Health Professionals', icon: <UserCheck className="w-5 h-5" />, description: 'Find doctors and health workers' },
  { id: 'history', label: 'Consultation History', icon: <History className="w-5 h-5" />, description: 'Past consultation records' },
  { id: 'emergency', label: 'Emergency Information', icon: <Siren className="w-5 h-5" />, description: 'Emergency contacts and guidance' },
];

const vaccinationSchedule = [
  { age: 'Birth', vaccine: 'BCG, OPV-0', status: 'done' },
  { age: '6 weeks', vaccine: 'Pentavalent-1, OPV-1, PCV-1, Rota-1', status: 'done' },
  { age: '10 weeks', vaccine: 'Pentavalent-2, OPV-2, PCV-2, Rota-2', status: 'done' },
  { age: '14 weeks', vaccine: 'Pentavalent-3, OPV-3, PCV-3', status: 'done' },
  { age: '9 months', vaccine: 'Measles-Rubella-1', status: 'current' },
  { age: '18 months', vaccine: 'Measles-Rubella-2', status: 'upcoming' },
];

const symptomDatabase: {
  name: string;
  symptoms: string[];
  prevention: string;
  severity: 'high' | 'moderate' | 'low';
  description: string;
}[] = [
  {
    name: 'Malaria',
    symptoms: ['Fever', 'Chills', 'Headache', 'Body aches', 'Sweating', 'Nausea'],
    prevention: 'Use insecticide-treated mosquito nets, eliminate stagnant water around your home, and seek early treatment at a health center.',
    severity: 'high',
    description: 'A mosquito-borne disease common in Rwanda. Prompt treatment is essential.',
  },
  {
    name: 'Pneumonia',
    symptoms: ['Cough', 'Fast breathing', 'Chest pain', 'Fever', 'Loss of appetite'],
    prevention: 'Ensure vaccination (PCV), maintain good nutrition, and avoid exposure to indoor smoke.',
    severity: 'high',
    description: 'A lung infection that can be serious in young children. Seek medical care promptly.',
  },
  {
    name: 'Diarrhea',
    symptoms: ['Diarrhea', 'Dehydration', 'Stomach pain', 'Loss of appetite', 'Fever'],
    prevention: 'Use clean safe drinking water, practice proper sanitation and handwashing, and use oral rehydration salts (ORS).',
    severity: 'moderate',
    description: 'Often caused by contaminated water or food. Watch for dehydration, especially in children.',
  },
  {
    name: 'Measles',
    symptoms: ['Fever', 'Rash', 'Cough', 'Runny nose', 'Red eyes'],
    prevention: 'Ensure your child receives the Measles-Rubella vaccine on schedule at 9 and 18 months.',
    severity: 'high',
    description: 'A highly contagious viral disease. Vaccination is the best prevention.',
  },
  {
    name: 'Common Cold',
    symptoms: ['Cough', 'Runny nose', 'Sneezing', 'Sore throat', 'Headache'],
    prevention: 'Wash hands regularly, avoid close contact with sick people, and maintain good hygiene.',
    severity: 'low',
    description: 'A mild viral infection. Usually resolves on its own within a week.',
  },
  {
    name: 'Malnutrition',
    symptoms: ['Loss of appetite', 'Weight loss', 'Fatigue', 'Slow growth'],
    prevention: 'Provide a balanced diet with enough calories, protein, vitamins, and minerals appropriate for the child\'s age.',
    severity: 'moderate',
    description: 'Can result from insufficient or unbalanced nutrition. Needs dietary correction.',
  },
];

const allSymptoms = [
  'Fever', 'Chills', 'Headache', 'Body aches', 'Sweating', 'Nausea',
  'Cough', 'Fast breathing', 'Chest pain', 'Diarrhea', 'Dehydration',
  'Stomach pain', 'Loss of appetite', 'Rash', 'Runny nose', 'Red eyes',
  'Sneezing', 'Sore throat', 'Weight loss', 'Fatigue', 'Slow growth',
];

const pregnancyWeeks = [
  { week: 'Week 1-4', title: 'Early Pregnancy', desc: 'The baby is the size of a poppy seed. The neural tube begins to form.' },
  { week: 'Week 5-8', title: 'First Trimester', desc: 'Heart begins to beat. Major organs start developing.' },
  { week: 'Week 9-12', title: 'End of First Trimester', desc: 'Fingers and toes are formed. The baby is about 5cm long.' },
  { week: 'Week 13-16', title: 'Second Trimester Begins', desc: 'The baby can make facial expressions. Gender may be visible.' },
  { week: 'Week 17-20', title: 'Halfway Point', desc: 'You may feel the first movements. The baby can hear sounds.' },
  { week: 'Week 21-26', title: 'Growing Active', desc: 'The baby responds to touch and sounds. Lungs are developing.' },
  { week: 'Week 27-30', title: 'Third Trimester', desc: 'Brain develops rapidly. The baby opens and closes eyes.' },
  { week: 'Week 31-36', title: 'Final Stretch', desc: 'The baby gains weight rapidly. Position for birth.' },
  { week: 'Week 37-40', title: 'Ready for Birth', desc: 'The baby is fully developed and ready to be born.' },
];

export function ParentCareModule() {
  const { currentSection, navigate } = useApp();
  const { data: healthTopics } = useApiList(() => api.health.topics().then((result) => result.topics));

  if (!currentSection) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="ParentCare23"
          subtitle="Health information for parents and caregivers"
          icon={<Heart className="w-5 h-5" />}
        />

        {/* Health disclaimer */}
        <Card className="p-4 bg-error-50 border-error-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error-700">
              <span className="font-semibold">Important:</span> ParentCare23 provides general health education only. It is not a substitute for professional medical advice. Always consult a qualified health professional for specific concerns.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Health Topics" value={healthTopics.length} icon={<BookHeart className="w-5 h-5" />} color="error" />
          <StatCard label="Vaccines Tracked" value={6} icon={<Syringe className="w-5 h-5" />} color="primary" />
          <StatCard label="Pregnancy Stages" value={9} icon={<Baby className="w-5 h-5" />} color="secondary" />
          <StatCard label="Emergency Contacts" value={3} icon={<Siren className="w-5 h-5" />} color="warning" />
        </div>

        <SubModuleGrid items={subModules} onSelect={(id) => navigate('parentcare', id)} columns={3} />
      </div>
    );
  }

  if (currentSection === 'pregnancy') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Pregnancy" subtitle="Week-by-week pregnancy information and tracking" icon={<Baby className="w-5 h-5" />} />
        <Card className="p-5 bg-gradient-to-br from-error-50 to-secondary-50 border-error-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-error-100 text-error-600 flex items-center justify-center">
              <Baby className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-800">Current Week: Week 24</h3>
              <p className="text-sm text-neutral-600">Second Trimester — Growing Active</p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={60} color="error" showLabel label="Pregnancy Progress" />
          </div>
        </Card>
        <div className="space-y-3">
          {pregnancyWeeks.map((w, i) => (
            <Card key={i} className={`p-4 ${i === 5 ? 'border-error-200 bg-error-50/30' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  i < 5 ? 'bg-success-100 text-success-600' : i === 5 ? 'bg-error-100 text-error-600' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {i < 5 ? <CheckCircle className="w-5 h-5" /> : i === 5 ? <Clock className="w-5 h-5" /> : 'W'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-800 text-sm">{w.week}</h3>
                    {i === 5 && <Badge variant="error" size="sm">Current</Badge>}
                  </div>
                  <p className="font-medium text-neutral-700 text-sm mt-0.5">{w.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">{w.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentSection === 'vaccination') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Vaccination" subtitle="Rwanda immunization schedule and tracking" icon={<Syringe className="w-5 h-5" />} />
        <Card className="p-4 bg-primary-50 border-primary-100">
          <div className="flex items-start gap-3">
            <Syringe className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary-700">
              Follow the Rwanda Expanded Programme on Immunization (EPI) schedule. Vaccines are free at all health centers.
            </p>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Age</th>
                  <th className="text-left px-5 py-3 font-semibold">Vaccines</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {vaccinationSchedule.map((v, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-800">{v.age}</td>
                    <td className="px-5 py-3 text-neutral-600">{v.vaccine}</td>
                    <td className="px-5 py-3">
                      {v.status === 'done' ? <Badge variant="success"><CheckCircle className="w-3 h-3" /> Completed</Badge> :
                       v.status === 'current' ? <Badge variant="warning"><Clock className="w-3 h-3" /> Due Now</Badge> :
                       <Badge variant="default">Upcoming</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-4 bg-error-50 border-error-100">
          <p className="text-sm text-error-700">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Consult your local health center for specific vaccination advice. This schedule is for general information only.
          </p>
        </Card>
      </div>
    );
  }

  if (currentSection === 'nutrition') {
    const nutritionGuides = [
      { age: '0-6 months', title: 'Exclusive Breastfeeding', desc: 'Breast milk only — no water, no other foods. Feed on demand, at least 8 times in 24 hours.', icon: <Baby className="w-5 h-5" /> },
      { age: '6-8 months', title: 'Introducing Complementary Foods', desc: 'Continue breastfeeding. Add 2-3 meals of mashed foods per day (porridge, mashed vegetables, fruit).', icon: <Apple className="w-5 h-5" /> },
      { age: '9-11 months', title: 'Increasing Variety', desc: 'Continue breastfeeding. 3-4 meals plus 1 snack. Include protein-rich foods (beans, eggs, fish).', icon: <Apple className="w-5 h-5" /> },
      { age: '12-24 months', title: 'Family Foods', desc: 'Continue breastfeeding up to 2 years. 3 meals plus 2 snacks. The child can eat most family foods.', icon: <Apple className="w-5 h-5" /> },
      { age: '2-5 years', title: 'Healthy Eating Habits', desc: '3 balanced meals and healthy snacks. Include variety: grains, vegetables, fruits, protein, dairy.', icon: <Apple className="w-5 h-5" /> },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Nutrition" subtitle="Nutritional guidelines for children 0-5 years" icon={<Apple className="w-5 h-5" />} />
        <div className="space-y-3">
          {nutritionGuides.map((g, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center flex-shrink-0">
                  {g.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" size="sm">{g.age}</Badge>
                    <h3 className="font-semibold text-neutral-800 text-sm">{g.title}</h3>
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">{g.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentSection === 'consultation') {
    return <ConsultationSection />;
  }

  if (currentSection === 'emergency') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Emergency Information" subtitle="Important contacts and guidance for emergencies" icon={<Siren className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: 'Police', number: '112', icon: <Siren className="w-5 h-5" />, color: 'error' },
            { name: 'Ambulance', number: '912', icon: <Heart className="w-5 h-5" />, color: 'error' },
            { name: 'Fire', number: '102', icon: <Activity className="w-5 h-5" />, color: 'warning' },
          ].map((e, i) => (
            <Card key={i} className={`p-5 text-center ${e.color === 'error' ? 'bg-error-50 border-error-200' : 'bg-warning-50 border-warning-200'}`}>
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 ${e.color === 'error' ? 'bg-error-100 text-error-600' : 'bg-warning-100 text-warning-600'}`}>
                {e.icon}
              </div>
              <h3 className="font-semibold text-neutral-800">{e.name}</h3>
              <p className="text-3xl font-bold font-heading mt-1 text-neutral-800">{e.number}</p>
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <h3 className="font-semibold text-neutral-800 mb-3">When to Seek Emergency Help</h3>
          <div className="space-y-2">
            {[
              'Difficulty breathing or shortness of breath',
              'Severe bleeding that does not stop',
              'Loss of consciousness or confusion',
              'High fever (above 39°C) that does not respond to medication',
              'Severe dehydration (sunken eyes, no urination, dry mouth)',
              'Pregnancy complications (severe bleeding, severe pain)',
              'Severe allergic reactions (swelling, difficulty breathing)',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'diseases') {
    const diseases = [
      { name: 'Malaria', symptoms: 'Fever, chills, headache, body aches', prevention: 'Use mosquito nets, insect repellent, and seek early treatment', icon: <Activity className="w-5 h-5" /> },
      { name: 'Diarrhea', symptoms: 'Frequent loose/watery stools, dehydration', prevention: 'Clean water, proper sanitation, oral rehydration salts', icon: <Activity className="w-5 h-5" /> },
      { name: 'Pneumonia', symptoms: 'Cough, fast breathing, chest pain, fever', prevention: 'Vaccination, good nutrition, avoid smoke exposure', icon: <Activity className="w-5 h-5" /> },
      { name: 'Measles', symptoms: 'Fever, rash, cough, runny nose, red eyes', prevention: 'Measles-Rubella vaccination on schedule', icon: <Activity className="w-5 h-5" /> },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Common Diseases" subtitle="Information on common childhood diseases and prevention" icon={<Activity className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {diseases.map((d, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-error-50 text-error-600 flex items-center justify-center flex-shrink-0">
                  {d.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">{d.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1"><span className="font-medium">Symptoms:</span> {d.symptoms}</p>
                  <p className="text-xs text-accent-600 mt-1"><span className="font-medium">Prevention:</span> {d.prevention}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-4 bg-error-50 border-error-100">
          <p className="text-sm text-error-700">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            This information is for educational purposes. If your child shows any symptoms, consult a health professional immediately.
          </p>
        </Card>
      </div>
    );
  }

  if (currentSection === 'development') {
    const milestones = [
      { age: '2 months', milestones: ['Smiles at people', 'Can hold head up', 'Begins to follow things with eyes'] },
      { age: '4 months', milestones: ['Holds head steady', 'Pushes up on elbows', 'Begins to babble'] },
      { age: '6 months', milestones: ['Rolls from tummy to back', 'Begins to sit with support', 'Responds to own name'] },
      { age: '9 months', milestones: ['Sits without support', 'Crawls', 'Uses fingers to feed self'] },
      { age: '12 months', milestones: ['Pulls to stand', 'May take first steps', 'Says first words'] },
      { age: '18 months', milestones: ['Walks alone', 'Says several words', 'Points to show interest'] },
      { age: '2 years', milestones: ['Runs', 'Uses 2-word phrases', 'Follows simple instructions'] },
      { age: '3 years', milestones: ['Climbs well', 'Speaks in short sentences', 'Plays with other children'] },
      { age: '4-5 years', milestones: ['Hops on one foot', 'Tells stories', 'Counts to 10'] },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Child Development" subtitle="Track your child's developmental milestones (0-5 years)" icon={<TrendingUp className="w-5 h-5" />} />
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <Card key={i} className="p-5">
              <Badge variant="info" size="md">{m.age}</Badge>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {m.milestones.map((ms, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                    {ms}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentSection === 'childcare') {
    const guides = [
      { title: 'Safe Sleep', detail: 'Place babies on their backs on a firm, flat surface. Keep pillows, blankets, and soft toys away from the sleeping area.' },
      { title: 'Hygiene and Bathing', detail: 'Wash hands before handling food or medicine. Keep the cord area clean and dry, and supervise children around water.' },
      { title: 'Growth Monitoring', detail: 'Visit your health center for regular weight, height, and development checks, especially during the first five years.' },
      { title: 'Positive Care', detail: 'Talk, read, and play with your child every day. Use calm guidance and never leave a young child without responsible supervision.' },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Child Care" subtitle="Daily care, safety, and wellbeing guidance" icon={<Heart className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {guides.map((guide) => (
            <Card key={guide.title} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-50 text-error-600 flex items-center justify-center flex-shrink-0"><Heart className="w-5 h-5" /></div>
                <div><h3 className="font-semibold text-neutral-800 text-sm">{guide.title}</h3><p className="text-sm text-neutral-600 mt-2 leading-relaxed">{guide.detail}</p></div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-4 bg-error-50 border-error-100"><p className="text-sm text-error-700"><AlertCircle className="w-4 h-4 inline mr-1" />For urgent concerns or unusual symptoms, contact a qualified health professional.</p></Card>
      </div>
    );
  }

  if (currentSection === 'health-edu') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Health Education" subtitle="Trusted educational resources for families" icon={<BookHeart className="w-5 h-5" />} />
        {healthTopics.length === 0 ? (
          <EmptyState
            icon={<BookHeart className="w-8 h-8" />}
            title="No topics yet"
            description="Health education topics will appear here once they are published."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthTopics.map((topic) => (
              <Card key={topic.id} className="p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-error-50 text-error-600 flex items-center justify-center mb-3"><BookHeart className="w-5 h-5" /></div>
                <Badge variant="error" size="sm">{topic.category}</Badge>
                <h3 className="font-semibold text-neutral-800 text-sm mt-3">{topic.title}</h3>
                <p className="text-xs text-neutral-500 mt-2">{topic.excerpt}</p>
                <p className="text-xs text-neutral-400 mt-2">{topic.readMinutes} min read</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (currentSection === 'professionals') {
    const professionals = [
      { name: 'Dr. Aline Mukamana', role: 'General Practitioner', facility: 'Kigali University Teaching Hospital', availability: 'Available today' },
      { name: 'Nurse Jean Bosco', role: 'Maternal and Child Health', facility: 'Kacyiru Health Center', availability: 'Available tomorrow' },
      { name: 'Dr. Diane Uwase', role: 'Pediatrician', facility: 'King Faisal Hospital', availability: 'Next appointment: Oct 14' },
      { name: 'Midwife Clarisse Ingabire', role: 'Midwife', facility: 'Nyarugenge District Hospital', availability: 'Available today' },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Health Professionals" subtitle="Find qualified care providers and facilities" icon={<UserCheck className="w-5 h-5" />} />
        <div className="flex items-center gap-3"><div className="relative flex-1"><Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" /><input className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400" placeholder="Search professionals or specialties..." /></div><Button size="sm" variant="outline">Filter</Button></div>
        <div className="space-y-3">
          {professionals.map((professional) => (
            <Card key={professional.name} className="p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0"><UserCheck className="w-6 h-6" /></div><div className="flex-1"><h3 className="font-semibold text-neutral-800 text-sm">{professional.name}</h3><p className="text-xs text-neutral-500 mt-1">{professional.role} • {professional.facility}</p><p className="text-xs text-success-600 mt-2">{professional.availability}</p></div><Button size="sm">Request Visit</Button></div></Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentSection === 'history') {
    const history = [
      { date: '2026-09-18', provider: 'Kacyiru Health Center', reason: 'Child wellness check', status: 'Completed', notes: 'Growth and development reviewed' },
      { date: '2026-08-12', provider: 'Nyarugenge District Hospital', reason: 'Vaccination visit', status: 'Completed', notes: 'Routine vaccination recorded' },
      { date: '2026-07-05', provider: 'Kigali University Teaching Hospital', reason: 'Antenatal care', status: 'Completed', notes: 'Routine check-up' },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Consultation History" subtitle="Your previous health visits and consultation records" icon={<History className="w-5 h-5" />} />
        <div className="space-y-3">
          {history.map((visit) => (
            <Card key={`${visit.date}-${visit.provider}`} className="p-5"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center flex-shrink-0"><History className="w-5 h-5" /></div><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-neutral-800 text-sm">{visit.reason}</h3><Badge variant="success" size="sm">{visit.status}</Badge></div><p className="text-xs text-neutral-500 mt-1">{visit.provider}</p><p className="text-xs text-neutral-400 mt-1">{visit.date} • {visit.notes}</p></div><Button size="sm" variant="outline">View</Button></div></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <EmptyState
        icon={<Heart className="w-8 h-8" />}
        title="Section Coming Soon"
        description="This health section is being developed with full functionality."
      />
    </div>
  );
}

function ConsultationSection() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [results, setResults] = useState<{ name: string; matchCount: number; matchPercent: number; severity: string; prevention: string; description: string }[] | null>(null);
  const [searching, setSearching] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleCheck = () => {
    if (selectedSymptoms.length === 0) return;
    setSearching(true);
    setTimeout(() => {
      const matched = symptomDatabase
        .map((disease) => {
          const matchCount = disease.symptoms.filter((s) => selectedSymptoms.includes(s)).length;
          return {
            name: disease.name,
            matchCount,
            matchPercent: Math.round((matchCount / disease.symptoms.length) * 100),
            severity: disease.severity,
            prevention: disease.prevention,
            description: disease.description,
          };
        })
        .filter((r) => r.matchCount > 0)
        .sort((a, b) => b.matchPercent - a.matchPercent);
      setResults(matched);
      setSearching(false);
    }, 500);
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setResults(null);
  };

  const severityConfig: Record<string, { label: string; variant: 'error' | 'warning' | 'success' }> = {
    high: { label: 'Urgent — see a health professional', variant: 'error' },
    moderate: { label: 'Schedule a consultation soon', variant: 'warning' },
    low: { label: 'Monitor at home', variant: 'success' },
  };

  if (results) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Consultation Results" subtitle="Based on your selected symptoms" icon={<Stethoscope className="w-5 h-5" />}
          action={<Button size="sm" variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={handleReset}>Back to Symptoms</Button>} />

        {results.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-success-50 text-success-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-neutral-800 text-lg">No Matching Conditions</h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
              Your selected symptoms don't closely match any condition in our database. If you're still concerned, please consult a health professional.
            </p>
            <Button className="mt-4" onClick={handleReset} icon={<ArrowLeft className="w-4 h-4" />}>Check Again</Button>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {results.map((r, i) => {
                const sev = severityConfig[r.severity] || severityConfig.moderate;
                return (
                  <Card key={i} className={`p-5 ${i === 0 ? 'border-error-200 bg-error-50/30' : ''}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-neutral-800 text-base">{r.name}</h3>
                          {i === 0 && <Badge variant="error" size="sm">Best Match</Badge>}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">{r.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold font-heading text-neutral-800">{r.matchPercent}%</p>
                        <p className="text-[11px] text-neutral-400">{r.matchCount} symptom(s) matched</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge variant={sev.variant} size="sm">
                        {sev.label}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Prevention & Care</p>
                      <p className="text-sm text-neutral-700">{r.prevention}</p>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-4 bg-error-50 border-error-100">
              <p className="text-sm text-error-700">
                <AlertCircle className="w-4 h-4 inline mr-1 flex-shrink-0" />
                This symptom checker provides general information only and is not a medical diagnosis. Please consult a qualified health professional for proper diagnosis and treatment.
              </p>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} icon={<ArrowLeft className="w-4 h-4" />}>Check Again</Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Consultation" subtitle="Select your symptoms to get possible conditions and guidance" icon={<Stethoscope className="w-5 h-5" />} />

      <Card className="p-5">
        <h3 className="font-semibold text-neutral-800 mb-1">Select Your Symptoms</h3>
        <p className="text-sm text-neutral-500 mb-4">Check all symptoms you or your child are experiencing.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {allSymptoms.map((symptom) => {
            const checked = selectedSymptoms.includes(symptom);
            return (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  checked
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                  checked ? 'bg-primary-500 border-primary-500 text-white' : 'border-neutral-300'
                }`}>
                  {checked && <CheckCircle className="w-3.5 h-3.5" />}
                </span>
                {symptom}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleCheck}
          disabled={selectedSymptoms.length === 0 || searching}
          icon={searching ? undefined : <Search className="w-4 h-4" />}
        >
          {searching ? 'Checking symptoms...' : `Request Consultation (${selectedSymptoms.length} selected)`}
        </Button>
        {selectedSymptoms.length > 0 && (
          <Button variant="outline" onClick={handleReset}>Clear All</Button>
        )}
      </div>

      {selectedSymptoms.length > 0 && (
        <Card className="p-4 bg-primary-50 border-primary-100">
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">Selected Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map((s) => (
              <Badge key={s} variant="info" size="sm">{s}</Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 bg-error-50 border-error-100">
        <p className="text-sm text-error-700">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          For medical emergencies, call 912 (Ambulance) or visit the nearest hospital immediately. Do not use this consultation system for emergencies.
        </p>
      </Card>
    </div>
  );
}
