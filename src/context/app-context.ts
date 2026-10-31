import { createContext, useContext } from 'react';
import type { Language, ModuleId, AppUser, ChatMessage, Conversation } from '@/types';

export interface AppState {
  user: AppUser | null;
  authReady: boolean;
  language: Language;
  currentModule: ModuleId;
  currentSection: string | null;
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  conversations: Conversation[];
  currentConversationId: string | null;
  login: (user: AppUser, token: string) => void;
  logout: () => void;
  setLanguage: (lang: Language) => void;
  updateUser: (patch: Partial<AppUser>) => void;
  navigate: (module: ModuleId, section?: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleAIPanel: () => void;
  setAIPanelOpen: (open: boolean) => void;
  t: (key: string) => string;
  addMessage: (msg: ChatMessage) => void;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  queuedAIQuestion: string | null;
  askAI: (question: string) => void;
  clearQueuedAIQuestion: () => void;
}

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
