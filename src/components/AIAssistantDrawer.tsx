/**
 * HCM Lite - AI Assistant Chat Panel (M8)
 * Real-time tool-calling assistant with role scoping, Section 3 policy Q&A, and Roman Urdu support
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  RotateCw,
  X,
  MessageSquare,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { UserRole } from '../types/hcm';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toolUsed?: string;
  timestamp: string;
}

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; role: UserRole; name: string; email: string } | null;
  initialPrompt?: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello ${currentUser?.name || 'User'}! I am your HCM Lite AI Assistant. Every answer I provide comes directly from real database metrics and Section 3 company policies. How may I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMsg: Message = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: { prompt },
      });

      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: res.response || 'No response generated.',
        toolUsed: res.toolUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: `Error: ${err.message || 'Unable to connect to AI assistant service.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Test questions tailored to user role from Page 4 live test script:
  const suggestedQuestions =
    currentUser?.role === 'employee'
      ? [
          'How many sick leaves do I have left this year?',
          'What is Hamza Tariq\'s salary? (Refusal Test)',
          'Office timings aur grace period kya hai?',
          'What is the formula for gross salary?',
        ]
      : currentUser?.role === 'hr'
      ? [
          'Who came late most often this month?',
          'What is this month’s attendance rate?',
          'How many active employees are in Software Engineering?',
          'Who is on leave today?',
        ]
      : [
          'What is the total headcount and attrition rate?',
          'What is the monthly payroll cost and average salary?',
          'Who came late most often this month?',
          'What are the tax slabs for annual gross salary?',
        ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                HCM Lite Assistant
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-semibold uppercase">
                {currentUser?.role || 'User'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tool Calling · Real DB Scope · Roman Urdu
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Questions Pill Carousel */}
      <div className="px-4 py-2.5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3" /> Test:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="text-[11px] px-2.5 py-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:border-blue-500 rounded-full text-slate-700 dark:text-slate-300 shrink-0 transition shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>

            <div className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
              <span>{msg.timestamp}</span>
              {msg.sender === 'assistant' && (
                <>
                  <span>•</span>
                  <span className="text-blue-500 font-medium">AI-generated</span>
                  {msg.toolUsed && (
                    <>
                      <span>•</span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono">
                        tool: {msg.toolUsed}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl max-w-[70%] text-slate-500 dark:text-slate-400">
            <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs">Calling database tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about headcount, leaves, late comers or rules..."
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-1.5">
          Protected by server RBAC guards. Max 20 requests/hr.
        </p>
      </div>
    </div>
  );
};
