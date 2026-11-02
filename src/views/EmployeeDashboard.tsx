/**
 * HCM Lite - Employee Self-Service Dashboard (M7 & M4)
 * Implements Check-in widget (Web & Camera), weekly hours vs 40h, late count, leave balance, payslip & announcements
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Camera,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Sparkles,
  Bot,
  RotateCw,
  LogOut,
  MapPin,
  Megaphone,
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface EmployeeDashboardProps {
  onOpenCameraModal: () => void;
  onOpenSmartLeave: () => void;
  onOpenPayslip: (item: any) => void;
  onOpenAIWithPrompt: (prompt: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  onOpenCameraModal,
  onOpenSmartLeave,
  onOpenPayslip,
  onOpenAIWithPrompt,
  onNavigateTab,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/dashboards/employee');
      setData(res);
    } catch (e) {
      console.error('Failed to load employee dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleWebCheckIn = async () => {
    setCheckingIn(true);
    setFeedbackMsg(null);
    try {
      const res = await apiRequest('/api/attendance/check-in', {
        method: 'POST',
        body: { source: 'web', date: '2026-10-24' },
      });
      setFeedbackMsg({ text: res.message || 'Checked in successfully.' });
      loadDashboard();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Check-in failed.', error: true });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    setFeedbackMsg(null);
    try {
      const res = await apiRequest('/api/attendance/check-out', {
        method: 'POST',
        body: { date: '2026-10-24' },
      });
      setFeedbackMsg({ text: res.message || 'Checked out successfully.' });
      loadDashboard();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Check-out failed.', error: true });
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <RotateCw className="w-6 h-6 animate-spin text-amber-600 mr-2" />
        <span>Loading Self-Service Portal...</span>
      </div>
    );
  }

  if (!data) return null;

  const todayAtt = data.todayAttendance;
  const hoursPct = Math.min(100, Math.round(((data.weeklyHoursWorked || 0) / 40) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-3xl shadow-lg">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
            Self-Service Hub
          </span>
          <h1 className="text-2xl font-black">
            Welcome, {data.employee?.firstName || 'Colleague'}!
          </h1>
          <p className="text-xs text-amber-100 mt-0.5">
            {data.employee?.code} · {data.employee?.departmentName || 'Engineering'} · Zaitoon Ashraf IT Park
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onOpenAIWithPrompt('How many sick leaves do I have left this year?')}
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>Ask My Assistant</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
            feedbackMsg.error
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {feedbackMsg.error ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Check-in Widget & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Check-in Widget (Section 4 & 5) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Daily Attendance Station (2026-10-24)
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Shift: 09:00 - 18:00
            </span>
          </div>

          {/* Current Punch Status */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
                Today's Attendance Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                {todayAtt ? (
                  <>
                    <span
                      className={`text-sm font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                        todayAtt.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : todayAtt.status === 'late'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                      }`}
                    >
                      {todayAtt.status}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      In at{' '}
                      {new Date(todayAtt.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {todayAtt.checkOutTime &&
                        ` · Out at ${new Date(todayAtt.checkOutTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Not Checked In Yet
                  </span>
                )}
              </div>
              {todayAtt?.source === 'camera' && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Camera Face Verified (Within Geofence)
                </span>
              )}
            </div>

            {/* Check-in Buttons */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {!todayAtt ? (
                <>
                  <button
                    onClick={handleWebCheckIn}
                    disabled={checkingIn}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    {checkingIn ? <RotateCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    Web Check-In
                  </button>
                  <button
                    onClick={onOpenCameraModal}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    Camera Check-In
                  </button>
                </>
              ) : !todayAtt.checkOutTime ? (
                <button
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  {checkingOut ? <RotateCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Check Out
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-400">Day Completed</span>
              )}
            </div>
          </div>

          {/* Rules Reminder */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-slate-600 dark:text-slate-400 text-xs flex items-center justify-between">
            <span>Grace period: 15m (up to 09:15) · Shifts under 5h recorded as Half Day</span>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Request Correction →
            </button>
          </div>
        </div>

        {/* Weekly Hours & Lates Meter */}
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Weekly Target (40h)
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {data.weeklyHoursWorked}h / 40h
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${hoursPct}%` }}
              />
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Lates Recorded this Month:</span>
              <span
                className={`font-black text-sm px-2 py-0.5 rounded ${
                  data.latesCount >= 3
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200'
                }`}
              >
                {data.latesCount} lates
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400">
              {data.latesCount >= 3
                ? 'Warning: 3 lates penalty triggers 0.5 day deduction.'
                : 'Punctuality status is in good standing.'}
            </span>
          </div>
        </div>
      </div>

      {/* Leave Balances Section */}
      <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Annual Leave Balances (Working Days Only)
            </h3>
            <p className="text-xs text-slate-500">
              Weekends (Sat-Sun) and public holidays are automatically excluded from leave deductions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onOpenSmartLeave}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Smart Leave in Plain Words
            </button>
            <button
              onClick={() => onNavigateTab('leave')}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Leave History
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.leaveBalances?.map((bal: any) => (
            <div
              key={bal.id}
              className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-100 dark:border-slate-700/60"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {bal.name}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {bal.remaining === 999 ? '∞' : bal.remaining}
                </span>
                <span className="text-xs text-slate-400">
                  / {bal.quota === 999 ? 'Unl' : bal.quota} days left
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {bal.used} days approved this year
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Payslip & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payslip Card */}
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Latest Finalized Payslip
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                Verified Run
              </span>
            </div>

            {data.lastPayslip ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Salary (1.5 × Basic):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    PKR {data.lastPayslip.grossSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Deductions:</span>
                  <span className="font-semibold text-rose-600">
                    - PKR {data.lastPayslip.totalDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Income Tax (Slab Rate):</span>
                  <span className="font-semibold text-rose-600">
                    - PKR {data.lastPayslip.monthlyTax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600 font-bold text-sm text-blue-600 dark:text-blue-400">
                  <span>Net Disbursed Pay:</span>
                  <span>PKR {data.lastPayslip.netSalary.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No finalized payroll run published yet.
              </p>
            )}
          </div>

          {data.lastPayslip && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
              <button
                onClick={() => onOpenPayslip(data.lastPayslip)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                View & Download Official PDF Payslip
              </button>
            </div>
          )}
        </div>

        {/* Company Announcements (M9) */}
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Company Announcements (M9)
              </h3>
            </div>

            <div className="space-y-2.5">
              {(!data.announcements || data.announcements.length === 0) ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No company notices at this time.
                </p>
              ) : (
                data.announcements.map((a: any) => (
                  <div
                    key={a.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">{a.title}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold uppercase">
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-2">
                      {a.content}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Posted by {a.authorName}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
