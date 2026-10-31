import type { ModuleId, UserRole } from '@/types';

interface AIContext {
  module: ModuleId;
  section?: string;
  role: UserRole;
  language: string;
}

interface AIKnowledge {
  module: ModuleId;
  moduleLabel: string;
  suggestedQuestions: string[];
  knowledgeBase: string[];
  roleRestrictions: Record<UserRole, string>;
}

export const aiKnowledge: Record<ModuleId, AIKnowledge> = {
  home: {
    module: 'home',
    moduleLabel: 'General Platform',
    suggestedQuestions: [
      'What can I do on this website?',
      'How do I register for an account?',
      'What services are available?',
      'How do I change my password?',
    ],
    knowledgeBase: [
      'IHURIRO Rwanda is a unified digital platform connecting citizens, education, health, business, and Rwanda\'s heritage.',
      'The platform offers five main modules: CitizenConnect for government services, Education for school management, ParentCare23 for health, Biz360 for business, and Learn Rwanda for history and culture.',
      'Users can register as citizens, students, parents, teachers, business owners, health professionals, government officers, or admins.',
      'The platform supports three languages: Kinyarwanda, English, and French.',
      'An AI assistant is available on every page to help users navigate and answer questions.',
    ],
    roleRestrictions: {
      citizen: 'You can access general platform information and citizen-specific services.',
      student: 'You can access your own academic information and general platform features.',
      parent: 'You can access information about your children and general platform features.',
      teacher: 'You can access your classes, students, and teaching tools.',
      business: 'You can access your business data and management tools.',
      health: 'You can access authorized health information and consultation tools.',
      government: 'You can access government services and citizen complaint management.',
      admin: 'You have access to administrative tools and platform management.',
    },
  },
  citizenconnect: {
    module: 'citizenconnect',
    moduleLabel: 'CitizenConnect',
    suggestedQuestions: [
      'How do I report a community problem?',
      'How do I track my complaint?',
      'How do I submit an idea to the government?',
      'Where can I find government information?',
    ],
    knowledgeBase: [
      'CitizenConnect allows citizens to report problems like damaged roads, water issues, security concerns, and other community issues.',
      'To report a problem: navigate to Report a Problem, select a category, describe the issue, add location details, and optionally attach a photo.',
      'Complaints can be tracked using the Track Complaint feature with your complaint reference number.',
      'Citizens can submit ideas and suggestions through the Submit an Idea feature.',
      'Government information and public announcements are available in the Government Information section.',
      'Security information is available to keep citizens informed about safety in their communities.',
    ],
    roleRestrictions: {
      citizen: 'You can report problems, track your complaints, submit ideas, and view public information.',
      student: 'You can view public government information and announcements.',
      parent: 'You can report community problems and view public information relevant to your family.',
      teacher: 'You can report school-related issues and view public information.',
      business: 'You can report business-related community issues and view government information.',
      health: 'You can report health-related community issues and view public information.',
      government: 'You can manage citizen complaints, respond to reports, and publish government information.',
      admin: 'You have full access to all CitizenConnect features and management tools.',
    },
  },
  education: {
    module: 'education',
    moduleLabel: 'Education',
    suggestedQuestions: [
      'How can I check my child\'s attendance?',
      'Where are my lessons?',
      'How do I view my results?',
      'How do I receive school SMS notifications?',
    ],
    knowledgeBase: [
      'The Education module manages students, teachers, schools, classes, subjects, lessons, assignments, quizzes, attendance, academic records, and progress.',
      'Teachers can register students, assign classes, record attendance, and track academic performance.',
      'Parents can view their children\'s attendance, academic records, and receive SMS notifications about school activities.',
      'Students can access learning materials, assignments, quizzes, and view their academic results.',
      'Dropout monitoring tracks attendance patterns and progress indicators to identify students needing attention.',
      'Parent communication includes attendance SMS, school announcements, meeting notices, and authorized student-related messages.',
      'Reports include student performance, attendance, class performance, school reports, and progress reports.',
    ],
    roleRestrictions: {
      citizen: 'You can view general education information.',
      student: 'You can access your own lessons, assignments, quizzes, attendance, and academic records.',
      parent: 'You can view your children\'s attendance, progress, and receive school communications.',
      teacher: 'You can manage your classes, record attendance, create assignments, and view student performance.',
      business: 'You can view general education information.',
      health: 'You can view general education information.',
      government: 'You can view school reports and education statistics.',
      admin: 'You have full access to all education management features.',
    },
  },
  parentcare: {
    module: 'parentcare',
    moduleLabel: 'ParentCare23',
    suggestedQuestions: [
      'What information is available about child vaccination?',
      'How can I track my pregnancy week by week?',
      'Where can I find nutrition information for my child?',
      'How can I request a consultation?',
    ],
    knowledgeBase: [
      'ParentCare23 provides general health information about pregnancy, child care, child development, vaccination, nutrition, diseases, and health education.',
      'The pregnancy section offers week-by-week information and pregnancy tracking.',
      'Vaccination information includes the Rwanda immunization schedule and vaccine records.',
      'Nutrition guidelines cover recommended foods for different age groups.',
      'IMPORTANT: ParentCare23 provides general health education only. It is NOT a substitute for professional medical advice.',
      'For specific health concerns, always consult a qualified health professional or visit a health center.',
      'Emergency information is available with guidance on when to seek immediate medical help.',
      'Consultation requests can be made through the Consultation section.',
    ],
    roleRestrictions: {
      citizen: 'You can access general health education and vaccination information.',
      student: 'You can access general health education.',
      parent: 'You can access pregnancy information, child care, vaccination schedules, and request consultations.',
      teacher: 'You can access general health education relevant to student welfare.',
      business: 'You can access general health education.',
      health: 'You can access consultation tools, health professional directories, and manage patient information.',
      government: 'You can view public health information and statistics.',
      admin: 'You have full access to all ParentCare23 features and management.',
    },
  },
  biz360: {
    module: 'biz360',
    moduleLabel: 'Biz360 Rwanda',
    suggestedQuestions: [
      'How much stock do I have?',
      'Which products are running low?',
      'How much did I sell this month?',
      'How do I track my business loans?',
    ],
    knowledgeBase: [
      'Biz360 Rwanda is a complete business management tool for inventory, sales, customers, payments, loans, debts, taxes, banking, insurance, and reporting.',
      'The inventory system tracks stock in and stock out with automatic low-stock alerts.',
      'Sales records include product, quantity, amount, customer, and date for complete transaction tracking.',
      'The dashboard provides charts for sales trends, inventory levels, and financial summaries.',
      'Loan and debt tracking helps business owners manage what they owe and what they are owed.',
      'Tax, banking, and insurance sections help manage financial obligations.',
      'Reports include sales reports, inventory reports, and comprehensive financial summaries.',
    ],
    roleRestrictions: {
      citizen: 'You can view general business information.',
      student: 'You can view general business information.',
      parent: 'You can view general business information.',
      teacher: 'You can view general business information.',
      business: 'You have full access to your business data including inventory, sales, customers, payments, loans, and reports.',
      health: 'You can view general business information.',
      government: 'You can view business registration and tax information.',
      admin: 'You have full access to all business management features and platform-wide business data.',
    },
  },
  learnrwanda: {
    module: 'learnrwanda',
    moduleLabel: 'Learn Rwanda',
    suggestedQuestions: [
      'Teach me about Rwanda\'s history.',
      'Give me a civic education quiz.',
      'What are my rights as a citizen?',
      'Tell me about Rwandan culture and traditions.',
    ],
    knowledgeBase: [
      'Learn Rwanda covers Rwanda\'s history, culture, traditions, civic education, rights and responsibilities, peace and reconciliation, and social cohesion.',
      'The historical timeline presents key events in Rwanda\'s history from pre-colonial times to the present day.',
      'Civic education covers citizens\' rights and responsibilities under the Rwandan constitution.',
      'Peace and reconciliation content focuses on Rwanda\'s journey since 1994 and the process of national unity and renewal.',
      'Interactive quizzes test knowledge of history, civics, and culture with scoring and feedback.',
      'Educational videos and learning materials provide additional resources for self-study.',
      'Content is available in Kinyarwanda, English, and French.',
    ],
    roleRestrictions: {
      citizen: 'You can access all Learn Rwanda content including history, culture, civic education, and quizzes.',
      student: 'You can access all learning materials, quizzes, and educational videos.',
      parent: 'You can access all Learn Rwanda content to learn alongside your children.',
      teacher: 'You can access all content and use it as teaching material for your classes.',
      business: 'You can access all Learn Rwanda content.',
      health: 'You can access all Learn Rwanda content.',
      government: 'You can access all content and manage educational materials.',
      admin: 'You have full access to all content and can manage learning materials.',
    },
  },
  notifications: {
    module: 'notifications',
    moduleLabel: 'Notifications',
    suggestedQuestions: [
      'How do I manage my notification preferences?',
      'What types of notifications can I receive?',
      'How do school SMS notifications work?',
      'Can I receive notifications via email?',
    ],
    knowledgeBase: [
      'Notifications can be received via SMS, email, and in-app system notifications.',
      'Notification types include system, government alerts, school notifications, health reminders, and business notifications.',
      'Users can manage their notification preferences in their Profile settings.',
      'AI-generated notifications are created from verified system data — for example, student absence alerts are generated from attendance records and sent to parents.',
      'The notification system validates data before generating messages to ensure accuracy.',
    ],
    roleRestrictions: {
      citizen: 'You can receive government alerts, system notifications, and manage your preferences.',
      student: 'You can receive school notifications and system messages.',
      parent: 'You can receive school SMS, health reminders, and government alerts.',
      teacher: 'You can receive school notifications and system messages.',
      business: 'You can receive business notifications and system messages.',
      health: 'You can receive health system notifications.',
      government: 'You can receive government system notifications and manage public alerts.',
      admin: 'You can manage all notification types and view notification statistics.',
    },
  },
  'ai-assistant': {
    module: 'ai-assistant',
    moduleLabel: 'AI Assistant',
    suggestedQuestions: [
      'What services are available on IHURIRO?',
      'How do I register?',
      'How do I report a problem?',
      'Where can I find vaccination information?',
    ],
    knowledgeBase: [
      'The IHURIRO AI Assistant is available throughout the entire platform.',
      'It understands the current page context and provides relevant answers.',
      'It respects user permissions and only accesses authorized data.',
      'It supports Kinyarwanda, English, and French.',
      'For sensitive topics (health, legal, financial), it provides general information and recommends professional consultation.',
    ],
    roleRestrictions: {
      citizen: 'You can ask about citizen services and general platform features.',
      student: 'You can ask about your education and general platform features.',
      parent: 'You can ask about your children, health information, and general platform features.',
      teacher: 'You can ask about teaching tools, student management, and general platform features.',
      business: 'You can ask about your business data, inventory, sales, and general platform features.',
      health: 'You can ask about health tools, consultations, and general platform features.',
      government: 'You can ask about government services, complaint management, and general platform features.',
      admin: 'You can ask about all platform features and administrative tools.',
    },
  },
  profile: {
    module: 'profile',
    moduleLabel: 'Profile',
    suggestedQuestions: [
      'How do I change my password?',
      'How do I update my phone number?',
      'How do I change my language preference?',
      'How do I manage notification preferences?',
    ],
    knowledgeBase: [
      'The Profile section allows users to manage personal information, phone number, email, password, notification preferences, and language settings.',
      'Users can view their activity history, submitted applications, and messages.',
      'Language can be switched between Kinyarwanda, English, and French.',
      'Notification preferences control which notifications the user receives and through which channel.',
    ],
    roleRestrictions: {
      citizen: 'You can manage your own profile and preferences.',
      student: 'You can manage your own profile and preferences.',
      parent: 'You can manage your own profile and preferences.',
      teacher: 'You can manage your own profile and preferences.',
      business: 'You can manage your own profile and preferences.',
      health: 'You can manage your own profile and preferences.',
      government: 'You can manage your own profile and preferences.',
      admin: 'You can manage your own profile and all user profiles.',
    },
  },
  admin: {
    module: 'admin',
    moduleLabel: 'Admin',
    suggestedQuestions: [
      'How many users are on the platform?',
      'What are the most common AI questions?',
      'How do I manage user roles?',
      'How do I view audit logs?',
    ],
    knowledgeBase: [
      'The Admin dashboard provides platform-wide management including users, roles, content, complaints, AI management, SMS/email management, audit logs, and system settings.',
      'The AI Dashboard shows total questions, questions by module, unanswered questions, common questions, AI errors, feedback, and usage statistics.',
      'User management allows assigning and changing user roles and permissions.',
      'Audit logs track all significant actions on the platform for security and accountability.',
    ],
    roleRestrictions: {
      citizen: 'Admin access is not available for citizens.',
      student: 'Admin access is not available for students.',
      parent: 'Admin access is not available for parents.',
      teacher: 'Admin access is not available for teachers.',
      business: 'Admin access is not available for business owners.',
      health: 'Admin access is not available for health professionals.',
      government: 'Limited admin access may be available for government officers.',
      admin: 'You have full access to all administrative features.',
    },
  },
};

export function generateAIResponse(
  question: string,
  context: AIContext,
): string {
  const knowledge = aiKnowledge[context.module];
  const restriction = knowledge.roleRestrictions[context.role] || '';

  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('report') && context.module === 'citizenconnect') {
    return `To report a community problem in CitizenConnect:\n\n1. Click on "Report a Problem" in the sidebar\n2. Select a category (road, water, security, etc.)\n3. Describe the issue in detail\n4. Add your location\n5. Optionally attach a photo\n6. Click Submit\n\nYou will receive a reference number to track your complaint. ${restriction}`;
  }

  if (lowerQ.includes('attendance') && context.module === 'education') {
    if (context.role === 'parent' || context.role === 'teacher') {
      return `You can check attendance in the Education module under the "Attendance" section. ${context.role === 'parent' ? 'You will see your children\'s attendance records and patterns.' : 'You can record and view attendance for your assigned classes.'} ${restriction}`;
    }
    return `Attendance information is available in the Education module. Based on your role, you can view relevant attendance data. ${restriction}`;
  }

  if ((lowerQ.includes('stock') || lowerQ.includes('inventory')) && context.module === 'biz360') {
    return `You can check your stock levels in the Biz360 Inventory section. The system shows current stock for each product with low-stock alerts highlighted. You can also use the "Stock In" and "Stock Out" features to track movements. ${restriction}`;
  }

  if ((lowerQ.includes('vaccin') || lowerQ.includes('immuniz')) && context.module === 'parentcare') {
    return `Vaccination information is available in the ParentCare23 module under the "Vaccination" section. It includes the Rwanda immunization schedule with recommended vaccines for different ages. You can also track your child's vaccination records.\n\nIMPORTANT: This is general information. Please consult your local health center for specific vaccination advice. ${restriction}`;
  }

  if (lowerQ.includes('history') && context.module === 'learnrwanda') {
    return `The Learn Rwanda module offers a comprehensive view of Rwanda's history. You can explore the "Rwanda History" section for articles and the "Historical Timeline" for a visual chronology of key events from pre-colonial times to the present. Interactive quizzes are also available to test your knowledge. ${restriction}`;
  }

  if (lowerQ.includes('register') || lowerQ.includes('sign up') || lowerQ.includes('account')) {
    return `To create an account on IHURIRO Rwanda:\n\n1. Click "Create Account" on the login page\n2. Enter your full name, email, phone number\n3. Choose your role (citizen, student, parent, teacher, business owner, etc.)\n4. Create a password\n5. Click "Create Account"\n\nOnce registered, you can access all services available to your role. ${restriction}`;
  }

  if (lowerQ.includes('password')) {
    return `To change your password:\n\n1. Go to your Profile page\n2. Click on the "Password" section\n3. Enter your current password\n4. Enter your new password\n5. Confirm the new password\n6. Click Save\n\nAlways use a strong password with at least 8 characters. ${restriction}`;
  }

  if (lowerQ.includes('language') || lowerQ.includes('kinyarwanda') || lowerQ.includes('french')) {
    return `IHURIRO Rwanda supports three languages: Kinyarwanda, English, and French. You can switch languages using the language selector in the top bar. Your language preference is saved in your profile. ${restriction}`;
  }

  const generalTopics: { keywords: string[]; response: string }[] = [
    {
      keywords: ['rwanda', 'kigali', 'african', 'africa'],
      response: `Rwanda is a landlocked country in East Africa, known as the "Land of a Thousand Hills." Its capital is Kigali. Rwanda has a population of about 13 million people and is one of the cleanest and safest countries in Africa. The official languages are Kinyarwanda, English, French, and Swahili. Rwanda is renowned for its mountain gorilla conservation, the transformation after the 1994 genocide against the Tutsi, and its rapid economic development under Vision 2020 and Vision 2050.\n\nYou can learn more in the Learn Rwanda module on this platform.`,
    },
    {
      keywords: ['umuganda'],
      response: `Umuganda is a Rwandan tradition of community work, held on the last Saturday of every month. All Rwandans aged 18-65 are expected to participate. Communities gather to clean streets, build infrastructure, plant trees, and work on local development projects. It was officially reintroduced in 1998 and has become a cornerstone of Rwandan civic life, promoting unity, self-reliance, and collective responsibility.\n\nUmuganda is estimated to contribute millions of dollars worth of labor to Rwanda's development each year.`,
    },
    {
      keywords: ['girinka', 'cow', 'cattle'],
      response: `The Girinka ("One Cow per Poor Family") program is a Rwandan government initiative launched in 2006. It provides a cow to vulnerable families to improve nutrition through milk, generate income, and promote social cohesion. When a cow gives birth, the first calf is passed on to another family, creating a chain of solidarity. The program is inspired by the cultural value that a cow represents wealth and prosperity in Rwandan tradition.\n\nOver 300,000 families have benefited from Girinka since its launch.`,
    },
    {
      keywords: ['health', 'disease', 'sick', 'illness', 'medical'],
      response: `Here's some general health information:\n\n• Common illnesses in Rwanda include malaria, respiratory infections, and waterborne diseases. Prevention through clean water, hygiene, and vaccination is key.\n• Rwanda's health system includes health centers at the sector level, district hospitals, and referral hospitals.\n• Community Health Workers (CHWs) provide first-line health services in every village.\n• Health insurance through Mutuelle de Sante covers most of the population.\n\nIMPORTANT: This is general information only. For specific health concerns, always consult a qualified health professional or visit your nearest health center. You can also explore the ParentCare23 module for more health education.`,
    },
    {
      keywords: ['education', 'school', 'learn', 'study', 'teacher', 'student', 'class'],
      response: `Rwanda's education system follows a 6-3-3 structure: 6 years of primary, 3 years of lower secondary, and 3 years of upper secondary school. Education is compulsory through grade 9. The medium of instruction is English from primary 4 onward. Rwanda has made significant progress in education access, with near-universal primary enrollment.\n\nThe IHURIRO platform's Education module supports students, teachers, parents, and administrators with attendance tracking, academic records, assignments, quizzes, and progress monitoring.`,
    },
    {
      keywords: ['business', 'entrepreneur', 'trade', 'commerce', 'sell', 'money'],
      response: `Rwanda has one of Africa's most business-friendly environments. Key sectors include agriculture, tourism, services, and technology. The Rwanda Development Board (RDB) streamlines business registration, and the country ranks highly on the World Bank's Ease of Doing Business index.\n\nThe IHURIRO platform's Biz360 module helps business owners manage inventory, sales, customers, payments, loans, taxes, and reports — all in one place.`,
    },
    {
      keywords: ['technology', 'computer', 'internet', 'digital', 'ai', 'artificial intelligence'],
      response: `Technology and digital transformation are central to Rwanda's development strategy. Rwanda has invested heavily in ICT infrastructure, with Kigali becoming a regional tech hub. The Kigali Innovation City project aims to create a world-class innovation ecosystem.\n\nArtificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence — like understanding language, recognizing patterns, and making decisions. I'm an example of an AI assistant!\n\nOn this platform, the IHURIRO AI assistant can answer your questions about Rwanda, the platform, and general knowledge topics.`,
    },
    {
      keywords: ['history', 'colonial', 'independence', 'genocide', 'war', 'peace'],
      response: `Rwanda has a rich and complex history:\n\n• Pre-colonial era: Rwanda was a centralized kingdom ruled by a Mwami (king), with a shared language and culture across Hutu, Tutsi, and Twa communities.\n• Colonial period (1899-1962): First under German, then Belgian rule. Colonial policies introduced ethnic identity cards and deepened social divisions.\n• Independence (1962): Rwanda gained independence, followed by periods of political instability and violence.\n• 1994: The genocide against the Tutsi took over one million lives in 100 days. It ended when the RPF captured Kigali.\n• Reconstruction: Rwanda rebuilt through national unity, Gacaca courts, and reconciliation. Vision 2020 and Vision 2050 guide development.\n\nYou can explore detailed articles in the Learn Rwanda module.`,
    },
    {
      keywords: ['culture', 'tradition', 'dance', 'music', 'art', 'imigongo', 'agaseke', 'inanga', 'intore'],
      response: `Rwandan culture is rich and vibrant:\n\n• Intore: The famous warrior dance, performed with precision and energy, recognized by UNESCO.\n• Imigongo: Unique geometric art made from shaped and painted cow dung, originating from the 18th century.\n• Agaseke: Finely woven baskets symbolizing peace and goodwill, featured on Rwandan currency.\n• Inanga: A traditional string instrument used by storytellers to preserve oral history.\n• Umuganda: Monthly community work bringing all citizens together.\n\nYou can explore these and more in the Learn Rwanda module's Culture and Traditions sections.`,
    },
    {
      keywords: ['right', 'constitution', 'law', 'civic', 'citizen', 'duty', 'responsibility'],
      response: `As a Rwandan citizen, your key rights include:\n• The right to life, liberty, and security\n• Freedom of expression and association\n• The right to education and healthcare\n• Equal protection under the law, regardless of background\n\nYour responsibilities include:\n• Participating in Umuganda (community work)\n• Paying taxes\n• Respecting the rights of others\n• Defending the unity of Rwandans\n\nThe Learn Rwanda module's Civic Education and Rights & Responsibilities sections provide detailed information.`,
    },
    {
      keywords: ['vaccin', 'immuniz', 'vaccine'],
      response: `The Rwanda Expanded Programme on Immunization (EPI) provides free vaccines at all health centers:\n\n• Birth: BCG, OPV-0\n• 6 weeks: Pentavalent-1, OPV-1, PCV-1, Rota-1\n• 10 weeks: Pentavalent-2, OPV-2, PCV-2, Rota-2\n• 14 weeks: Pentavalent-3, OPV-3, PCV-3\n• 9 months: Measles-Rubella-1\n• 18 months: Measles-Rubella-2\n\nIMPORTANT: This is general information. Please consult your local health center for specific vaccination advice. You can find detailed schedules in the ParentCare23 module.`,
    },
    {
      keywords: ['hello', 'hi', 'hey', 'greeting', 'muraho', 'bonjour'],
      response: `Hello! I'm IHURIRO AI, your assistant on the IHURIRO Rwanda platform. I can help you with:\n\n• Questions about Rwanda's history, culture, and civic life\n• Navigating the platform's five modules (CitizenConnect, Education, ParentCare23, Biz360, Learn Rwanda)\n• General knowledge on health, education, business, and technology\n• Practical guidance on reporting problems, tracking attendance, managing inventory, and more\n\nWhat would you like to know?`,
    },
    {
      keywords: ['help', 'what can you do', 'what do you do', 'capabilities'],
      response: `I'm IHURIRO AI and I can help you with a wide range of topics:\n\n1. Platform navigation — how to use CitizenConnect, Education, ParentCare23, Biz360, and Learn Rwanda\n2. Rwanda knowledge — history, culture, traditions, civic rights, Umuganda, Girinka\n3. Health education — vaccination schedules, nutrition, child development, pregnancy\n4. Education — attendance, academic records, student progress, parent communication\n5. Business — inventory, sales, payments, loans, taxes, reports\n6. General knowledge — technology, science, and everyday questions\n\nJust ask me anything! What would you like to know?`,
    },
    {
      keywords: ['thank', 'murakoze', 'merci'],
      response: `You're welcome! I'm always here to help. Feel free to ask me anything else — about Rwanda, the platform, or any topic you're curious about.`,
    },
  ];

  for (const topic of generalTopics) {
    if (topic.keywords.some((kw) => lowerQ.includes(kw))) {
      return topic.response;
    }
  }

  const matching = knowledge.knowledgeBase.find((kb) => {
    const words = lowerQ.split(' ');
    return words.some((w) => w.length > 3 && kb.toLowerCase().includes(w));
  });

  if (matching) {
    return `${matching}\n\n${restriction}`;
  }

  return `That's a great question! Here's what I can tell you about "${question}":\n\nI'm currently running in local knowledge mode. I can provide detailed answers about:\n• The IHURIRO Rwanda platform and its five modules\n• Rwanda's history, culture, traditions, and civic life\n• Health education, vaccination, nutrition, and child care\n• Education, business management, and community services\n• General topics like technology, governance, and daily life\n\nCould you rephrase your question or ask about one of these topics? I'm here to help with whatever you need. ${restriction}`.trim();
}
