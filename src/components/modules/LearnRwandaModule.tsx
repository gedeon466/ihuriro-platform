import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookOpen, ScrollText, Clock, Palette, Sparkles, Scale,
  Gavel, Heart, Users, Video, HelpCircle, FolderOpen,
  ArrowRight, Award, ArrowLeft, Calendar, Search,
  PlayCircle, Download, FileText, BookMarked, Music, Landmark, MapPin, Languages, Globe, Leaf,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Badge, SectionHeader, SubModuleGrid, StatCard, EmptyState, Button, ProgressBar } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiList } from '@/lib/hooks';
import { mockHistoryTimeline } from '@/data/mockData';

const subModules = [
  { id: 'history', label: 'Rwanda History', icon: <ScrollText className="w-5 h-5" />, description: 'Articles on Rwanda\'s rich history' },
  { id: 'timeline', label: 'Historical Timeline', icon: <Clock className="w-5 h-5" />, description: 'Visual chronology of key events' },
  { id: 'culture', label: 'Culture', icon: <Palette className="w-5 h-5" />, description: 'Rwandan culture and arts' },
  { id: 'traditions', label: 'Traditions', icon: <Sparkles className="w-5 h-5" />, description: 'Traditional practices and customs' },
  { id: 'civic', label: 'Civic Education', icon: <Scale className="w-5 h-5" />, description: 'Rights, duties, and governance' },
  { id: 'rights', label: 'Rights & Responsibilities', icon: <Gavel className="w-5 h-5" />, description: 'Citizen rights and duties' },
  { id: 'peace', label: 'Peace & Reconciliation', icon: <Heart className="w-5 h-5" />, description: 'Rwanda\'s unity journey' },
  { id: 'cohesion', label: 'Social Cohesion', icon: <Users className="w-5 h-5" />, description: 'Building a united society' },
  { id: 'videos', label: 'Educational Videos', icon: <Video className="w-5 h-5" />, description: 'Watch and learn' },
  { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle className="w-5 h-5" />, description: 'Test your knowledge' },
  { id: 'materials', label: 'Learning Materials', icon: <FolderOpen className="w-5 h-5" />, description: 'Downloadable resources' },
];

export function LearnRwandaModule() {
  const { currentSection, navigate } = useApp();
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const { data: quizzes } = useApiList(() => api.quizzes.list().then((result) => result.quizzes));

  const startQuiz = (quizId: string) => {
    setActiveQuiz(quizId);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizDone(false);
  };

  const handleAnswer = () => {
    if (selectedAnswer === null) return;
    const quiz = quizzes.find(q => q.id === activeQuiz);
    if (!quiz) return;
    if (selectedAnswer === quiz.questions[currentQ].answer) {
      setScore(s => s + 1);
    }
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelectedAnswer(null);
    } else {
      setQuizDone(true);
    }
  };

  if (!currentSection) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Learn Rwanda"
          subtitle="Discover Rwanda's history, culture, and civic education"
          icon={<BookOpen className="w-5 h-5" />}
        />

        {/* Featured: Historical Timeline Preview */}
        <Card className="p-6 bg-gradient-to-br from-secondary-50 to-primary-50 border-secondary-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary-100 text-secondary-700 flex items-center justify-center">
              <ScrollText className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-800">Rwanda's Journey Through Time</h3>
              <p className="text-sm text-neutral-600 mt-0.5">Explore key moments from pre-colonial kingdoms to modern Rwanda</p>
            </div>
            <Button size="sm" onClick={() => navigate('learnrwanda', 'timeline')}>Explore</Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="History Events" value={mockHistoryTimeline.length} icon={<ScrollText className="w-5 h-5" />} color="secondary" />
          <StatCard label="Quizzes" value={quizzes.length} icon={<HelpCircle className="w-5 h-5" />} color="primary" />
          <StatCard label="Civic Topics" value={8} icon={<Scale className="w-5 h-5" />} color="accent" />
          <StatCard label="Cultural Articles" value={12} icon={<Palette className="w-5 h-5" />} color="warning" />
        </div>

        <SubModuleGrid items={subModules} onSelect={(id) => navigate('learnrwanda', id)} columns={3} />
      </div>
    );
  }

  if (currentSection === 'timeline') {
    return <TimelineSection />;
  }

  if (currentSection === 'quizzes') {
    if (activeQuiz) {
      const quiz = quizzes.find(q => q.id === activeQuiz);
      if (!quiz) return null;

      if (quizDone) {
        return (
          <div className="space-y-6 animate-fade-in">
            <SectionHeader title="Quiz Results" icon={<Award className="w-5 h-5" />} />
            <Card className="p-8 text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary-400 to-secondary-600 text-white flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-neutral-800">
                {score}/{quiz.questions.length}
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                {score === quiz.questions.length ? 'Perfect score! Excellent knowledge of Rwanda.' :
                 score >= quiz.questions.length / 2 ? 'Good job! Keep learning about Rwanda.' :
                 'Keep practicing! Learn more in the History section.'}
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" onClick={() => setActiveQuiz(null)}>Back to Quizzes</Button>
                <Button onClick={() => startQuiz(activeQuiz)}>Try Again</Button>
              </div>
            </Card>
          </div>
        );
      }

      const question = quiz.questions[currentQ];
      return (
        <div className="space-y-6 animate-fade-in">
          <SectionHeader title={quiz.title} icon={<HelpCircle className="w-5 h-5" />} />
          <Card className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-500">Question {currentQ + 1} of {quiz.questions.length}</span>
              <Badge variant="info" size="md">Score: {score}</Badge>
            </div>
            <ProgressBar value={(currentQ / quiz.questions.length) * 100} color="secondary" />
            <h3 className="font-bold text-neutral-800 text-lg mt-6 mb-4">{question.question}</h3>
            <div className="space-y-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAnswer(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedAnswer === i
                      ? 'border-primary-400 bg-primary-50 text-primary-700 font-semibold'
                      : 'border-neutral-200 text-neutral-700 hover:border-primary-300'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-xs font-semibold mr-3">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
            <Button fullWidth className="mt-6" disabled={selectedAnswer === null} onClick={handleAnswer}>
              {currentQ < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Quizzes" subtitle="Test your knowledge of Rwanda" icon={<HelpCircle className="w-5 h-5" />} />
        {quizzes.length === 0 ? (
          <EmptyState
            icon={<HelpCircle className="w-8 h-8" />}
            title="No quizzes yet"
            description="Quizzes will appear here once they are published."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} hover onClick={() => startQuiz(quiz.id)} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-800">{quiz.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{quiz.questions.length} questions</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-300" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (currentSection === 'history') {
    return <HistorySection />;
  }

  if (currentSection === 'civic' || currentSection === 'rights') {
    return <CivicSection isRights={currentSection === 'rights'} />;
  }

  if (currentSection === 'peace' || currentSection === 'cohesion') {
    return <PeaceSection isCohesion={currentSection === 'cohesion'} />;
  }

  if (currentSection === 'culture' || currentSection === 'traditions') {
    return <CultureSection isTraditions={currentSection === 'traditions'} />;
  }

  if (currentSection === 'videos') {
    return <VideosSection />;
  }

  if (currentSection === 'materials') {
    return <MaterialsSection />;
  }

  return (
    <div className="animate-fade-in">
      <EmptyState
        icon={<BookOpen className="w-8 h-8" />}
        title="Section Coming Soon"
        description="This learning section is being developed with full content."
      />
    </div>
  );
}

interface HistoryArticle {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  era: string;
  content: string[];
}

const historyArticles: HistoryArticle[] = [
  {
    id: 'pre-colonial',
    title: 'Pre-Colonial Rwanda: The Kingdom Era',
    excerpt: 'Before colonial powers arrived, Rwanda was a centralized kingdom with a rich social structure organized around clans, lineages, and a powerful monarchy.',
    date: '2026-09-15',
    readTime: '8 min',
    era: 'Pre-1500 — 1899',
    content: [
      'Before the arrival of European colonizers, Rwanda was a well-organized centralized kingdom. The country was ruled by a king known as the Mwami, who was considered sacred and held both political and spiritual authority over the land.',
      'The society was structured around three main groups: the Hutu (mostly farmers), the Tutsi (mostly cattle keepers), and the Twa (hunter-gatherers). These groups shared the same language, Kinyarwanda, the same religion, and the same culture. They were not rigid ethnic groups but rather social categories that could change based on wealth and status.',
      'The kingdom expanded significantly under King Ruganzu II Ndori in the 17th century, who unified various clans and territories into a single nation. The king administered through a system of chiefs who collected tribute and maintained order.',
      'The ubuhake system was a form of cattle client-ship in which a patron provided cattle to a client in exchange for services. This created social bonds and hierarchies that defined relationships in pre-colonial Rwandan society.',
      'Rwandan culture flourished during this period with rich traditions in dance (Intore), music (Inanga), poetry (Ibisigo), and crafts (Imigongo, Agaseke baskets). These cultural expressions remain important symbols of Rwandan identity today.',
    ],
  },
  {
    id: 'colonial',
    title: 'The Colonial Period: German and Belgian Rule',
    excerpt: 'From 1899 to 1962, Rwanda was under colonial administration that reshaped its society and planted seeds of division that would have devastating consequences.',
    date: '2026-09-20',
    readTime: '12 min',
    era: '1899 — 1962',
    content: [
      'In 1899, Rwanda became part of German East Africa. The Germans ruled indirectly through the existing Tutsi monarchy, reinforcing Tutsi dominance in the administration. German rule lasted until World War I.',
      'In 1916, during World War I, Belgian forces occupied Rwanda. After the war, the League of Nations granted Belgium mandate over Rwanda-Urundi. Belgian administration would last until independence in 1962.',
      'The Belgian colonial administration introduced identity cards in 1933 that classified every person as Hutu, Tutsi, or Twa. This rigid ethnic classification transformed what had been fluid social categories into fixed identities, deepening divisions within Rwandan society.',
      'The Belgians favored the Tutsi minority for education, administrative positions, and economic opportunities. This created resentment among the Hutu majority and laid the groundwork for future conflict.',
      'In the 1950s, a political movement emerged demanding Hutu emancipation. The 1959 "Social Revolution" led to the overthrow of the Tutsi monarchy, violence against Tutsis, and the flight of thousands into neighboring countries. This period marked the transition from monarchy to republic.',
    ],
  },
  {
    id: 'independence',
    title: 'Independence and the First Republic',
    excerpt: 'Rwanda gained independence on July 1, 1962, marking the beginning of a new era but also bringing new political challenges.',
    date: '2026-09-25',
    readTime: '10 min',
    era: '1962 — 1990',
    content: [
      'Rwanda gained independence from Belgium on July 1, 1962. Gregoire Kayibanda became the first President of the Republic of Rwanda. The new government was dominated by Hutu leaders who had risen to power during the Social Revolution.',
      'The First Republic was marked by ethnic violence against Tutsis, particularly in 1963 and 1973, when large-scale killings forced more Tutsis to flee to neighboring countries. By the 1970s, hundreds of thousands of Rwandan Tutsis lived as refugees in Uganda, Burundi, Tanzania, and Zaire.',
      'In 1973, Juvenal Habyarimana seized power in a military coup, establishing the Second Republic. His government maintained a one-party system under the MRND party and continued policies that excluded Tutsis from government positions and limited their access to education.',
      'Despite relative stability in the 1970s and 1980s, the underlying ethnic tensions and the unresolved refugee problem persisted. Rwandan Tutsi refugees in Uganda began organizing, eventually forming the Rwandan Patriotic Front (RPF) in 1987.',
      'In October 1990, the RPF launched an armed invasion from Uganda, beginning a civil war. The war, combined with economic crisis and political pressure for democratization, forced the Habyarimana government to accept multi-party politics and begin peace negotiations.',
    ],
  },
  {
    id: 'genocide',
    title: 'The 1994 Genocide Against the Tutsi',
    excerpt: 'One of the darkest chapters in human history, the 1994 genocide left deep scars on Rwanda and the world. Over one million lives were lost in just 100 days.',
    date: '2026-10-01',
    readTime: '15 min',
    era: 'April — July 1994',
    content: [
      'On April 6, 1994, President Juvenal Habyarimana\'s plane was shot down near Kigali airport. This event triggered the genocide against the Tutsi, a systematic campaign of mass killing orchestrated by extremist elements within the government, military, and militia groups.',
      'Within hours of the president\'s death, roadblocks were set up across Kigali. The Presidential Guard and Interahamwe militia began killing Tutsi and moderate Hutu political leaders. The genocide quickly spread across the entire country.',
      'Over the course of approximately 100 days, from April to July 1994, more than one million Rwandans — predominantly Tutsi but also moderate Hutu — were killed. This was one of the most rapid mass killings in recorded history.',
      'The genocide was carried out with devastating efficiency. Lists of targets were prepared in advance. Machetes, clubs, and other weapons were distributed. Radio broadcasts, particularly from Radio Television Libre des Mille Collines (RTLM), incited violence and directed killers to hiding victims.',
      'The international community largely failed to intervene. UN peacekeeping forces (UNAMIR) were present but were not authorized to stop the killings. Most foreign troops were evacuated, leaving Rwandans without protection.',
      'The genocide ended in July 1994 when the Rwandan Patriotic Front (RPF), led by Paul Kagame, captured Kigali and overthrew the genocidal regime. The RPF victory stopped the killings and began a new chapter in Rwanda\'s history.',
      'Every year on April 7, Rwanda commemorates the genocide victims during Kwibuka, a period of 100 days of remembrance. The Kigali Genocide Memorial and other memorial sites across the country serve as places of remembrance and education to ensure such atrocities never happen again.',
    ],
  },
  {
    id: 'reconstruction',
    title: 'Reconstruction and Reconciliation',
    excerpt: 'After 1994, Rwanda embarked on an extraordinary journey of rebuilding and unity, transforming from a devastated nation into a model of reconciliation and development.',
    date: '2026-10-03',
    readTime: '11 min',
    era: '1994 — 2000',
    content: [
      'After the genocide, Rwanda faced enormous challenges: a destroyed infrastructure, a traumatized population, millions of refugees, and the need to rebuild governance from scratch. The new government of national unity, led by the RPF, took on the monumental task of reconstruction.',
      'One of the first priorities was justice. With over 100,000 genocide suspects in prison and a destroyed court system, Rwanda revived the traditional Gacaca court system in 2001. These community-based courts tried genocide cases over a decade, combining justice with truth-telling and reconciliation.',
      'The government abolished the ethnic identity card system. Instead of being identified as Hutu, Tutsi, or Twa, all citizens became simply "Rwandan." The Ndi Umunyarwanda program encouraged people to embrace a shared national identity above ethnic divisions.',
      'The Unity and Reconciliation Commission was established to promote healing and unity. Community dialogue forums, peace education in schools, and memorial programs helped society process the trauma and build a shared future.',
      'Remarkably, Rwanda achieved political stability and security within a few years. Refugees returned home in large numbers. The economy began to recover. By 2000, Rwanda was ready to look forward, and President Paul Kagame launched Vision 2020 — an ambitious development plan.',
    ],
  },
  {
    id: 'vision',
    title: 'Vision 2020 and Vision 2050',
    excerpt: 'Rwanda\'s ambitious development plans aim to transform the country into a middle-income nation and beyond, driven by innovation, technology, and good governance.',
    date: '2026-10-05',
    readTime: '9 min',
    era: '2000 — Present',
    content: [
      'In 2000, President Paul Kagame launched Vision 2020, a comprehensive development program with the goal of transforming Rwanda into a middle-income, knowledge-based economy. The plan focused on good governance, infrastructure, ICT, agriculture, private sector development, and human capital.',
      'Rwanda made remarkable progress under Vision 2020. The economy grew at an average rate of about 8% per year. Poverty rates declined significantly. Kigali transformed into one of the cleanest and safest cities in Africa. Rwanda became known for its efficient governance and zero tolerance for corruption.',
      'Rwanda joined the Commonwealth of Nations in 2008, becoming one of only two member states without a British colonial history. This reflected Rwanda\'s commitment to international cooperation and pan-African unity.',
      'In 2019, Rwanda introduced visa-on-arrival for all African nationals, becoming one of the most open countries on the continent. This was part of Rwanda\'s commitment to the African Continental Free Trade Area and pan-African integration.',
      'Looking ahead, Vision 2050 aims to build on the successes of Vision 2020. The goal is for Rwanda to become an upper-middle-income country by 2035 and a high-income country by 2050. The plan focuses on innovation, technology, quality education, healthcare, and sustainable development.',
      'Today, Rwanda is known as the "Singapore of Africa" for its clean streets, efficient governance, and business-friendly environment. The country hosts major international events and has become a leader in conservation, with mountain gorilla tourism as a flagship success story.',
    ],
  },
];

function HistorySection() {
  const [selectedArticle, setSelectedArticle] = useState<HistoryArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (selectedArticle) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedArticle(null)}>
          Back to Articles
        </Button>

        <Card className="p-6 sm:p-8">
          <Badge variant="warning" size="md">{selectedArticle.era}</Badge>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-800 mt-4">{selectedArticle.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{selectedArticle.date}</span>
            <span>•</span>
            <span>{selectedArticle.readTime} read</span>
          </div>
          <div className="mt-6 space-y-4">
            {selectedArticle.content.map((para, i) => (
              <p key={i} className="text-neutral-700 text-sm sm:text-base leading-relaxed">{para}</p>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedArticle(null)}>
            Back to Articles
          </Button>
        </div>
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? historyArticles.filter((a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.era.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : historyArticles;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Rwanda History" subtitle="Articles on Rwanda's rich and complex history — click any article to read the full story" icon={<ScrollText className="w-5 h-5" />} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search history articles..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-500">No articles found matching your search. Try a different keyword.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} hover onClick={() => setSelectedArticle(a)} className="p-5 cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-100 transition-all">
                  <ScrollText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-800">{a.title}</h3>
                    <Badge variant="warning" size="sm">{a.era}</Badge>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{a.excerpt}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                    <span>{a.date}</span>
                    <span>•</span>
                    <span>{a.readTime} read</span>
                    <span>•</span>
                    <span className="text-secondary-600 font-medium group-hover:text-secondary-700 flex items-center gap-1">
                      Read full article <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface CultureItem {
  id: string;
  title: string;
  shortDesc: string;
  category: string;
  icon: 'dance' | 'art' | 'basket' | 'music' | 'home' | 'ceremony';
  story: string[];
}

const cultureItems: CultureItem[] = [
  {
    id: 'intore',
    title: 'Traditional Dance — Intore',
    shortDesc: 'The famous warrior dance performed with great energy and precision',
    category: 'Dance',
    icon: 'dance',
    story: [
      'The Intore dance is one of Rwanda\'s most iconic cultural treasures. Its name translates to "the chosen ones" or "the elite," and it originated as a performance by warriors of the royal court. The dancers were selected from the most brave and skilled soldiers of the kingdom.',
      'Dancers wear elaborate costumes including headdresses made of grass and beads, and they carry spears and shields. The choreography is precise and powerful, with synchronized movements that tell stories of bravery, victory, and pride. The dancers stomp the ground rhythmically, creating a thunderous beat that resonates with the audience.',
      'The dance is accompanied by traditional drums, particularly the large royal drums (ingoma) and the smaller amadinda. The drummers are as important as the dancers, and the interplay between drum rhythms and dance movements creates a mesmerizing performance.',
      'Today, the Intore dance is performed at national celebrations, cultural festivals, and for visitors. It has been recognized by UNESCO as part of Rwanda\'s intangible cultural heritage. The Rwanda National Ballet travels the world showcasing this dance, making it a symbol of Rwandan identity and pride.',
      'Learning the Intore dance begins at a young age in cultural troupes and schools. It is not just a performance but a transmission of values — discipline, unity, courage, and respect for tradition. Every movement has meaning, and every beat tells a story passed down through generations.',
    ],
  },
  {
    id: 'imigongo',
    title: 'Imigongo Art',
    shortDesc: 'Unique geometric art form using cow dung, originating from the royal court',
    category: 'Visual Art',
    icon: 'art',
    story: [
      'Imigongo is a unique Rwandan art form that dates back to the 18th century. It was created by Prince Kakira of the Gisaka kingdom, who discovered that cow dung could be shaped, dried, and painted to create beautiful geometric patterns on walls.',
      'The process begins with fresh cow dung, which is shaped into raised patterns on a flat surface — typically wood or wall. The designs are geometric, featuring spirals, zigzags, diamonds, and curves. Once the dung dries, it is painted with natural colors: black from soot, white from kaolin clay, red from earth, and ochre from natural pigments.',
      'Traditionally, Imigongo was used to decorate the interior walls of houses, particularly the homes of royalty and important families. The patterns were not only decorative but also carried symbolic meanings related to fertility, prosperity, and protection.',
      'After the 1994 genocide, Imigongo became a powerful tool for reconciliation and economic recovery. Cooperatives of women — both Hutu and Tutsi survivors — began creating Imigongo art for sale, turning this ancient tradition into a source of income and healing. Today, Imigongo cooperatives can be found across Rwanda, particularly in the Eastern Province.',
      'Modern Imigongo artists have expanded beyond wall decoration to create paintings, mirrors, jewelry, and home decor items. The art form has gained international recognition and is exported worldwide, carrying the story of Rwandan creativity and resilience to global audiences.',
    ],
  },
  {
    id: 'agaseke',
    title: 'Agaseke Baskets',
    shortDesc: 'Beautifully woven baskets symbolizing peace, friendship, and goodwill',
    category: 'Craft',
    icon: 'basket',
    story: [
      'The Agaseke basket is one of Rwanda\'s most recognizable cultural symbols. These finely woven baskets have been part of Rwandan life for centuries, used for storing food, carrying gifts, and decorating homes. The conical shape with a lid is distinctive and elegant.',
      'Each basket is handmade using natural fibers — typically sisal, papyrus, or banana leaves. The weaving process is meticulous and time-consuming, requiring great skill and patience. A single large basket can take weeks to complete. The patterns woven into the basket carry meanings, often representing wishes for peace, prosperity, and unity.',
      'The Agaseke basket holds deep cultural significance. It is traditionally given as a gift at weddings, ceremonies, and important occasions, symbolizing goodwill and friendship. The basket is also a symbol of the Rwandan woman\'s skill and creativity.',
      'After the genocide, basket weaving became an important economic activity for women across Rwanda. Cooperatives brought together women from all backgrounds to weave baskets for sale locally and internationally. The "Basket of Hope" initiative helped women earn income and rebuild their lives while preserving this ancient craft.',
      'Today, Agaseke baskets are featured on Rwanda\'s national currency and are one of the country\'s most popular souvenirs. They are sold in markets, galleries, and online, bringing the artistry and story of Rwandan women to homes around the world.',
    ],
  },
  {
    id: 'inanga',
    title: 'Traditional Music — Inanga',
    shortDesc: 'The traditional zither instrument played by storytellers and musicians',
    category: 'Music',
    icon: 'music',
    story: [
      'The Inanga is a traditional Rwandan string instrument that has been played for centuries. It is a trough zither — a hollowed-out piece of wood with strings stretched across it. The instrument produces a deep, resonant sound that accompanies storytelling, singing, and poetry.',
      'Historically, the Inanga was played at the royal court by skilled musicians known as "abasizi" — bards and storytellers who preserved Rwanda\'s oral history through song. These musicians memorized genealogies, historical events, and moral tales, performing them for kings and common people alike.',
      'The most famous Inanga player in modern Rwanda was Sentore Masamba, who traveled the world sharing Rwandan traditional music. His performances preserved ancient songs that might otherwise have been lost. Today, artists like Sophie Nzayisenga continue the tradition, blending the Inanga with contemporary music styles.',
      'Playing the Inanga requires years of practice. The musician plucks the strings with both hands while singing or reciting poetry. The songs often tell stories of kings, heroes, love, and moral lessons. Each song is a piece of Rwanda\'s cultural memory, passed from generation to generation.',
      'The Inanga is more than an instrument — it is a living archive of Rwandan history and values. Efforts are underway to teach young people to play it, ensuring that the songs and stories it carries will not be lost. Cultural centers and music schools across Rwanda now offer Inanga lessons.',
    ],
  },
  {
    id: 'urugwiro',
    title: 'Urugwiro: Traditional Homes',
    shortDesc: 'Beehive-shaped traditional Rwandan houses',
    category: 'Architecture',
    icon: 'home',
    story: [
      'The traditional Rwandan home, known as Urugwiro or Inzu, is a masterpiece of indigenous architecture. These beehive-shaped houses were built entirely from natural materials found in the local environment — reeds, grass, wood, and mud.',
      'The construction of a traditional home was a community effort. Neighbors and family members would come together to build the house, with each person contributing specific skills. The framework was made of flexible wood and reeds, which were then covered with woven grass and sealed with a mixture of mud and cow dung.',
      'The beehive shape was not arbitrary — it was perfectly adapted to Rwanda\'s climate. The rounded design allowed rain to slide off easily, withstood strong winds, and kept the interior cool during hot days and warm during cool nights. The structure was remarkably durable, lasting many years with regular maintenance.',
      'Inside, the home was organized according to cultural traditions. There were specific areas for cooking, sleeping, and storing food. The layout reflected Rwandan social values, with space for family gatherings and hospitality. The hearth at the center was the heart of the home, where stories were told and meals were shared.',
      'While modern construction has largely replaced traditional homes in urban areas, the Urugwiro remains an important cultural symbol. It can still be found in rural areas and is preserved in cultural villages and museums. The design principles of the traditional home — sustainability, community building, and harmony with nature — continue to inspire modern Rwandan architecture.',
    ],
  },
  {
    id: 'ceremonies',
    title: 'Cultural Ceremonies',
    shortDesc: 'Wedding traditions, naming ceremonies, and cultural festivals',
    category: 'Ceremony',
    icon: 'ceremony',
    story: [
      'Rwandan cultural ceremonies are vibrant celebrations that bring families and communities together. They mark important life milestones — birth, coming of age, marriage, and harvest — and are deeply rooted in tradition and social bonds.',
      'Traditional Rwandan weddings are elaborate affairs that involve the entire community. The process begins with the groom\'s family visiting the bride\'s family to request her hand in marriage, a ceremony known as "Gusaba." The groom\'s family brings gifts, and negotiations take place in a formal but joyful atmosphere. The wedding itself, "Urugori," features traditional dress, dancing, food, and blessings from elders.',
      'The naming ceremony, "Kwita Izina," is one of Rwanda\'s most cherished traditions. When a child is born, the family gathers to choose a name that carries meaning — often reflecting the circumstances of birth, hopes for the child\'s future, or family history. This tradition was extended to Rwanda\'s mountain gorillas, where each year newborn gorillas are named in a major national ceremony that attracts international visitors.',
      'Harvest festivals celebrate the bounty of the land and give thanks for prosperity. These festivals feature traditional foods like ugali, beans, bananas, and sorghum beer (urwagwa). Communities gather to eat, dance, and share, reinforcing the values of generosity and togetherness.',
      'Other important ceremonies include Umuganda (monthly community work), the ceremony of the royal drums, and various rites of passage. These ceremonies are not just events — they are the threads that weave Rwandan society together, connecting past, present, and future generations in a shared cultural identity.',
    ],
  },
];

function CultureSection({ isTraditions }: { isTraditions: boolean }) {
  const [selectedItem, setSelectedItem] = useState<CultureItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const iconMap = {
    dance: <Sparkles className="w-5 h-5" />,
    art: <Palette className="w-5 h-5" />,
    basket: <BookOpen className="w-5 h-5" />,
    music: <Heart className="w-5 h-5" />,
    home: <BookOpen className="w-5 h-5" />,
    ceremony: <Sparkles className="w-5 h-5" />,
  };

  if (selectedItem) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedItem(null)}>
          Back to {isTraditions ? 'Traditions' : 'Culture'}
        </Button>

        <Card className="p-6 sm:p-8">
          <Badge variant="accent" size="md">{selectedItem.category}</Badge>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-800 mt-4">{selectedItem.title}</h1>
          <p className="text-sm text-neutral-500 mt-2 italic">{selectedItem.shortDesc}</p>
          <div className="mt-6 space-y-4">
            {selectedItem.story.map((para, i) => (
              <p key={i} className="text-neutral-700 text-sm sm:text-base leading-relaxed">{para}</p>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedItem(null)}>
            Back to {isTraditions ? 'Traditions' : 'Culture'}
          </Button>
        </div>
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? cultureItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cultureItems;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title={isTraditions ? 'Traditions' : 'Culture'}
        subtitle="Rwanda's rich cultural heritage — click any item to read the full story"
        icon={isTraditions ? <Sparkles className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search culture and traditions..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-500">No items found matching your search. Try a different keyword.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} hover onClick={() => setSelectedItem(item)} className="p-5 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-100 transition-all">
                  {iconMap[item.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-800 text-sm">{item.title}</h3>
                    <Badge variant="accent" size="sm">{item.category}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{item.shortDesc}</p>
                  <p className="text-xs text-secondary-600 font-medium mt-2 flex items-center gap-1 group-hover:text-secondary-700">
                    Read full story <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  story: string[];
}

const timelineEvents: TimelineEvent[] = [
  {
    id: 'early-kingdoms',
    year: 'Pre-1500',
    title: 'Early Kingdoms',
    description: 'Rwanda was populated by hunter-gatherers and later Bantu peoples who established kingdoms.',
    story: [
      'Long before recorded history, the land that would become Rwanda was inhabited by hunter-gatherers, ancestors of the Twa people. They lived in forests, hunting small game and gathering wild fruits and honey.',
      'Around the first millennium AD, Bantu-speaking peoples migrated into the region from central and western Africa. They brought with them agriculture, ironworking, and cattle-keeping. Over centuries, they cleared forests, established farms, and built settled communities.',
      'By the 11th century, several small chiefdoms and kingdoms had emerged in the region. These early political units were organized around clan lineages, with leaders who controlled land, cattle, and people. Over time, some of these chiefdoms grew more powerful and absorbed their neighbors.',
      'The gradual consolidation of these chiefdoms laid the foundation for what would become the Kingdom of Rwanda. The concept of "Ubwoko" — clan identity — became central to social organization, with over 20 clans eventually forming the fabric of Rwandan society. These clans transcended later social categories and were a unifying element in pre-colonial Rwanda.',
    ],
  },
  {
    id: 'kingdom-expansion',
    year: '1500-1700',
    title: 'Kingdom Expansion',
    description: 'The Rwandan monarchy expanded its territory under King Ruganzu II, unifying the region.',
    story: [
      'The 16th and 17th centuries were a transformative period in Rwanda\'s history. The Rwandan monarchy, which had been one of several small kingdoms in the region, began a dramatic expansion that would unify most of what is now Rwanda.',
      'King Ruganzu II Ndori, who ruled in the early 17th century, is remembered as one of Rwanda\'s greatest warrior-kings. He led military campaigns that expanded the kingdom\'s borders, bringing neighboring chiefdoms and territories under central rule. His reign marked the consolidation of a unified Rwandan state.',
      'Ruganzu II is also credited with important administrative reforms. He established a more structured system of governance, with chiefs appointed by the king to administer different regions. This system of indirect rule through loyal chiefs would characterize Rwandan governance for centuries.',
      'The expansion period also saw the development of Rwanda\'s royal culture and traditions. The royal court became a center of art, poetry, music, and dance. The Intore warrior dance, the Inanga instrument, and the tradition of royal bards (abasizi) all flourished during this era.',
      'Oral traditions remember Ruganzu II as a legendary figure. Stories tell of his military genius, his magical powers, and his wisdom as a ruler. He is considered one of the founding figures of the Rwandan nation, and his legacy is still celebrated in Rwandan culture today.',
    ],
  },
  {
    id: 'german-colonization',
    year: '1899',
    title: 'German Colonization',
    description: 'Rwanda became part of German East Africa, beginning the colonial period.',
    story: [
      'In 1899, Rwanda was incorporated into German East Africa, marking the beginning of colonial rule. The Germans arrived at a time when the Rwandan monarchy was at the height of its power, under King Mwami Musinga.',
      'Rather than direct rule, the Germans chose to govern Rwanda indirectly through the existing Tutsi monarchy. This approach was cost-effective for the small German colonial administration and reinforced the existing power structure. The Mwami retained his symbolic authority, but real power now flowed from Berlin.',
      'The German presence brought some changes to Rwanda. Christian missionaries, particularly Catholics, began arriving and establishing schools and churches. They converted significant numbers of Rwandans, particularly among the Hutu population, which would have long-term political implications.',
      'German rule was relatively brief and had limited direct impact on most Rwandans\' daily lives. However, it introduced the concept of European overlordship and set the stage for the much more transformative Belgian colonial period that would follow.',
      'When World War I broke out in 1914, Rwanda became a battleground. Belgian forces from neighboring Congo invaded and by 1916 had occupied Rwanda. Germany\'s defeat in the war ended its colonial ambitions in Africa, and Rwanda\'s fate passed to Belgium.',
    ],
  },
  {
    id: 'belgian-administration',
    year: '1916',
    title: 'Belgian Administration',
    description: 'Belgium took control of Rwanda during World War I under League of Nations mandate.',
    story: [
      'In 1916, Belgian forces occupied Rwanda during World War I. After the war, the League of Nations (predecessor to the United Nations) granted Belgium a mandate to administer Rwanda-Urundi, formalizing Belgian colonial rule.',
      'The Belgian administration was far more interventionist than German rule had been. The Belgians transformed Rwanda\'s economy by introducing cash crops like coffee and tea, which became mandatory for farmers. They also built roads, schools, and medical facilities, bringing some modernization.',
      'The most fateful Belgian policy was the introduction of ethnic identity cards in 1933. Every Rwandan was classified as Hutu, Tutsi, or Twa, based primarily on physical characteristics and wealth (those with ten or more cattle were classified as Tutsi). This transformed what had been fluid social categories into rigid, legally-defined ethnic identities.',
      'The Belgians systematically favored the Tutsi minority for education, administrative positions, and economic opportunities. This deepened social divisions and created deep resentment among the Hutu majority. The identity cards made these divisions permanent and inescapable.',
      'By the 1950s, the Belgian administration began to shift its stance. Under pressure from the United Nations and growing Hutu political consciousness, the Belgians started to support Hutu emancipation. This reversal would lead to the 1959 Social Revolution and the overthrow of the Tutsi monarchy, setting the stage for independence and decades of conflict.',
    ],
  },
  {
    id: 'independence-1962',
    year: '1962',
    title: 'Independence',
    description: 'Rwanda gained independence from Belgium on July 1, 1962.',
    story: [
      'Rwanda gained independence from Belgium on July 1, 1962, after a turbulent transition period. The path to independence was marked by the 1959 Social Revolution, in which the Hutu majority overthrew the Tutsi monarchy, and the subsequent violence that forced thousands of Tutsis into exile.',
      'Gregoire Kayibanda, leader of the Parmehutu party, became the first President of the Republic of Rwanda. His government was dominated by Hutu leaders from the central and southern regions of the country. The new republic replaced the monarchy with a republican government.',
      'Independence did not bring peace. The new government faced attacks from Tutsi exiles (known as inyenzi or "cockroaches") who attempted to invade Rwanda from neighboring countries. The government responded with reprisal killings against Tutsis still living in Rwanda, particularly in 1963 and 1973.',
      'By the early 1970s, Kayibanda\'s government had become increasingly authoritarian and divided by regional rivalries within the Hutu political elite. In 1973, General Juvenal Habyarimana, a Hutu from the north, seized power in a bloodless military coup, ending the First Republic.',
      'Independence thus began a new chapter in Rwanda\'s history, but one marked by continued ethnic violence, political authoritarianism, and the unresolved question of Tutsi refugees. These tensions would simmer for decades and ultimately culminate in the catastrophe of 1994.',
    ],
  },
  {
    id: 'liberation-1994',
    year: '1994',
    title: 'Liberation & Tragedy',
    description: 'The 1994 Genocide against the Tutsi ended with the RPF liberation, beginning a new era.',
    story: [
      '1994 is the most significant year in modern Rwandan history. It was simultaneously the year of the genocide against the Tutsi — one of the worst atrocities of the 20th century — and the year of liberation by the Rwandan Patriotic Front (RPF).',
      'On April 6, 1994, President Habyarimana\'s plane was shot down, triggering the genocide. Over approximately 100 days, more than one million Rwandans were killed. The international community stood by as the slaughter unfolded.',
      'The Rwandan Patriotic Front, which had been fighting a civil war since its invasion from Uganda in October 1990, launched a final offensive. Led by Paul Kagame, the RPF fought its way from the north toward Kigali, systematically defeating the genocidal forces while rescuing survivors along the way.',
      'On July 4, 1994, the RPF captured Kigali and overthrew the genocidal regime. This date is celebrated as Liberation Day in Rwanda. The RPF victory ended the genocide and stopped the killing, but the country they inherited was devastated — millions displaced, infrastructure destroyed, and society shattered.',
      'The liberation marked the beginning of a new era. A government of national unity was formed, bringing together Rwandans from different backgrounds. The RPF leadership committed to rebuilding Rwanda as a unified nation, rejecting the ethnic divisions that had been exploited for decades. This commitment would drive the extraordinary transformation that followed.',
    ],
  },
  {
    id: 'vision-2020',
    year: '2000',
    title: 'Vision 2020',
    description: 'President Paul Kagame launched Vision 2020, a development program to transform Rwanda.',
    story: [
      'In 2000, Paul Kagame became President of Rwanda and launched Vision 2020, an ambitious development framework aimed at transforming Rwanda from a low-income, aid-dependent country into a middle-income, knowledge-based economy within twenty years.',
      'Vision 2020 had six pillars: good governance and a capable state; human resource development and a knowledge-based economy; private sector development; infrastructure development; productive and market-oriented agriculture; and regional and international economic integration.',
      'The results were remarkable. Rwanda\'s economy grew at an average of about 8% annually. Poverty rates fell from over 60% to under 40%. Kigali became known as one of the cleanest and safest cities in Africa, with plastic bags banned and monthly community cleaning days (Umuganda) enforced nationwide.',
      'Rwanda made significant investments in technology and innovation. The country became a leader in ICT in Africa, with widespread internet access, e-government services, and the establishment of the Kigali Innovation City project. Rwanda also attracted major international investments and hosted global events.',
      'Vision 2020 was not without challenges. Some critics raised concerns about political space and human rights. However, the overall trajectory of development was undeniable. By 2020, Rwanda had transformed from a devastated post-genocide nation into one of Africa\'s fastest-growing and most forward-looking economies.',
    ],
  },
  {
    id: 'commonwealth-2008',
    year: '2008',
    title: 'Join Commonwealth',
    description: 'Rwanda became a member of the Commonwealth of Nations.',
    story: [
      'In 2008, Rwanda became a member of the Commonwealth of Nations, a remarkable step for a country that was never a British colony. Rwanda was only the second member (after Mozambique) without a British colonial history, signaling its commitment to international engagement.',
      'Rwanda\'s decision to join the Commonwealth was part of a broader strategy to diversify its international partnerships. The government saw membership as an opportunity to access new markets, educational opportunities, and diplomatic relationships beyond its traditional francophone connections.',
      'In preparation for Commonwealth membership, Rwanda made English an official language alongside Kinyarwanda and French. This was a significant shift, as Rwanda had been part of the French-speaking world since colonial times. The move also reflected the English-speaking background of many RPF leaders who had grown up as refugees in Uganda.',
      'Rwanda\'s Commonwealth membership was unanimously approved at the 2009 Commonwealth Heads of Government Meeting (CHOGM) in Trinidad and Tobago. The country formally joined in November 2009, opening new doors for trade, education, and diplomatic cooperation with over 50 member nations.',
      'Rwanda later hosted the Commonwealth Heads of Government Meeting (CHOGM) in Kigali in 2022, a landmark event that showcased the country\'s transformation and its growing role on the international stage. The successful hosting of CHOGM further cemented Rwanda\'s position as a respected member of the international community.',
    ],
  },
  {
    id: 'visa-2019',
    year: '2019',
    title: 'Visa on Arrival',
    description: 'Rwanda introduced visa on arrival for all African nationals, boosting pan-African relations.',
    story: [
      'In 2019, Rwanda made a groundbreaking decision to introduce visa-on-arrival for all African nationals. This move made Rwanda one of the most open countries on the continent for African travelers, removing barriers that had long hindered intra-African travel and trade.',
      'The visa policy was part of Rwanda\'s broader commitment to pan-African integration and the African Continental Free Trade Area (AfCFTA). President Kagame, who was serving as Chairperson of the African Union at the time, was a leading advocate for continental free movement of people and goods.',
      'Before this policy, many African citizens needed to apply for visas in advance, often a costly and time-consuming process. The visa-on-arrival policy meant that any African passport holder could arrive in Rwanda and receive a visa at the airport, dramatically simplifying travel.',
      'The impact was immediate. Tourism increased, business travel became easier, and Rwanda positioned itself as a hub for African conferences and events. Kigali became a popular destination for African entrepreneurs, diplomats, and tourists, boosting the local economy.',
      'This policy reflected Rwanda\'s vision of a united, borderless Africa. It was praised across the continent as a model for other nations to follow. Rwanda continued to advocate for visa-free travel across Africa, and the policy became a cornerstone of the country\'s reputation as a leader in pan-African cooperation.',
    ],
  },
  {
    id: 'vision-2050',
    year: '2024',
    title: 'Vision 2050',
    description: 'Rwanda continues its journey toward becoming a middle-income country by 2035 and high-income by 2050.',
    story: [
      'As Vision 2020 drew to a close, Rwanda launched Vision 2050, an even more ambitious development plan. The goal is for Rwanda to become an upper-middle-income country by 2035 and a high-income country by 2050, transforming the living standards of all Rwandans.',
      'Vision 2050 is built on the lessons and successes of Vision 2020. It focuses on three broad pillars: economic growth, quality of life, and modernization. Key priority areas include high-quality education and healthcare, innovation and technology, sustainable urbanization, and a dynamic private sector.',
      'Rwanda has already made significant strides. The country has become a leader in green energy, with significant investments in solar and hydroelectric power. Kigali is developing as a smart city with digital infrastructure. The tourism sector, centered on gorilla trekking in Volcanoes National Park, is a major revenue earner.',
      'Rwanda has also positioned itself as a center for international events and conferences, with the Kigali Convention Centre and Kigali Arena hosting major gatherings. The country has become known as the "Singapore of Africa" for its clean streets, efficient governance, zero tolerance for corruption, and business-friendly environment.',
      'The journey is not over. Challenges remain, including poverty reduction in rural areas, creating enough jobs for a young and growing population, and balancing development with environmental sustainability. But Rwanda\'s trajectory since 1994 — from devastation to one of Africa\'s brightest development stories — gives reason for optimism that Vision 2050 can be achieved.',
    ],
  },
];

function TimelineSection() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  if (selectedEvent) {
    const selectedIndex = timelineEvents.findIndex((e) => e.id === selectedEvent.id);
    const prevEvent = selectedIndex > 0 ? timelineEvents[selectedIndex - 1] : null;
    const nextEvent = selectedIndex < timelineEvents.length - 1 ? timelineEvents[selectedIndex + 1] : null;

    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedEvent(null)}>
          Back to Timeline
        </Button>

        <Card className="p-6 sm:p-8">
          <Badge variant="warning" size="md">{selectedEvent.year}</Badge>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-800 mt-4">{selectedEvent.title}</h1>
          <p className="text-sm text-neutral-500 mt-2 italic">{selectedEvent.description}</p>
          <div className="mt-6 space-y-4">
            {selectedEvent.story.map((para, i) => (
              <p key={i} className="text-neutral-700 text-sm sm:text-base leading-relaxed">{para}</p>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          {prevEvent ? (
            <Card hover onClick={() => setSelectedEvent(prevEvent)} className="p-4 flex-1 cursor-pointer group">
              <div className="flex items-center gap-3">
                <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-secondary-600 transition-all" />
                <div>
                  <p className="text-xs text-neutral-400">Previous</p>
                  <p className="text-sm font-semibold text-neutral-700 group-hover:text-secondary-700">{prevEvent.title}</p>
                </div>
              </div>
            </Card>
          ) : <div className="flex-1" />}
          {nextEvent ? (
            <Card hover onClick={() => setSelectedEvent(nextEvent)} className="p-4 flex-1 cursor-pointer group">
              <div className="flex items-center gap-3 justify-end">
                <div className="text-right">
                  <p className="text-xs text-neutral-400">Next</p>
                  <p className="text-sm font-semibold text-neutral-700 group-hover:text-secondary-700">{nextEvent.title}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-secondary-600 transition-all" />
              </div>
            </Card>
          ) : <div className="flex-1" />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Historical Timeline" subtitle="Key events in Rwanda's history — click any event to read the full story" icon={<Clock className="w-5 h-5" />} />
      <div className="relative">
        <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-neutral-200 sm:-translate-x-1/2" />
        <div className="space-y-6">
          {timelineEvents.map((event, i) => (
            <div key={event.id} className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
              <div className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full bg-secondary-400 ring-4 ring-white sm:-translate-x-1/2 mt-5 z-10" />
              <div className={`ml-12 sm:ml-0 sm:w-1/2 ${i % 2 === 0 ? 'sm:pr-8 sm:text-right' : 'sm:pl-8'}`}>
                <Card hover onClick={() => setSelectedEvent(event)} className="p-5 cursor-pointer group transition-all hover:shadow-md">
                  <Badge variant="warning" size="md">{event.year}</Badge>
                  <h3 className="font-bold text-neutral-800 mt-2">{event.title}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{event.description}</p>
                  <p className={`text-xs text-secondary-600 font-medium mt-2 flex items-center gap-1 ${i % 2 === 0 ? 'sm:justify-end' : ''}`}>
                    Read full story <ArrowRight className="w-3 h-3" />
                  </p>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TopicItem {
  id: string;
  title: string;
  shortDesc: string;
  category: string;
  story: string[];
}

const civicTopics: TopicItem[] = [
  {
    id: 'constitution',
    title: 'The Rwandan Constitution',
    shortDesc: 'Understanding the supreme law of the land and its key principles',
    category: 'Governance',
    story: [
      'The Constitution of Rwanda was adopted by national referendum in 2003, following the post-genocide transition period. It is the supreme law of the land, establishing the framework for governance, the rights of citizens, and the structure of the state.',
      'The Constitution is built on fundamental principles: fighting the ideology of genocide, eradication of ethnic and regional divisions, power-sharing, accountability, and national unity. These principles were designed to prevent a repeat of the divisions that led to the 1994 genocide.',
      'One of the most innovative features of the Rwandan Constitution is the system of power-sharing. The President and the Speaker of Parliament must come from different political parties. The Cabinet must include members from different political parties. This ensures that no single party can monopolize power and that diverse voices are represented in government.',
      'The Constitution guarantees a wide range of fundamental rights: equality before the law, freedom of speech and assembly, the right to education and health, protection from discrimination, and the right to property. It also establishes the independence of the judiciary and the separation of powers.',
      'The Constitution has been amended several times, most significantly in 2015, when presidential term limits were modified through a public referendum. The amendments reflected the will of the people as expressed through extensive public consultation and debate.',
      'Understanding the Constitution is essential for every citizen. It is the foundation of the rule of law, the protection of rights, and the framework for Rwanda\'s democratic governance. It is both a legal document and a social contract that binds all Rwandans together.',
    ],
  },
  {
    id: 'citizen-rights',
    title: 'Citizen Rights',
    shortDesc: 'The fundamental rights guaranteed to all Rwandan citizens',
    category: 'Rights',
    story: [
      'The Rwandan Constitution guarantees a comprehensive set of fundamental rights and freedoms for all citizens. These rights are rooted in the Universal Declaration of Human Rights and the African Charter on Human and Peoples\' Rights, both of which Rwanda has ratified.',
      'Equality is the cornerstone of citizen rights in Rwanda. The Constitution guarantees equality before the law and equal protection for all citizens, regardless of ethnicity, gender, religion, or social status. Discrimination of any kind is prohibited.',
      'Political rights include the right to vote, the right to stand for office, and freedom of association and assembly. Every Rwandan citizen aged 18 and above has the right to vote in elections. Women hold at least 30% of seats in Parliament, a constitutional guarantee that has made Rwanda a global leader in women\'s political participation.',
      'Economic and social rights include the right to education, with free and compulsory primary education guaranteed by the Constitution. The right to health, the right to work, and the right to property are also protected. The government has a duty to provide basic services and create conditions for economic development.',
      'Civil liberties include freedom of expression, freedom of the press, freedom of religion, and the right to a fair trial. The Constitution prohibits torture, arbitrary arrest, and detention without charge. Every person is presumed innocent until proven guilty.',
      'These rights are not just words on paper. Rwanda has established institutions to protect them, including the National Commission for Human Rights, the Office of the Ombudsman, and an independent judiciary. Citizens can seek redress if their rights are violated, and the government is accountable for upholding these protections.',
    ],
  },
  {
    id: 'citizen-responsibilities',
    title: 'Citizen Responsibilities',
    shortDesc: 'The duties and obligations of every citizen',
    category: 'Responsibilities',
    story: [
      'Alongside rights, the Rwandan Constitution defines the responsibilities and duties of every citizen. These responsibilities are essential for maintaining a functioning, peaceful, and prosperous society. Rights and responsibilities go hand in hand.',
      'Every citizen has the duty to respect the Constitution and the laws of the country. This includes obeying laws, paying taxes, and cooperating with lawful authorities. Respect for the rule of law is the foundation of a stable society.',
      'Participation in Umuganda — the monthly community work program — is a civic duty. On the last Saturday of each month, all Rwandans aged 18-65 are expected to participate in community work such as cleaning streets, building infrastructure, or helping vulnerable community members. Umuganda fosters unity and collective responsibility.',
      'Defending the country is a citizen duty. This includes military service when called upon, but also extends to protecting the nation\'s interests, reporting threats to security, and contributing to national development. The concept of defense includes ideological defense against genocide ideology and divisionism.',
      'Citizens have a responsibility to promote unity and reconciliation. The Constitution explicitly prohibits the promotion of ethnic, regional, or religious divisions. Every citizen has a duty to foster national unity and to reject any ideology that seeks to divide Rwandans.',
      'Other responsibilities include protecting the environment, participating in democratic processes, protecting public property, and contributing to the welfare of the community. These duties reflect the principle that a strong nation is built on the active participation and commitment of its citizens.',
    ],
  },
  {
    id: 'government-structure',
    title: 'The Government Structure',
    shortDesc: 'How Rwanda\'s government is organized — executive, legislative, judicial',
    category: 'Governance',
    story: [
      'Rwanda\'s government is structured around three branches: the Executive, the Legislative, and the Judiciary. This separation of powers ensures checks and balances, preventing any single branch from becoming too powerful.',
      'The Executive branch is headed by the President of the Republic, who is both head of state and head of government. The President is elected by universal suffrage for a five-year term. The President appoints the Prime Minister and members of the Cabinet. The Executive is responsible for implementing laws and running the day-to-day affairs of the state.',
      'The Legislative branch consists of a bicameral Parliament: the Chamber of Deputies and the Senate. The Chamber of Deputies has 80 members elected for five-year terms, with a constitutional guarantee that women hold at least 30% of seats. The Senate has 26 members, including representatives of institutions, former political leaders, and persons of recognized competence. Parliament makes laws, oversees the Executive, and represents the people.',
      'The Judiciary is independent and consists of the Supreme Court, the High Court, and lower courts. The Supreme Court is the highest court in the land. The Judiciary interprets laws, resolves disputes, and ensures justice. Judges are appointed based on qualification and integrity, and the judicial system has been reformed to ensure efficiency and fairness.',
      'Rwanda also has a system of local government that brings governance close to the people. The country is divided into provinces, districts, sectors, cells, and villages (imidugudu). Each level has elected leaders and administrative structures that deliver services and represent the community.',
      'This structure was carefully designed after the genocide to ensure accountability, prevent the concentration of power, and build institutions that serve all Rwandans. The checks and balances between the three branches, combined with independent oversight institutions, form the backbone of Rwanda\'s democratic governance.',
    ],
  },
  {
    id: 'decentralization',
    title: 'Decentralization and Local Government',
    shortDesc: 'Understanding provinces, districts, sectors, and cells',
    category: 'Governance',
    story: [
      'Rwanda is organized into a decentralized system of local government that brings decision-making and service delivery close to the people. This system was designed to promote citizen participation, accountability, and efficient governance.',
      'The country is divided into five provinces: Northern, Southern, Eastern, Western, and the City of Kigali. Each province is headed by a Governor appointed by the President. Provinces coordinate development across districts and ensure national policies are implemented at the regional level.',
      'Below provinces are 30 districts, each headed by an elected Mayor and a District Council. Districts are the primary unit of local government, responsible for delivering services such as education, health, infrastructure, and economic development. Districts have their own budgets and development plans tailored to local needs.',
      'Districts are further divided into sectors, which are divided into cells. Each sector has an executive secretary and a council. Sectors handle services like civil registration, social affairs, and local security. There are 416 sectors across Rwanda.',
      'At the most local level are villages (imidugudu) and cells. Each cell has a coordinator and an advisory committee. This is the level closest to the people, where citizens can directly engage with their leaders, raise concerns, and participate in decision-making. There are 2,148 cells and over 14,000 villages in Rwanda.',
      'Decentralization has been a key driver of Rwanda\'s development success. By bringing governance to the grassroots level, citizens can hold their leaders accountable, services are tailored to local needs, and development planning reflects the priorities of the community. This system has made Rwanda one of the most effectively governed countries in Africa.',
    ],
  },
  {
    id: 'umuganda',
    title: 'Umuganda: Community Work',
    shortDesc: 'The monthly community work program that brings citizens together',
    category: 'Community',
    story: [
      'Umuganda is one of Rwanda\'s most beloved traditions — a monthly community work program held on the last Saturday of every month. The word "Umuganda" translates to "coming together in common purpose to achieve an outcome," and it has become a cornerstone of Rwandan community life.',
      'On Umuganda day, from 8:00 AM to 11:00 AM, businesses close and traffic is minimal. Citizens gather in their neighborhoods to work on community projects: cleaning streets, planting trees, building homes for vulnerable families, repairing roads, constructing classrooms, or making environmental improvements.',
      'Umuganda has deep roots in Rwandan culture. In traditional society, neighbors would come together to help each other with tasks like building houses, harvesting crops, or preparing for ceremonies. The modern Umuganda program revived this practice and made it a national institution.',
      'After the work, the community gathers for a meeting where local leaders share information, discuss community issues, and plan future activities. This meeting component makes Umuganda not just about physical work but also about civic engagement, dialogue, and community building.',
      'The impact of Umuganda is enormous. It is estimated to contribute the equivalent of tens of millions of dollars in labor each year to community development. Roads are maintained, neighborhoods are kept clean, infrastructure is built, and vulnerable people receive help — all through voluntary community effort.',
      'Umuganda also serves a deeper social purpose. It brings together people from all walks of life — rich and poor, old and young, neighbors who might not otherwise interact. In a post-genocide society, this monthly coming together helps build trust, strengthen community bonds, and reinforce the shared identity of being Rwandan.',
    ],
  },
  {
    id: 'elections',
    title: 'Elections and Voting',
    shortDesc: 'How elections work in Rwanda and your right to vote',
    category: 'Democracy',
    story: [
      'Elections are the foundation of democratic governance in Rwanda. Through elections, citizens choose their leaders at all levels — from the President and Members of Parliament to local government officials. The right to vote is guaranteed by the Constitution for all citizens aged 18 and above.',
      'Rwanda holds presidential elections every five years, with the President elected by universal direct suffrage. Parliamentary elections are also held every five years, with members of the Chamber of Deputies elected through a proportional representation system that ensures diverse political representation.',
      'Local government elections are equally important. Citizens elect their district councils, sector coordinators, and cell committee members. These local leaders have the most direct impact on citizens\' daily lives, making local elections a key exercise of democratic rights.',
      'The National Electoral Commission (NEC) is an independent body responsible for organizing and overseeing elections. NEC ensures that elections are free, fair, and transparent. It registers voters, conducts civic education, manages polling stations, and announces results. International observers have consistently praised Rwanda\'s elections for their organization and peaceful conduct.',
      'Voting in Rwanda is a civic duty as well as a right. Citizens are encouraged to register, to be informed about candidates and issues, and to participate actively in the democratic process. A high voter turnout — often above 90% — reflects the importance Rwandans place on democratic participation.',
      'Rwanda has also made efforts to increase women\'s participation in politics. The Constitution guarantees at least 30% of parliamentary seats for women, and in practice, Rwanda has the highest percentage of women in parliament of any country in the world, with over 60% of seats held by women.',
    ],
  },
  {
    id: 'national-symbols',
    title: 'National Symbols',
    shortDesc: 'The flag, anthem, coat of arms, and their meanings',
    category: 'Identity',
    story: [
      'Rwanda\'s national symbols represent the identity, values, and aspirations of the nation. They were redesigned after the genocide to reflect a new beginning and a shared national identity. Each symbol carries deep meaning.',
      'The Rwandan flag, adopted in 2001, has three horizontal stripes: blue, yellow, and green. The blue stripe represents peace and happiness, reflecting the hope for a peaceful future. The yellow stripe represents economic development and the effort to build a prosperous nation. The green stripe represents prosperity and the natural beauty of Rwanda\'s landscape. A yellow sun in the top-right corner represents unity, transparency, and enlightenment.',
      'The national anthem, "Rwanda nziza" (Beautiful Rwanda), celebrates the beauty of the country, the unity of its people, and the commitment to building a better future. It speaks of freedom, development, and the determination of Rwandans to work together. The anthem is sung at schools, national events, and international gatherings.',
      'The coat of arms features a sun, a maize plant, a coffee plant, a basket (agaseke), a cogwheel, and blue rings. Each element has meaning: the sun represents enlightenment, maize and coffee represent agricultural prosperity, the agaseke basket represents cultural heritage and generosity, the cogwheel represents industry, and the rings represent unity. The motto is "Ubumwe, Umurimo, Gukunda Igihugu" — "Unity, Work, Patriotism."',
      'The national motto, "Unity, Work, Patriotism," encapsulates the core values that guide the nation. Unity reflects the commitment to a shared identity above ethnic divisions. Work represents the dedication to building the country through effort and enterprise. Patriotism reflects love for the nation and commitment to its wellbeing.',
      'These symbols are not just emblems — they are daily reminders of what Rwanda stands for and what every citizen is called to embody. They appear on government buildings, official documents, and national celebrations, reinforcing a shared sense of identity and purpose among all Rwandans.',
    ],
  },
];

const peaceTopics: TopicItem[] = [
  {
    id: 'gacaca',
    title: 'Gacaca Courts',
    shortDesc: 'Traditional community justice system used to address the 1994 genocide',
    category: 'Justice',
    story: [
      'The Gacaca court system was one of Rwanda\'s most remarkable innovations in post-genocide justice. The name "Gacaca" comes from the Kinyarwanda word for "grass," referring to the traditional practice of community members gathering on a grassy area to resolve disputes.',
      'After the genocide, Rwanda faced an unprecedented judicial crisis. Over 100,000 suspects were in prison, and the conventional court system was completely overwhelmed. At the existing rate, it would have taken over a century to try all the cases. Something radically different was needed.',
      'In 2001, the government revived and adapted the traditional Gacaca system for genocide cases. Community members were elected as judges (inyangamugayo) — respected persons of integrity from the community. Trials were held in open air, in the communities where the crimes had occurred, with residents attending and participating.',
      'The Gacaca process emphasized truth-telling. Confession and apology could lead to reduced sentences. Witnesses testified publicly. The community heard the full account of what happened, which was essential for both justice and reconciliation. Survivors learned the truth about how their loved ones died, and perpetrators faced their victims and community.',
      'Over a decade of operation, Gacaca courts tried over 1.9 million cases — a feat no conventional justice system could have achieved. While not without criticism, including concerns about due process and fairness, Gacaca is widely recognized as an extraordinary achievement in transitional justice.',
      'The Gacaca courts officially closed in 2012, but their legacy lives on. They demonstrated that community-based justice can work at scale, that truth and accountability are essential for reconciliation, and that even the most devastating crimes can be addressed through a combination of traditional wisdom and pragmatic innovation.',
    ],
  },
  {
    id: 'ndi-umunyarwanda',
    title: 'Ndi Umunyarwanda',
    shortDesc: 'A national program promoting Rwandan identity above ethnic divisions',
    category: 'Identity',
    story: [
      'Ndi Umunyarwanda — "I am Rwandan" — is a national program launched to promote a shared Rwandan identity above ethnic, regional, or religious divisions. It is rooted in the belief that the genocide was made possible by divisions that must be permanently overcome.',
      'The program encourages all citizens to identify first and foremost as Rwandan, rather than as Hutu, Tutsi, or Twa. This is not about forgetting the past but about building a future where ethnic labels no longer determine one\'s rights, opportunities, or social relationships.',
      'Ndi Umunyarwanda includes public dialogues, youth engagement programs, and educational initiatives. Citizens share their stories, confront painful truths about the past, and commit to a shared future. The program creates spaces for honest conversation about identity, belonging, and national unity.',
      'A key component is the acknowledgment of the past. The program encourages all Rwandans — including those whose communities were perpetrators, victims, or bystanders — to acknowledge what happened and to take responsibility for building a different future. This honest reckoning with the past is seen as essential for genuine reconciliation.',
      'The program also works with youth who were born after the genocide, teaching them about Rwanda\'s history while emphasizing that they are part of one united nation. Schools, youth clubs, and community organizations all participate in spreading the message of shared identity.',
      'Ndi Umunyarwanda reflects a fundamental shift in how Rwandans see themselves. By embracing a single national identity, the program aims to make the ethnic divisions that were exploited for decades a thing of the past — ensuring that what happened in 1994 can never happen again.',
    ],
  },
  {
    id: 'urc',
    title: 'Unity and Reconciliation Commission',
    shortDesc: 'Government body dedicated to fostering national unity',
    category: 'Institution',
    story: [
      'The National Unity and Reconciliation Commission (NURC) was established in 1999 to lead Rwanda\'s reconciliation process. It was one of the first institutions created to address the deep wounds left by the genocide and to build a foundation for lasting unity.',
      'The NURC\'s mandate is to coordinate and monitor all national unity and reconciliation initiatives, conduct research on reconciliation, educate the public about unity and peace, and advise the government on policies that promote social cohesion.',
      'One of the NURC\'s key activities has been organizing community dialogue forums (ingando) — residential solidarity camps where citizens from all backgrounds come together for extended periods of discussion, reflection, and community building. These forums have brought together genocide survivors, perpetrators, youth, and community leaders.',
      'The Commission has also conducted extensive research on reconciliation, measuring indicators such as trust between communities, attitudes toward justice, and social cohesion. This data-driven approach has helped Rwanda understand where it stands in the reconciliation process and what more needs to be done.',
      'The NURC has worked extensively with youth, recognizing that the next generation is key to long-term reconciliation. Programs in schools, youth clubs, and community organizations teach conflict resolution, peace-building, and the value of diversity and unity.',
      'In 2018, the NURC was integrated into the Ministry of National Unity and Civic Engagement, reflecting the government\'s commitment to making unity and reconciliation a permanent feature of governance rather than a temporary post-genocide measure.',
    ],
  },
  {
    id: 'memorials',
    title: 'Memorial Sites',
    shortDesc: 'Places of remembrance and education about the genocide',
    category: 'Remembrance',
    story: [
      'Rwanda has established memorial sites across the country to honor the victims of the genocide, educate visitors about what happened, and ensure that the memory of the tragedy is preserved for future generations. These sites are sacred places of remembrance and learning.',
      'The Kigali Genocide Memorial, located in the Gisozi area of Kigali, is the largest and most visited memorial. It serves as the final resting place for over 250,000 victims and includes a museum with exhibits on the genocide\'s history, the lead-up to the violence, the international response, and the post-genocide reconstruction. It also includes exhibits on other genocides around the world.',
      'Other major memorial sites include Murambi, where a former technical school preserves the remains of thousands of victims; Nyamata, a church where thousands were killed; Bisesero, where Tutsi resistance fighters held out against overwhelming forces; and Ntarama, another church site of mass killing. Each site tells a different part of the story.',
      'The memorial sites serve multiple purposes. They are burial grounds where victims are given dignity in death. They are educational centers where visitors — especially young Rwandans — learn about the dangers of ethnic division and the consequences of hatred. They are places of mourning where survivors can grieve and remember.',
      'Every April, during the Kwibuka commemoration period, these sites become the focus of national remembrance ceremonies. Leaders, survivors, and citizens gather to honor the dead, reflect on the past, and renew their commitment to "Never Again."',
      'The memorials also serve an international purpose. Visitors from around the world come to learn about the genocide, to pay their respects, and to reflect on the international community\'s failure to intervene. The sites carry a universal message about the dangers of hatred, indifference, and the urgent need for global responsibility.',
    ],
  },
  {
    id: 'community-dialogue',
    title: 'Community Dialogue',
    shortDesc: 'Forums for discussing reconciliation and building trust',
    category: 'Dialogue',
    story: [
      'Community dialogue is a central pillar of Rwanda\'s reconciliation process. After the genocide, trust between communities was shattered. Rebuilding that trust required not just justice and policy but also honest, face-to-face conversation between people who had been on opposite sides of the violence.',
      'Rwanda established various forums for community dialogue, including Ingando solidarity camps, community work meetings during Umuganda, and local peace committees. These forums bring together survivors, perpetrators, returnees, and other community members to discuss their experiences, fears, and hopes.',
      'In Ingando camps, participants live together for weeks, sharing meals, sleeping in the same quarters, and engaging in structured discussions about history, identity, justice, and reconciliation. The immersive experience breaks down barriers and builds understanding in ways that shorter interactions cannot.',
      'Local peace committees operate at the cell and sector levels, mediating conflicts, facilitating dialogue between individuals, and identifying tensions before they escalate. These grassroots structures ensure that reconciliation is not just a national policy but a daily practice in every community.',
      'Dialogue forums also address practical issues: land disputes between returnees and current occupants, inheritance claims, and the reintegration of released prisoners. By providing a structured, facilitated space for resolving these issues, community dialogue prevents conflicts from festering and undermining reconciliation.',
      'The results have been remarkable. In many communities, survivors and perpetrators now live side by side, participate in Umuganda together, and send their children to the same schools. While the process is ongoing and not without challenges, community dialogue has been essential in transforming Rwanda from a divided society to one working toward genuine unity.',
    ],
  },
  {
    id: 'peace-education',
    title: 'Peace Education',
    shortDesc: 'Teaching peace and conflict resolution in schools',
    category: 'Education',
    story: [
      'Peace education is a core component of Rwanda\'s strategy to build a lasting culture of peace and to ensure that the next generation is equipped to prevent conflict. It is integrated into the national curriculum at all levels of education.',
      'In primary and secondary schools, students learn about the causes and consequences of the genocide, the importance of unity and reconciliation, human rights, conflict resolution, and civic responsibility. The curriculum emphasizes critical thinking, empathy, and the value of diversity.',
      'The Aegis Trust, an international genocide prevention organization, has worked with the Rwandan government to develop peace education materials and train teachers. The Kigali Genocide Memorial houses a peace education center where students and teachers participate in workshops on peace-building and reconciliation.',
      'Peace education goes beyond the classroom. Schools organize debate clubs, peace clubs, and community service projects. Students visit memorial sites, hear testimony from genocide survivors, and engage in discussions about how to build a more just and peaceful society.',
      'Teacher training is a critical component. Teachers are trained not only in the content of peace education but also in participatory teaching methods that encourage dialogue, critical thinking, and respect for different perspectives. This ensures that peace education is not just memorization of facts but a genuine engagement with values and skills.',
      'The long-term goal of peace education is to create a generation of Rwandans who value peace, reject division, and have the skills to resolve conflicts non-violently. By investing in the education of its youth, Rwanda is building the foundation for a future where genocide and mass violence are unthinkable.',
    ],
  },
];

function TopicDetailSection({
  topics,
  selectedTopic,
  setSelectedTopic,
  title,
  subtitle,
  icon,
  backLabel,
}: {
  topics: TopicItem[];
  selectedTopic: TopicItem | null;
  setSelectedTopic: (t: TopicItem | null) => void;
  title: string;
  subtitle: string;
  icon: ReactNode;
  backLabel: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  if (selectedTopic) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedTopic(null)}>
          Back to {backLabel}
        </Button>

        <Card className="p-6 sm:p-8">
          <Badge variant="accent" size="md">{selectedTopic.category}</Badge>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-800 mt-4">{selectedTopic.title}</h1>
          <p className="text-sm text-neutral-500 mt-2 italic">{selectedTopic.shortDesc}</p>
          <div className="mt-6 space-y-4">
            {selectedTopic.story.map((para, i) => (
              <p key={i} className="text-neutral-700 text-sm sm:text-base leading-relaxed">{para}</p>
            ))}
          </div>
        </Card>

        <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedTopic(null)}>
          Back to {backLabel}
        </Button>
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? topics.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topics;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search topics..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-500">No topics found matching your search. Try a different keyword.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} hover onClick={() => setSelectedTopic(t)} className="p-5 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-100 transition-all">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-800 text-sm">{t.title}</h3>
                    <Badge variant="accent" size="sm">{t.category}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{t.shortDesc}</p>
                  <p className="text-xs text-accent-600 font-medium mt-2 flex items-center gap-1 group-hover:text-accent-700">
                    Read full story <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CivicSection({ isRights }: { isRights: boolean }) {
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  return (
    <TopicDetailSection
      topics={civicTopics}
      selectedTopic={selectedTopic}
      setSelectedTopic={setSelectedTopic}
      title={isRights ? 'Rights & Responsibilities' : 'Civic Education'}
      subtitle="Learn about your role as a citizen of Rwanda — click any topic to read the full story"
      icon={isRights ? <Gavel className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
      backLabel={isRights ? 'Rights & Responsibilities' : 'Civic Education'}
    />
  );
}

function PeaceSection({ isCohesion }: { isCohesion: boolean }) {
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const title = isCohesion ? 'Social Cohesion' : 'Peace & Reconciliation';
  return (
    <div className="space-y-6 animate-fade-in">
      {!selectedTopic && (
        <Card className="p-6 bg-gradient-to-br from-accent-50 to-primary-50 border-accent-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-100 text-accent-700 flex items-center justify-center">
              <Heart className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-800">"Remember, Unite, Renew"</h3>
              <p className="text-sm text-neutral-600 mt-0.5">The guiding principle of Rwanda's reconciliation journey</p>
            </div>
          </div>
        </Card>
      )}
      <TopicDetailSection
        topics={peaceTopics}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        title={title}
        subtitle="Rwanda's journey of unity and reconciliation — click any topic to read the full story"
        icon={<Heart className="w-5 h-5" />}
        backLabel={title}
      />
    </div>
  );
}

interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  src: string;
  author: string;
  language: string;
  story: string[];
}

const videoItems: VideoItem[] = [
  {
    id: 'v1',
    title: 'Rwanda Before Independence',
    description: 'Dr Jacques NZABONIMPA explains how Rwandan society was organized before colonial rule.',
    category: 'History',
    duration: '10:08',
    src: '/videos/rwanda-before-independence.mp4',
    author: 'Dr Jacques NZABONIMPA',
    language: 'Kinyarwanda',
    story: [
      'Dr Jacques NZABONIMPA traces the organization of Rwandan society before the arrival of European colonizers — the kingdom, its institutions, clans, and the everyday life of its people. The lecture shows that the Hutu, Tutsi and Twa were social categories within one society, sharing a language, culture, and religion, rather than separate peoples.',
      'The talk explains how the monarchy worked, how land and cattle shaped social standing, and how identities remained fluid across generations. It is an essential foundation for understanding what changed when colonial rule began.',
      'This video pairs with the Rwanda History articles and the Historical Timeline in this module, and is recommended for students and anyone studying pre-colonial Rwanda.',
    ],
  },
  {
    id: 'v2',
    title: 'U Rwanda rwo Hambereye y\'Ubukoroni',
    description: 'How the colonial period introduced ethnic classification and division among Rwandans.',
    category: 'Colonial History',
    duration: '23:33',
    src: '/videos/colonial-divisions-in-rwanda.mp4',
    author: 'RedBlue JD',
    language: 'Kinyarwanda',
    story: [
      'This documentary examines Rwanda before and during colonial rule, focusing on how the German and Belgian administrations used ethnic classification to govern — from the 1933 identity cards that labelled every Rwandan Hutu, Tutsi or Twa, to policies that hardened social differences into fixed political identities.',
      'It follows how these colonial divisions were taught, written into law, and carried into Rwanda\'s post-independence politics, laying the groundwork for discrimination and, ultimately, the 1994 genocide against the Tutsi.',
      'The film is a companion to the History articles on colonial rule and the Peace & Reconciliation section, and helps explain why unity and equal citizenship are central to Rwanda\'s civic education today.',
    ],
  },
  {
    id: 'v3',
    title: 'The Genocide against the Tutsi in Rwanda',
    description: 'The Holocaust Memorial Day Trust explains how the 1994 genocide against the Tutsi unfolded and why remembrance matters.',
    category: 'Genocide History',
    duration: '1:32',
    src: '/videos/genocide-against-the-tutsi-hmd.mp4',
    author: 'Holocaust Memorial Day Trust',
    language: 'English',
    story: [
      'Produced by the Holocaust Memorial Day Trust, this short film introduces the genocide against the Tutsi. In about 100 days between April and July 1994, around one million Tutsi were murdered, along with moderate Hutu and others who opposed the killings.',
      'The video shows how long-standing discrimination, hate propaganda and a state prepared for violence made genocide possible, and it conveys the human cost through testimony and archival material. It also asks why the international community failed to intervene while the killing was under way.',
      'The film is used for Holocaust Memorial Day and genocide education, and it pairs with the Genocide articles and the Historical Timeline in this module. It invites viewers to reflect on remembrance, citizenship and the promise of "never again".',
    ],
  },
  {
    id: 'v4',
    title: 'An Honest Explanation of the Rwanda Genocide',
    description: 'African Biographics traces the roots of the 1994 genocide, from colonial rule and hate media to its aftermath.',
    category: 'Genocide History',
    duration: '49:21',
    src: '/videos/honest-explanation-rwanda-genocide.mp4',
    author: 'African Biographics',
    language: 'English',
    story: [
      'This documentary from African Biographics offers a careful, source-based overview of the genocide against the Tutsi. It begins with Rwandan society, the colonial period and the political tensions that followed independence.',
      'The film follows the events of 1994 — the shooting down of the presidential plane, the killing of opposition leaders, and the organized massacre of Tutsi and moderate Hutu across the country — and examines the role of hate media in mobilizing perpetrators.',
      'It closes with the aftermath: the military campaign that ended the genocide, the refugee crisis, the rebuilding of the state, and Rwanda\'s efforts at justice and reconciliation. It is a strong starting point for students researching how genocide happens and how societies recover.',
    ],
  },
  {
    id: 'v5',
    title: 'LES 600 — A Rwandan Story of Freedom',
    description: 'Nano Studios Africa presents a Rwandan film about freedom, identity and the country\'s journey since 1994.',
    category: 'Rwanda Today',
    duration: '1:54:04',
    src: '/videos/les-600-rwandan-story-of-freedom.mp4',
    author: 'Nano Studios Africa',
    language: 'English',
    story: [
      'LES 600 — A Rwandan Story of Freedom is a film by Nano Studios Africa that tells a Rwandan story of freedom.',
      'It belongs to a growing body of Rwandan-made film and documentary work that reflects on the country\'s history, identity and future, and it gives viewers a long-form look at how Rwandans understand the freedom won in 1994.',
      'It is a companion to the Peace & Reconciliation and Rwanda Today material in this module, and is recommended for viewers who want to go deeper into Rwanda\'s story after the genocide.',
    ],
  },
  {
    id: 'v6',
    title: 'Abasore Twarutashye — Liberation Day',
    description: 'KGL World TV marks Rwanda\'s 4th of July — Liberation Day — with a patriotic Kinyarwanda song.',
    category: 'Music',
    duration: '2:48',
    src: '/videos/abasore-twarutashye.mp4',
    author: 'KGL World TV',
    language: 'Kinyarwanda',
    story: [
      'KGL World TV presents a Kinyarwanda patriotic song released for 4 July, Rwanda\'s Liberation Day. The date marks the end of the 1994 genocide against the Tutsi and the liberation of the country.',
      'Liberation Day is commemorated each year with ceremonies, parades and music. Songs in this tradition remember the struggle, honour those who took part, and celebrate unity and national pride.',
      'The video is a listening resource for Kinyarwanda learners and for anyone exploring how Rwanda expresses memory and identity through music. It pairs with the Culture and Peace & Reconciliation sections.',
    ],
  },
  {
    id: 'v7',
    title: 'Nkumbuye Inkotanyi',
    description: 'Bonhomme performs a patriotic Kinyarwanda song shared through the Ndi Umunyarwanda channel.',
    category: 'Music',
    duration: '4:26',
    src: '/videos/nkumbuye-inkotanyi.mp4',
    author: 'Bonhomme · I\'m Patriot / Ndi Umunyarwanda',
    language: 'Kinyarwanda',
    story: [
      '"Nkumbuye Inkotanyi" ("I miss the Inkotanyi") is performed by Bonhomme and shared through the I\'m Patriot / Ndi Umunyarwanda channel, a platform that promotes Rwandan identity and unity.',
      'The song belongs to a repertoire of patriotic music that remembers the liberation struggle and expresses attachment to the country and its values. It is widely shared around national commemorations.',
      'It is useful for Kinyarwanda learners and for discussions of national identity, memory and reconciliation in the Culture and Peace & Reconciliation sections.',
    ],
  },
  {
    id: 'v8',
    title: 'FOURTEEN',
    description: 'Massamba Intore performs FOURTEEN, a contemporary Rwandan song from his official channel.',
    category: 'Music',
    duration: '2:52',
    src: '/videos/fourteen-massamba-intore.mp4',
    author: 'Massamba Intore',
    language: 'Kinyarwanda',
    story: [
      'FOURTEEN is a song by Massamba Intore, released on the artist\'s official channel. It belongs to the contemporary Rwandan music scene, which blends Kinyarwanda lyrics with modern production.',
      'Contemporary Rwandan artists write about identity, love, hope and everyday life, and their work is followed widely on streaming platforms and at live events in Rwanda and abroad.',
      'The video is a listening resource for Kinyarwanda learners and a starting point for discussing how younger artists carry Rwandan language and culture into global formats.',
    ],
  },
];

function VideosSection() {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = Array.from(new Set(videoItems.map((v) => v.category)));

  if (selectedVideo) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedVideo(null)}>
          Back to Videos
        </Button>

        <Card className="p-6 sm:p-8">
          <video
            key={selectedVideo.id}
            className="w-full aspect-video rounded-xl bg-black mb-6"
            src={selectedVideo.src}
            controls
            preload="metadata"
            playsInline
          />
          <Badge variant="info" size="md">{selectedVideo.category}</Badge>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-800 mt-4">{selectedVideo.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-neutral-400 flex-wrap">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{selectedVideo.duration}</span>
            <span>{selectedVideo.author}</span>
            <span>{selectedVideo.language}</span>
          </div>
          <div className="mt-6 space-y-4">
            {selectedVideo.story.map((para, i) => (
              <p key={i} className="text-neutral-700 text-sm sm:text-base leading-relaxed">{para}</p>
            ))}
          </div>
        </Card>

        <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedVideo(null)}>
          Back to Videos
        </Button>
      </div>
    );
  }

  const visibleCategories = activeCategory === 'All' ? categories : categories.filter((c) => c === activeCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Educational Videos" subtitle="Every video is grouped under its classification — click any video to watch it" icon={<PlayCircle className="w-5 h-5" />} />

      <div className="flex flex-wrap items-center gap-2">
        {['All', ...categories].map((cat) => {
          const count = cat === 'All' ? videoItems.length : videoItems.filter((v) => v.category === cat).length;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'}`}
            >
              {cat} <span className={isActive ? 'text-white/70' : 'text-neutral-400'}>({count})</span>
            </button>
          );
        })}
      </div>

      {visibleCategories.map((category) => {
        const videos = videoItems.filter((v) => v.category === category);
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-heading font-semibold text-lg text-neutral-800">{category}</h2>
              <Badge variant="info" size="sm">{videos.length} {videos.length === 1 ? 'video' : 'videos'}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map((v) => (
                <Card key={v.id} hover onClick={() => setSelectedVideo(v)} className="p-5 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-neutral-800 text-white flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-700 transition-all">
                      <PlayCircle className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-neutral-800 text-sm">{v.title}</h3>
                        <Badge variant="info" size="sm">{v.category}</Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{v.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{v.duration}</span>
                        <span className="truncate">{v.author}</span>
                        <span className="text-primary-600 font-medium flex items-center gap-1">
                          Watch <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MaterialItem {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: string;
  icon: 'pdf' | 'text' | 'book' | 'music' | 'landmark' | 'map' | 'language' | 'globe' | 'leaf';
  story: string[];
}

const materialItems: MaterialItem[] = [
  {
    id: 'm1',
    title: 'Rwanda History Study Guide',
    description: 'A comprehensive study guide covering Rwanda\'s history from kingdoms to modern times.',
    category: 'History',
    fileType: 'PDF',
    icon: 'text',
    story: [
      'This study guide is designed for students and educators who want a structured approach to learning Rwanda\'s history. It covers all major periods — pre-colonial kingdoms, colonial era, independence, the 1994 genocide, and reconstruction — with key dates, figures, and concepts highlighted.',
      'Each chapter includes review questions, discussion prompts, and suggested further reading. The guide is aligned with the national curriculum and can be used alongside the articles in the History section and the events in the Historical Timeline.',
      'The study guide was developed in collaboration with the Rwanda Education Board and historians from the University of Rwanda. It is available as a free PDF download in English and Kinyarwanda.',
    ],
  },
  {
    id: 'm2',
    title: 'The Rwandan Constitution — Full Text',
    description: 'The complete text of the Constitution of Rwanda with explanatory notes.',
    category: 'Civic Education',
    fileType: 'PDF',
    icon: 'landmark',
    story: [
      'This document contains the full text of the Constitution of Rwanda, as amended through 2015. It includes all chapters, articles, and schedules, along with explanatory notes that make the legal language accessible to general readers.',
      'The notes explain key concepts like power-sharing, the separation of powers, fundamental rights, and the role of oversight institutions. Cross-references help readers understand how different parts of the Constitution relate to each other.',
      'This resource is essential for civic education, legal studies, and any citizen who wants to understand the supreme law of the land. It pairs with the Civic Education section articles on the Constitution and government structure.',
    ],
  },
  {
    id: 'm3',
    title: 'Kinyarwanda Language Learning Pack',
    description: 'Beginner-friendly materials for learning Kinyarwanda, including vocabulary and phrases.',
    category: 'Language',
    fileType: 'PDF + Audio',
    icon: 'language',
    story: [
      'Kinyarwanda is the national language of Rwanda, spoken by all Rwandans regardless of their background. This learning pack is designed for beginners — visitors, new residents, or anyone who wants to learn the language.',
      'The pack includes a vocabulary guide with over 500 essential words, common phrases for everyday situations (greetings, shopping, directions, emergencies), a basic grammar guide, and audio recordings of native speakers pronouncing each word and phrase.',
      'Learning Kinyarwanda is a way to connect more deeply with Rwandan culture and people. Even a few words can open doors and create goodwill. The pack is free to download and is regularly updated with new content.',
    ],
  },
  {
    id: 'm4',
    title: 'Rwanda Cultural Heritage Handbook',
    description: 'A guide to Rwanda\'s cultural traditions, dances, music, crafts, and ceremonies.',
    category: 'Culture',
    fileType: 'PDF',
    icon: 'book',
    story: [
      'This handbook is a richly illustrated guide to Rwanda\'s cultural heritage. It covers traditional dances (Intore, Amaraba), music (Inanga, Ingoma), crafts (Imigongo, Agaseke), architecture (Urugwiro), and ceremonies (weddings, Kwita Izina, Umuganda).',
      'Each section includes the history of the tradition, how it is practiced today, where to experience it, and how to learn more. The handbook features photographs from cultural centers across Rwanda and contributions from master artisans, dancers, and musicians.',
      'The handbook is produced in collaboration with the Rwanda Cultural Heritage Academy and is available in English, French, and Kinyarwanda. It is an excellent companion to the Culture and Traditions sections of this platform.',
    ],
  },
  {
    id: 'm5',
    title: 'Gacaca Courts Report',
    description: 'A detailed report on the Gacaca community justice system and its role in post-genocide reconciliation.',
    category: 'Peace & Justice',
    fileType: 'PDF',
    icon: 'landmark',
    story: [
      'This report provides a comprehensive account of the Gacaca court system — how it was established, how it operated, the cases it handled, and its impact on justice and reconciliation in Rwanda.',
      'The report includes statistics on the over 1.9 million cases tried, testimony from judges (inyangamugayo), survivors, and former defendants, and analysis by legal scholars and reconciliation experts. It examines both the achievements and the criticisms of the Gacaca process.',
      'This is an essential resource for anyone studying transitional justice, post-conflict reconciliation, or Rwanda\'s legal system. It pairs with the Peace & Reconciliation section article on Gacaca Courts.',
    ],
  },
  {
    id: 'm6',
    title: 'Rwanda Map and Provinces Guide',
    description: 'An interactive map showing Rwanda\'s provinces, districts, and key geographical features.',
    category: 'Geography',
    fileType: 'PDF',
    icon: 'map',
    story: [
      'This guide provides detailed maps of Rwanda\'s five provinces (Northern, Southern, Eastern, Western, and Kigali City) and all 30 districts. It shows major cities, national parks, lakes, mountains, and transportation networks.',
      'Each province is described with its key characteristics, major economic activities, cultural highlights, and tourist attractions. The guide helps readers understand Rwanda\'s geography and how the decentralization system divides the country administratively.',
      'The guide includes a glossary of geographical terms in Kinyarwanda and English, making it useful for students and visitors alike. It pairs with the Civic Education section article on Decentralization and Local Government.',
    ],
  },
  {
    id: 'm7',
    title: 'Rwanda National Anthem — Score and History',
    description: 'The musical score, lyrics, and history of "Rwanda nziza," the national anthem.',
    category: 'National Symbols',
    fileType: 'PDF + Audio',
    icon: 'music',
    story: [
      'This resource provides the complete lyrics and musical score of "Rwanda nziza" (Beautiful Rwanda), the national anthem of Rwanda. It includes sheet music for voice and piano, along with an audio recording of the anthem performed by the Rwanda Defence Force Band.',
      'The document also tells the story of how the anthem was composed and adopted, replacing the previous anthem after the genocide as part of Rwanda\'s redefinition of its national identity. The lyrics are provided in Kinyarwanda with English and French translations.',
      'This resource is valuable for schools, choirs, and citizens who want to learn and understand their national anthem. It pairs with the Civic Education section article on National Symbols.',
    ],
  },
  {
    id: 'm8',
    title: 'Vision 2050 Overview Document',
    description: 'The official overview of Rwanda\'s Vision 2050 development plan and its key priorities.',
    category: 'Development',
    fileType: 'PDF',
    icon: 'globe',
    story: [
      'This document is the official overview of Vision 2050, Rwanda\'s long-term development plan. It outlines the goal of becoming an upper-middle-income country by 2035 and a high-income country by 2050.',
      'The document covers the three pillars of Vision 2050 — economic growth, quality of life, and modernization — and details the priority areas: education, health, innovation, technology, urbanization, private sector development, and environmental sustainability.',
      'It includes progress data from Vision 2020, targets for Vision 2050, and the strategies for achieving them. This is an essential read for anyone who wants to understand where Rwanda is headed and how it plans to get there. It pairs with the History section article on Vision 2020 and Vision 2050.',
    ],
  },
];

const materialIconMap = {
  pdf: <FileText className="w-5 h-5" />,
  text: <FileText className="w-5 h-5" />,
  book: <BookMarked className="w-5 h-5" />,
  music: <Music className="w-5 h-5" />,
  landmark: <Landmark className="w-5 h-5" />,
  map: <MapPin className="w-5 h-5" />,
  language: <Languages className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  leaf: <Leaf className="w-5 h-5" />,
};

function MaterialsSection() {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (selectedMaterial) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedMaterial(null)}>
          Back to Materials
        </Button>

        <Card className="p-6 sm:p-8">
          <Badge variant="success" size="md">{selectedMaterial.category}</Badge>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-800 mt-4">{selectedMaterial.title}</h1>
          <div className="flex items-center gap-3 mt-3 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{selectedMaterial.fileType}</span>
          </div>
          <p className="text-sm text-neutral-500 mt-2 italic">{selectedMaterial.description}</p>
          <div className="mt-6 space-y-4">
            {selectedMaterial.story.map((para, i) => (
              <p key={i} className="text-neutral-700 text-sm sm:text-base leading-relaxed">{para}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button icon={<Download className="w-4 h-4" />}>Download {selectedMaterial.fileType}</Button>
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedMaterial(null)}>
              Back to Materials
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? materialItems.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : materialItems;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Learning Materials" subtitle="Downloadable resources about Rwanda — click any material to read more and download" icon={<FolderOpen className="w-5 h-5" />} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search materials..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:border-success-400 focus:ring-2 focus:ring-success-100 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-500">No materials found matching your search. Try a different keyword.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} hover onClick={() => setSelectedMaterial(m)} className="p-5 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-success-50 text-success-600 flex items-center justify-center flex-shrink-0 group-hover:bg-success-100 transition-all">
                  {materialIconMap[m.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-800 text-sm">{m.title}</h3>
                    <Badge variant="success" size="sm">{m.fileType}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{m.description}</p>
                  <p className="text-xs text-success-600 font-medium mt-2 flex items-center gap-1">
                    Read more & download <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}