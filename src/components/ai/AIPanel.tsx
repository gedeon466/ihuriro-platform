import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles, X, Send, Plus, MessageSquare, Bot, User as UserIcon,
  AlertCircle, History, ChevronRight,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { aiKnowledge, generateAIResponse } from '@/data/aiKnowledge';
import { navigation } from '@/data/navigation';
import { api } from '@/lib/api';
import type { ChatMessage } from '@/types';

async function fetchAIResponse(history: ChatMessage[], module: string): Promise<string | null> {
  const latest = history[history.length - 1];
  if (!latest) return null;
  try {
    const result = await api.ai.chat({
      message: latest.content,
      history: history.slice(0, -1).map((message) => ({ role: message.role, content: message.content })),
      module,
    });
    return result.reply;
  } catch {
    return null;
  }
}

export function AIPanel() {
  const {
    aiPanelOpen, setAIPanelOpen, currentModule, currentSection,
    user, conversations, currentConversationId, addMessage,
    startNewConversation, selectConversation, language,
    queuedAIQuestion, clearQueuedAIQuestion,
  } = useApp();

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConv = conversations.find((c) => c.id === currentConversationId);
  const messages = useMemo(() => currentConv?.messages || [], [currentConv]);
  const knowledge = aiKnowledge[currentModule];
  const currentNav = navigation.find((n) => n.id === currentModule);
  const contextLabel = currentSection
    ? currentNav?.children?.find((c) => c.id === currentSection)?.label || currentSection
    : currentNav?.label || 'General';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      context: contextLabel,
    };
    addMessage(userMsg);
    setInput('');
    setIsThinking(true);

    const history = [...messages, userMsg];
    const serverReply = await fetchAIResponse(history, currentModule);
    const response = serverReply ?? generateAIResponse(content, {
      module: currentModule,
      section: currentSection || undefined,
      role: user?.role || 'citizen',
      language,
    });

    const aiMsg: ChatMessage = {
      id: `m-${Date.now() + 1}`,
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
      context: contextLabel,
    };
    addMessage(aiMsg);
    setIsThinking(false);
  }, [input, contextLabel, currentModule, currentSection, user, language, messages, addMessage]);

  useEffect(() => {
    if (aiPanelOpen && queuedAIQuestion) {
      clearQueuedAIQuestion();
      handleSend(queuedAIQuestion);
    }
  }, [aiPanelOpen, queuedAIQuestion, clearQueuedAIQuestion, handleSend]);

  if (!aiPanelOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-neutral-900/30 z-40" onClick={() => setAIPanelOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">IHURIRO AI</h3>
              <p className="text-xs text-white/70">Context: {contextLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-all"
              title="History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAIPanelOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="border-b border-neutral-200 bg-neutral-50 max-h-56 overflow-y-auto scrollbar-thin animate-slide-up">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Previous Conversations</span>
              <button
                onClick={() => { startNewConversation(); setShowHistory(false); }}
                className="flex items-center gap-1 text-xs text-primary-600 font-semibold hover:text-primary-700"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            {conversations.length === 0 ? (
              <p className="px-4 pb-3 text-xs text-neutral-400">No previous conversations yet.</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { selectConversation(conv.id); setShowHistory(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                    currentConversationId === conv.id ? 'bg-primary-100' : 'hover:bg-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700 truncate font-medium">{conv.title}</p>
                    <p className="text-[10px] text-neutral-400">{conv.messages.length} messages</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
          {messages.length === 0 && !isThinking && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-heading font-bold text-neutral-800 text-lg">Ask IHURIRO AI</h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-xs mx-auto">
                I understand you're in the <span className="font-semibold text-primary-600">{contextLabel}</span> section. Ask me anything about this module or the platform.
              </p>

              {/* Suggested Questions */}
              <div className="mt-6 space-y-2 text-left">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Suggested Questions</p>
                {knowledge.suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-sm text-neutral-700 transition-all group"
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600" />
                    <span className="flex-1">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-neutral-200 text-neutral-600'
                  : 'bg-gradient-to-br from-primary-500 to-accent-500 text-white'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white rounded-tr-sm'
                    : 'bg-neutral-100 text-neutral-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.context && msg.role === 'user' && (
                  <p className="text-[10px] text-neutral-400 mt-1 mr-1">in {msg.context}</p>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3 animate-slide-up">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-warning-50 border-t border-warning-100">
          <p className="text-[11px] text-warning-700 flex items-start gap-1.5">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            AI provides general information. For sensitive topics, consult a qualified professional.
          </p>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Type your question..."
              className="flex-1 resize-none border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all max-h-24"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isThinking}
              className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
