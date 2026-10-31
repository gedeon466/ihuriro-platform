import { useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Language, ModuleId, AppUser, ChatMessage, Conversation } from '@/types';
import { t as translate } from '@/i18n';
import { AppContext } from '@/context/app-context';
import { api, getToken, setToken } from '@/lib/api';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [currentModule, setCurrentModule] = useState<ModuleId>('home');
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [queuedAIQuestion, setQueuedAIQuestion] = useState<string | null>(null);

  const t = useCallback((key: string) => translate(language, key), [language]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getToken()) {
        setAuthReady(true);
        return;
      }
      try {
        const { user: restored } = await api.auth.me();
        if (!cancelled) {
          setUser(restored);
          setLanguageState(restored.language);
        }
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setCurrentModule('home');
      setCurrentSection(null);
      setConversations([]);
      setCurrentConversationId(null);
    };
    window.addEventListener('ihuriro:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ihuriro:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback((u: AppUser, token: string) => {
    setToken(token);
    setUser(u);
    setLanguageState(u.language);
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    setCurrentModule('home');
    setCurrentSection(null);
    setConversations([]);
    setCurrentConversationId(null);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setUser((prev) => (prev ? { ...prev, language: lang } : prev));
    if (getToken()) {
      void api.auth.updateProfile({ language: lang }).catch(() => undefined);
    }
  }, []);

  const updateUser = useCallback((patch: Partial<AppUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const navigate = useCallback((module: ModuleId, section: string | null = null) => {
    setCurrentModule(module);
    setCurrentSection(section);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);
  const toggleAIPanel = useCallback(() => setAIPanelOpen((p) => !p), []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setConversations((prev) => {
      const selectedConversation = currentConversationId
        ? prev.find((conversation) => conversation.id === currentConversationId)
        : undefined;
      const latestConversation = prev[0];
      const targetConversation = selectedConversation || (
        msg.role === 'assistant' && latestConversation?.messages[latestConversation.messages.length - 1]?.role === 'user'
          ? latestConversation
          : undefined
      );

      if (targetConversation) {
        setCurrentConversationId(targetConversation.id);
        return prev.map((conversation) =>
          conversation.id === targetConversation.id
            ? { ...conversation, messages: [...conversation.messages, msg] }
            : conversation
        );
      }

      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        title: msg.content.slice(0, 40),
        messages: [msg],
        module: currentModule,
        createdAt: Date.now(),
      };
      setCurrentConversationId(newConversation.id);
      return [newConversation, ...prev];
    });
  }, [currentConversationId, currentModule]);

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  const askAI = useCallback((question: string) => {
    setQueuedAIQuestion(question);
    setAIPanelOpen(true);
  }, []);

  const clearQueuedAIQuestion = useCallback(() => {
    setQueuedAIQuestion(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        authReady,
        language,
        currentModule,
        currentSection,
        sidebarOpen,
        aiPanelOpen,
        conversations,
        currentConversationId,
        login,
        logout,
        setLanguage,
        updateUser,
        navigate,
        toggleSidebar,
        setSidebarOpen,
        toggleAIPanel,
        setAIPanelOpen,
        t,
        addMessage,
        startNewConversation,
        selectConversation,
        queuedAIQuestion,
        askAI,
        clearQueuedAIQuestion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
