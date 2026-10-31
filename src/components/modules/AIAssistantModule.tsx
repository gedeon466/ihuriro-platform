import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles, Send, Plus, MessageSquare, Bot, User as UserIcon,
  AlertCircle, Copy, Check,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { generateAIResponse } from '@/data/aiKnowledge';
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

const suggestedPrompts = [
  { icon: '🌍', text: 'Tell me about Rwanda\'s history and culture' },
  { icon: '🎓', text: 'How does the education system work in Rwanda?' },
  { icon: '💊', text: 'What is the vaccination schedule for children?' },
  { icon: '📊', text: 'How do I track my business inventory?' },
  { icon: '🏛️', text: 'How do I report a community problem?' },
  { icon: '💡', text: 'What are my rights as a Rwandan citizen?' },
  { icon: '🧮', text: 'Explain how Umuganda works' },
  { icon: '🐄', text: 'What is the Girinka program?' },
];

export function AIAssistantModule() {
  const {
    currentModule, user, conversations, currentConversationId,
    addMessage, startNewConversation, selectConversation, language,
  } = useApp();

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConv = conversations.find((c) => c.id === currentConversationId);
  const messages = useMemo(() => currentConv?.messages || [], [currentConv]);
  const currentNav = navigation.find((n) => n.id === currentModule);
  const contextLabel = currentNav?.label || 'General';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || isThinking) return;

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
      section: undefined,
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
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] animate-fade-in -m-4 sm:-m-6 lg:-m-8">
      {/* Conversation Sidebar */}
      {showSidebar && (
        <div className="w-64 flex-shrink-0 border-r border-neutral-200 bg-neutral-50 flex flex-col">
          <div className="p-3 border-b border-neutral-200">
            <button
              onClick={() => { startNewConversation(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-sm font-medium text-neutral-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {conversations.length === 0 ? (
              <p className="text-xs text-neutral-400 px-3 py-4 text-center">No conversations yet. Start chatting!</p>
            ) : (
              <div className="space-y-0.5">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all group ${
                      currentConversationId === conv.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-white text-neutral-600'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                    <span className="text-sm truncate flex-1">{conv.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-neutral-200">
            <button
              onClick={() => setShowSidebar(false)}
              className="w-full flex items-center justify-center gap-2 text-xs text-neutral-400 hover:text-neutral-600 transition-all"
            >
              Hide sidebar
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-neutral-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {!showSidebar && (
              <button onClick={() => setShowSidebar(true)} className="text-neutral-400 hover:text-neutral-700">
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-neutral-800 text-sm">IHURIRO AI</h2>
              <p className="text-xs text-neutral-400">Ask me anything</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => startNewConversation()}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary-600 font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 && !isThinking ? (
            <div className="h-full flex flex-col items-center justify-center px-4 py-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center mb-5">
                <Bot className="w-10 h-10 text-primary-600" />
              </div>
              <h2 className="font-heading font-bold text-neutral-800 text-2xl">How can I help you?</h2>
              <p className="text-sm text-neutral-500 mt-2 text-center max-w-md">
                I'm IHURIRO AI, your intelligent assistant. Ask me anything — about the platform, Rwanda, or any topic you're curious about.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 max-w-2xl w-full">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-left transition-all group"
                  >
                    <span className="text-xl flex-shrink-0">{prompt.icon}</span>
                    <span className="text-sm text-neutral-700 group-hover:text-primary-700">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-neutral-200 text-neutral-600'
                      : 'bg-gradient-to-br from-primary-500 to-accent-500 text-white'
                  }`}>
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white rounded-tr-sm max-w-[85%]'
                        : 'bg-neutral-100 text-neutral-800 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-2 ml-1">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
                          title="Copy"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                    {msg.context && msg.role === 'user' && (
                      <p className="text-[10px] text-neutral-400 mt-1 mr-1">in {msg.context}</p>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-4 animate-slide-up">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-neutral-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-neutral-50 rounded-2xl border border-neutral-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask me anything..."
                className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none max-h-40"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isThinking}
                className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 text-center mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              AI provides general information. For sensitive topics, consult a qualified professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
