import { useEffect, useState } from 'react';
import {
  Home, Users, GraduationCap, Heart, Briefcase, BookOpen, Bell,
  Sparkles, UserCircle, Settings, ChevronDown, ChevronRight, LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { navigation } from '@/data/navigation';
import type { ModuleId, UserRole } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  Home, Users, GraduationCap, Heart, Briefcase, BookOpen, Bell,
  Sparkles, UserCircle, Settings,
};

export function Sidebar() {
  const { user, currentModule, currentSection, navigate, sidebarOpen, setSidebarOpen, logout, language } = useApp();
  const [expanded, setExpanded] = useState<ModuleId | null>(currentModule);

  useEffect(() => {
    setExpanded(currentModule);
  }, [currentModule]);

  if (!sidebarOpen) return null;

  const role = user?.role || 'citizen';
  const visibleNav = navigation.filter((item) => {
    if (item.roles && !item.roles.includes(role as UserRole)) return false;
    return true;
  });

  const handleNavClick = (id: ModuleId, hasChildren: boolean) => {
    if (hasChildren) {
      setExpanded(expanded === id ? null : id);
    }
    navigate(id, null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-neutral-900/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      <aside className="fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-white border-r border-neutral-200 flex flex-col animate-slide-in-left">
        {/* Logo Header */}
        <div className="px-5 py-5 border-b border-neutral-200 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <span className="font-heading font-bold text-lg">IR</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-neutral-800 text-lg leading-tight">IHURIRO</h1>
            <p className="text-xs text-primary-600 font-medium">Rwanda Platform</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <p className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Menu</p>
          <div className="space-y-1">
            {visibleNav.map((item) => {
              const Icon = iconMap[item.icon] || Home;
              const isActive = currentModule === item.id;
              const isExpanded = expanded === item.id;
              const hasChildren = !!item.children?.length;

              const colorBar: Record<string, string> = {
                primary: 'bg-primary-500',
                secondary: 'bg-secondary-400',
                accent: 'bg-accent-500',
                error: 'bg-error-500',
                warning: 'bg-warning-500',
                neutral: 'bg-neutral-500',
              };

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id, hasChildren)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <div className={`w-1 h-6 rounded-full transition-all ${isActive ? colorBar[item.color] : 'bg-transparent'}`} />
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                    <span className="text-sm flex-1 text-left truncate">
                      {language === 'en' ? item.label : language === 'rw' ? item.labelKw : item.labelFr}
                    </span>
                    {hasChildren && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''} text-neutral-400`} />
                    )}
                  </button>

                  {/* Children */}
                  {hasChildren && isExpanded && (
                    <div className="ml-6 mt-1 mb-2 space-y-0.5 border-l border-neutral-200 pl-3 animate-fade-in">
                      {item.children!.map((child) => {
                        const childActive = currentModule === item.id && currentSection === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => {
                              navigate(item.id, child.id);
                              if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              childActive
                                ? 'bg-primary-100 text-primary-700 font-semibold'
                                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                            }`}
                          >
                            <ChevronRight className="w-3 h-3" />
                            <span className="flex-1 text-left truncate">
                              {language === 'en' ? child.label : language === 'rw' ? child.labelKw : child.labelFr}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-700 truncate">{user?.name || 'Guest'}</p>
              <p className="text-xs text-neutral-400 capitalize truncate">{user?.role || 'Not signed in'}</p>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-all"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
