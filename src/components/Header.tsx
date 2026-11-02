/**
 * HCM Lite - Unified Navigation Header
 * Features role indicator, quick test role switcher, notifications, AI trigger, dark mode and 5-min demo script
 */

import React, { useState } from 'react';
import {
  Bell,
  Bot,
  Moon,
  Sun,
  Award,
  ChevronDown,
  User,
  LogOut,
  Shield,
  Briefcase,
  UserCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { UserRole, InAppNotification } from '../types/hcm';

interface HeaderProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    employeeId?: string;
  } | null;
  companyName: string;
  notifications: InAppNotification[];
  onOpenNotifications: () => void;
  onOpenAIAssistant: () => void;
  onOpenJudgeDemo: () => void;
  onQuickLogin: (email: string, role: string) => void;
  onResetSystem: () => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  companyName,
  notifications,
  onOpenNotifications,
  onOpenAIAssistant,
  onOpenJudgeDemo,
  onQuickLogin,
  onResetSystem,
  onLogout,
  darkMode,
  onToggleDarkMode,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleColors = {
    admin: 'bg-indigo-600 text-white',
    hr: 'bg-teal-600 text-white',
    employee: 'bg-amber-600 text-white',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Saylani Hackathon Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-md shrink-0">
            EIIR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                HCM Lite
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Saylani Hackathon 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-xs">
              {companyName || 'Zaitoon Ashraf IT Park'}
            </p>
          </div>
        </div>

        {/* Center / Right Control Panel */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 5-Min Judge Demo Guide Trigger */}
          <button
            onClick={onOpenJudgeDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition transform active:scale-95 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span className="hidden md:inline">5-Min Demo Guide</span>
            <span className="md:hidden">Demo</span>
          </button>

          {/* Quick Role Switcher Dropdown (Essential for testing judge workflows) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition shadow-2xs"
            >
              {currentUser?.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
              ) : currentUser?.role === 'hr' ? (
                <Briefcase className="w-3.5 h-3.5 text-teal-500" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="hidden sm:inline font-bold uppercase">
                {currentUser?.role || 'Switch Role'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {roleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-50 text-xs"
                onMouseLeave={() => setRoleMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Judge Quick Role Switch
                  </span>
                </div>
                <button
                  onClick={() => {
                    onQuickLogin('admin@saylaniit.com', 'admin');
                    setRoleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between transition"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Admin</p>
                    <p className="text-[11px] text-slate-500">Muhammad Bilal</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-md font-semibold">
                    Company
                  </span>
                </button>

                <button
                  onClick={() => {
                    onQuickLogin('hr@saylaniit.com', 'hr');
                    setRoleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center justify-between transition"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">HR Lead</p>
                    <p className="text-[11px] text-slate-500">Ayesha Khan</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-md font-semibold">
                    Operations
                  </span>
                </button>

                <button
                  onClick={() => {
                    onQuickLogin('rashid@saylaniit.com', 'employee');
                    setRoleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between transition"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Employee (Active)</p>
                    <p className="text-[11px] text-slate-500">Rashid Ali (Lead Dev)</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded-md font-semibold">
                    Self-Service
                  </span>
                </button>

                <button
                  onClick={() => {
                    onQuickLogin('fatima@saylaniit.com', 'employee');
                    setRoleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between transition"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Employee (Temp PW)</p>
                    <p className="text-[11px] text-slate-500">Fatima Zahra (UI/UX)</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 rounded-md font-semibold">
                    1st Login
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* AI Assistant Chat Panel Button */}
          <button
            onClick={onOpenAIAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifMenuOpen(!notifMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 z-50 text-xs"
                onMouseLeave={() => setNotifMenuOpen(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white">
                    In-App Notifications (M9)
                  </span>
                  <span className="text-[10px] text-slate-400">{notifications.length} total</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 mt-2">
                  {notifications.length === 0 ? (
                    <p className="text-center py-4 text-slate-400">No recent notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="py-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.message}</p>
                        <span className="text-[9px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Avatar & Logout */}
          <button
            onClick={onLogout}
            title="Log out"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
