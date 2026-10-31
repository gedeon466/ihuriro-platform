import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, Sparkles, Globe, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { navigation } from '@/data/navigation';
import { api } from '@/lib/api';
import { useApiList } from '@/lib/hooks';
import type { Language } from '@/types';

export function TopBar() {
  const { toggleSidebar, toggleAIPanel, language, setLanguage, navigate, user, currentModule } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useApiList(() =>
    api.notifications.list().then((result) => result.notifications)
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentNav = navigation.find((n) => n.id === currentModule);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = normalizedSearch
    ? navigation.flatMap((item) => {
        const moduleMatches = [item.label, item.labelKw, item.labelFr].some((label) =>
          label.toLowerCase().includes(normalizedSearch)
        );
        const results = moduleMatches
          ? [{ module: item.id, section: null, label: item.label, parent: '' }]
          : [];
        const childResults = (item.children || [])
          .filter((child) => [child.label, child.labelKw, child.labelFr].some((label) =>
            label.toLowerCase().includes(normalizedSearch)
          ))
          .map((child) => ({ module: item.id, section: child.id, label: child.label, parent: item.label }));
        return [...results, ...childResults];
      }).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-200">
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-all flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-neutral-800 text-base sm:text-lg truncate">
              {currentNav ? (language === 'en' ? currentNav.label : language === 'rw' ? currentNav.labelKw : currentNav.labelFr) : 'IHURIRO'}
            </h2>
            <p className="text-xs text-neutral-400 hidden sm:block">
              {user ? `Welcome, ${user.name}` : 'Unified Citizen Platform'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:block relative w-56 lg:w-64">
            <div className="flex items-center bg-neutral-100 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sections..."
                className="bg-transparent border-0 outline-none text-sm text-neutral-700 placeholder:text-neutral-400 w-full ml-2"
              />
            </div>
            {searchQuery.trim() && (
              <div className="absolute top-11 left-0 right-0 bg-white rounded-xl border border-neutral-200 shadow-xl py-1 z-50 overflow-hidden">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={`${result.module}-${result.section || 'module'}`}
                      onClick={() => {
                        navigate(result.module, result.section);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-primary-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-neutral-700">{result.label}</p>
                      {result.parent && <p className="text-[11px] text-neutral-400">{result.parent}</p>}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-sm text-neutral-500">No matching sections found.</p>
                )}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setShowLang(!showLang)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-all"
            >
              <Globe className="w-5 h-5" />
            </button>
            {showLang && (
              <div className="absolute right-0 top-11 bg-white rounded-xl border border-neutral-200 shadow-lg py-2 w-44 animate-scale-in">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLang(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all ${
                      language === lang.code ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.label}</span>
                    {language === lang.code && <ChevronDown className="w-3 h-3 ml-auto rotate-[-90deg]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-11 bg-white rounded-xl border border-neutral-200 shadow-lg w-80 max-h-96 overflow-y-auto scrollbar-thin animate-scale-in">
                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <span className="font-semibold text-neutral-800 text-sm">Notifications</span>
                  <span className="text-xs text-primary-600 font-medium">{unreadCount} unread</span>
                </div>
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { navigate('notifications'); setShowNotifs(false); }}
                    className={`px-4 py-3 border-b border-neutral-50 cursor-pointer hover:bg-neutral-50 transition-all ${!n.read ? 'bg-primary-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-700 truncate">{n.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">{n.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { navigate('notifications'); setShowNotifs(false); }}
                  className="w-full py-2.5 text-center text-sm text-primary-600 font-semibold hover:bg-primary-50 transition-all"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>

          {/* AI Button */}
          <button
            onClick={toggleAIPanel}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 group"
          >
            <Sparkles className="w-4 h-4 group-hover:animate-pulse-soft" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>
    </header>
  );
}
