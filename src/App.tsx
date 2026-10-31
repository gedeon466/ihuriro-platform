import { AppProvider } from '@/context/AppContext';
import { useApp } from '@/context/app-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AIPanel } from '@/components/ai/AIPanel';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { HomeDashboard } from '@/components/modules/HomeDashboard';
import { CitizenConnectModule } from '@/components/modules/CitizenConnectModule';
import { EducationModule } from '@/components/modules/EducationModule';
import { ParentCareModule } from '@/components/modules/ParentCareModule';
import { Biz360Module } from '@/components/modules/Biz360Module';
import { LearnRwandaModule } from '@/components/modules/LearnRwandaModule';
import { NotificationsModule } from '@/components/modules/NotificationsModule';
import { ProfileModule } from '@/components/modules/ProfileModule';
import { AdminModule } from '@/components/modules/AdminModule';
import { AIAssistantModule } from '@/components/modules/AIAssistantModule';

function ModuleRouter() {
  const { currentModule } = useApp();

  switch (currentModule) {
    case 'home':
      return <HomeDashboard />;
    case 'citizenconnect':
      return <CitizenConnectModule />;
    case 'education':
      return <EducationModule />;
    case 'parentcare':
      return <ParentCareModule />;
    case 'biz360':
      return <Biz360Module />;
    case 'learnrwanda':
      return <LearnRwandaModule />;
    case 'notifications':
      return <NotificationsModule />;
    case 'ai-assistant':
      return <AIAssistantModule />;
    case 'profile':
      return <ProfileModule />;
    case 'admin':
      return <AdminModule />;
    default:
      return <HomeDashboard />;
  }
}

function MainContent() {
  const { user, sidebarOpen, authReady } = useApp();

  if (!authReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white">
          IR
        </span>
        <p className="text-sm text-neutral-500">Loading your IHURIRO workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-neutral-50">
      <div className="site-background" aria-hidden="true">
        <img className="site-background-image" src="/backgrounds/image copy.png" alt="" />
        <img className="site-background-image" src="/backgrounds/image copy 2.png" alt="" />
        <img className="site-background-image" src="/backgrounds/image.png" alt="" />
      </div>
      <div className="relative z-10 flex min-h-screen w-full">
        {sidebarOpen && <Sidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <ModuleRouter />
          </main>
        </div>
        <AIPanel />
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
