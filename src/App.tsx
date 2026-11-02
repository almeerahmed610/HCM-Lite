/**
 * HCM Lite - Main Application Container
 * Complete AI-assisted Human Capital Management System for Saylani Hackathon 2026
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Megaphone,
  Settings,
  Bot,
  Award,
  Sparkles,
  Shield,
  Briefcase,
  UserCheck,
  RotateCw,
  Lock,
  Mail,
} from 'lucide-react';
import { apiRequest, setStoredToken, getStoredToken } from './services/api';
import { UserRole, CompanySettings, InAppNotification } from './types/hcm';

// Components & Views
import { Header } from './components/Header';
import { FirstRunSetup } from './components/FirstRunSetup';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { CameraAttendanceModal } from './components/CameraAttendanceModal';
import { SmartLeaveModal } from './components/SmartLeaveModal';
import { PayslipModal } from './components/PayslipModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { JudgeDemoModal } from './components/JudgeDemoModal';

import { AdminDashboard } from './views/AdminDashboard';
import { HRDashboard } from './views/HRDashboard';
import { EmployeeDashboard } from './views/EmployeeDashboard';
import { EmployeeDirectory } from './views/EmployeeDirectory';
import { AttendanceView } from './views/AttendanceView';
import { LeaveView } from './views/LeaveView';
import { PayrollView } from './views/PayrollView';
import { SettingsView } from './views/SettingsView';
import { AnnouncementsView } from './views/AnnouncementsView';

export default function App() {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companyName, setCompanyName] = useState<string>('Saylani IT Training (PVT) Ltd.');
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals & Panels
  const [showJudgeDemo, setShowJudgeDemo] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');
  const [showCameraAttendance, setShowCameraAttendance] = useState(false);
  const [showSmartLeave, setShowSmartLeave] = useState(false);
  const [activePayslipItem, setActivePayslipItem] = useState<any | null>(null);

  // Login form state (if not logged in)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('hcm_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('hcm_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/status');
      setInitialized(res.initialized);
      setCompanyName(res.companyName || 'Saylani IT Training (PVT) Ltd.');

      if (res.user) {
        setCurrentUser(res.user);
        loadCommonData();
      } else {
        // If system is initialized but no active token, prefill default demo admin for convenience
        setLoginEmail('admin@saylaniit.com');
        setLoginPassword('Admin@123');
      }
    } catch (err) {
      console.error('Status check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCommonData = async () => {
    try {
      const [settingsRes, notifRes] = await Promise.all([
        apiRequest('/api/settings'),
        apiRequest('/api/notifications'),
      ]);
      setSettings(settingsRes);
      setNotifications(notifRes || []);
    } catch (e) {
      console.warn('Common data fetch:', e);
    }
  };

  const handleLogin = async (emailOverride?: string, passwordOverride?: string) => {
    const email = emailOverride || loginEmail;
    const password = passwordOverride || loginPassword;

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      setStoredToken(res.token);
      setCurrentUser(res.user);
      setActiveTab('dashboard');
      loadCommonData();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, role: string) => {
    let password = 'Admin@123';
    if (role === 'hr') password = 'Hr@123';
    else if (email === 'fatima@saylaniit.com') password = 'Welcome@2026'; // temporary password
    else password = 'Saylani@2026';

    await handleLogin(email, password);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setCurrentUser(null);
  };

  const handleResetSystem = async () => {
    if (!window.confirm('Wipe system and reset to fresh installation?')) return;
    try {
      await apiRequest('/api/auth/reset', { method: 'POST' });
      setStoredToken(null);
      setCurrentUser(null);
      setInitialized(false);
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const handleSeedDemo = async () => {
    try {
      await apiRequest('/api/auth/seed', { method: 'POST' });
      // auto-login as Admin
      await handleLogin('admin@saylaniit.com', 'Admin@123');
      checkSystemStatus();
    } catch (err) {
      console.error('Seed demo error:', err);
    }
  };

  const openAIWithPrompt = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setShowAIAssistant(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center animate-pulse">
            EIIR
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Initializing HCM Lite Engine...
          </span>
        </div>
      </div>
    );
  }

  // 1. Fresh Install State -> First Run Setup
  if (initialized === false) {
    return (
      <FirstRunSetup
        onSetupComplete={(user, token) => {
          setStoredToken(token);
          setCurrentUser(user);
          setInitialized(true);
          loadCommonData();
        }}
        onLoadSeedData={handleSeedDemo}
      />
    );
  }

  // 2. Unauthenticated -> Login Screen with 1-Click Judge Shortcuts
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-lg">
              EIIR
            </div>
            <h1 className="text-2xl font-black text-white">HCM Lite Sign In</h1>
            <p className="text-xs text-slate-400 mt-1">
              Saylani Hackathon 2026 · AI-assisted Human Capital Management
            </p>
          </div>

          {/* Quick Login Judge Bar */}
          <div className="mb-6 p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">
              Judge Evaluation 1-Click Logins
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@saylaniit.com', 'admin')}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
              >
                Login as Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hr@saylaniit.com', 'hr')}
                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition"
              >
                Login as HR Lead
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('rashid@saylaniit.com', 'employee')}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition"
              >
                Login as Rashid (Dev)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('fatima@saylaniit.com', 'employee')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition text-[11px]"
              >
                Fatima (1st Login PW)
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-3.5 text-xs"
          >
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@saylaniit.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
            >
              {loginLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-[11px] text-slate-500">
            <button onClick={handleResetSystem} className="hover:text-slate-300">
              Reset to Fresh Install
            </button>
            <button onClick={handleSeedDemo} className="text-blue-400 font-semibold hover:underline">
              Load Saylani Demo Dataset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated App Layout
  const role = currentUser.role as UserRole;

  // Build navigation tabs based on role
  const navTabs =
    role === 'admin'
      ? [
          { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'employees', label: 'Employee Directory', icon: Users },
          { id: 'attendance', label: 'Attendance Board', icon: Clock },
          { id: 'leave', label: 'Leave Quotas', icon: Calendar },
          { id: 'payroll', label: 'Payroll Finalization', icon: DollarSign },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'settings', label: 'Org Setup & Audit', icon: Settings },
        ]
      : role === 'hr'
      ? [
          { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
          { id: 'employees', label: 'Employee Directory', icon: Users },
          { id: 'attendance', label: 'Daily Attendance', icon: Clock },
          { id: 'leave', label: 'Leave Approvals', icon: Calendar },
          { id: 'payroll', label: 'Payroll Drafts', icon: DollarSign },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
        ]
      : [
          { id: 'dashboard', label: 'Self-Service Home', icon: LayoutDashboard },
          { id: 'attendance', label: 'Punch & Calendar', icon: Clock },
          { id: 'leave', label: 'Leave Portal', icon: Calendar },
          { id: 'payroll', label: 'My Payslips', icon: DollarSign },
          { id: 'announcements', label: 'Company Notices', icon: Megaphone },
        ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        companyName={companyName}
        notifications={notifications}
        onOpenNotifications={() => {}}
        onOpenAIAssistant={() => setShowAIAssistant(true)}
        onOpenJudgeDemo={() => setShowJudgeDemo(true)}
        onQuickLogin={handleQuickLogin}
        onResetSystem={handleResetSystem}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Navigation Sub-bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <>
            {role === 'admin' && (
              <AdminDashboard
                onNavigateTab={setActiveTab}
                onOpenAIWithPrompt={openAIWithPrompt}
              />
            )}
            {role === 'hr' && (
              <HRDashboard
                onNavigateTab={setActiveTab}
                onOpenAIWithPrompt={openAIWithPrompt}
              />
            )}
            {role === 'employee' && (
              <EmployeeDashboard
                onOpenCameraModal={() => setShowCameraAttendance(true)}
                onOpenSmartLeave={() => setShowSmartLeave(true)}
                onOpenPayslip={(item) => setActivePayslipItem(item)}
                onOpenAIWithPrompt={openAIWithPrompt}
                onNavigateTab={setActiveTab}
              />
            )}
          </>
        )}

        {activeTab === 'employees' && (
          <EmployeeDirectory
            currentUserRole={role}
            onOpenAIWithPrompt={openAIWithPrompt}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            currentUserRole={role}
            onOpenCameraAttendance={() => setShowCameraAttendance(true)}
          />
        )}

        {activeTab === 'leave' && (
          <LeaveView
            currentUserRole={role}
            onOpenAIWithPrompt={openAIWithPrompt}
          />
        )}

        {activeTab === 'payroll' && (
          <PayrollView
            currentUserRole={role}
            companyName={companyName}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsView currentUserRole={role} />
        )}

        {activeTab === 'settings' && role === 'admin' && (
          <SettingsView currentUserRole={role} />
        )}
      </main>

      {/* Forced Password Change Modal on Temporary Password Sign-In */}
      <ChangePasswordModal
        isOpen={!!currentUser?.mustChangePassword}
        onSuccess={() => {
          setCurrentUser({ ...currentUser, mustChangePassword: false });
        }}
        isFirstSignIn={true}
      />

      {/* Camera Attendance Modal with Face Box & Geofence */}
      <CameraAttendanceModal
        isOpen={showCameraAttendance}
        onClose={() => setShowCameraAttendance(false)}
        onSuccess={() => {
          checkSystemStatus();
        }}
        settings={settings}
      />

      {/* Smart Leave Modal */}
      <SmartLeaveModal
        isOpen={showSmartLeave}
        onClose={() => setShowSmartLeave(false)}
        onSuccess={() => {
          checkSystemStatus();
        }}
        leaveTypes={[
          { id: 'lt-annual', name: 'annual', code: 'ANN', yearlyQuota: 14, paid: true, description: '' },
          { id: 'lt-sick', name: 'sick', code: 'SCK', yearlyQuota: 8, paid: true, description: '' },
          { id: 'lt-casual', name: 'casual', code: 'CSL', yearlyQuota: 10, paid: true, description: '' },
          { id: 'lt-unpaid', name: 'unpaid', code: 'UNP', yearlyQuota: 999, paid: false, description: '' },
        ]}
      />

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!activePayslipItem}
        onClose={() => setActivePayslipItem(null)}
        item={activePayslipItem}
        month="2026-10"
        companyName={companyName}
      />

      {/* AI Assistant Chat Drawer */}
      <AIAssistantDrawer
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        currentUser={currentUser}
        initialPrompt={aiInitialPrompt}
      />

      {/* 5-Minute Live Judging Demo Walkthrough Modal */}
      <JudgeDemoModal
        isOpen={showJudgeDemo}
        onClose={() => setShowJudgeDemo(false)}
        onQuickLogin={handleQuickLogin}
        onResetSystem={handleResetSystem}
        onSeedDemo={handleSeedDemo}
        onOpenAIWithPrompt={openAIWithPrompt}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}
