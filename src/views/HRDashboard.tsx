/**
 * HCM Lite - HR Operations Dashboard (M7)
 * Implements Headcount, Present, On leave, Late today, Attendance Rate, Top Late Comers & AI Summary
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  RotateCw,
  BellRing,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface HRDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenAIWithPrompt: (prompt: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({
  onNavigateTab,
  onOpenAIWithPrompt,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/dashboards/hr');
      setData(res);
    } catch (e) {
      console.error('Failed to load HR dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!data) return;
    setSummarizing(true);
    try {
      const res = await apiRequest('/api/ai/summarize', {
        method: 'POST',
        body: { kpis: data },
      });
      setAiSummary(res.bullets);
    } catch (e) {
      console.error('Failed to summarize dashboard:', e);
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <RotateCw className="w-6 h-6 animate-spin text-teal-600 mr-2" />
        <span>Loading People Operations Board...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            HR · People Operations
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            Daily Workforce Operations & Approvals
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            {summarizing ? <RotateCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{aiSummary ? 'Regenerate Summary' : 'AI Summary'}</span>
          </button>
        </div>
      </div>

      {/* AI Summary Banner */}
      {aiSummary && (
        <div className="p-4 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
              Operations Intelligence Bullets
            </h3>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-200/60 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-semibold ml-auto">
              AI-generated
            </span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {aiSummary.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pending Action Required Banner */}
      {data.pendingApprovals > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-300">
                Action Required: {data.pendingApprovals} Pending Requests
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                {data.pendingLeavesCount || 0} leave applications and{' '}
                {data.pendingCorrectionsCount || 0} attendance correction punches waiting for HR approval.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigateTab('leave')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition"
            >
              Review Leaves
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-semibold rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
            >
              Review Corrections
            </button>
          </div>
        </div>
      )}

      {/* Daily Numbers Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Headcount
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {data.headcount}
          </span>
          <span className="text-[10px] text-slate-400">Total active</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Present
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {data.presentToday}
          </span>
          <span className="text-[10px] text-slate-400">On time</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Late Today
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {data.lateToday}
          </span>
          <span className="text-[10px] text-slate-400">After 09:15</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            On Leave
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {data.onLeaveToday}
          </span>
          <span className="text-[10px] text-slate-400">Approved</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            Half Day
          </span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">
            {data.halfDayToday || 0}
          </span>
          <span className="text-[10px] text-slate-400">&lt; 5 hours</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
            Attendance Rate
          </span>
          <span className="text-2xl font-black text-teal-600 mt-1 block">
            {data.attendanceRate}
          </span>
          <span className="text-[10px] text-slate-400">Section 7 formula</span>
        </div>
      </div>

      {/* Operational Highlights: Top Late Comers & Leave Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Late Comers */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Top Late-Comers this Month (Section 7)
              </h3>
            </div>
            <button
              onClick={() => onOpenAIWithPrompt('Who came late most often this month?')}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              Ask AI Assistant →
            </button>
          </div>

          <div className="space-y-2.5">
            {(!data.topLateComers || data.topLateComers.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No repeated late check-ins recorded for this month.
              </p>
            ) : (
              data.topLateComers.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.employeeName}
                      </p>
                      <p className="text-[10px] text-slate-400">{item.department}</p>
                    </div>
                  </div>
                  <span className="font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                    {item.count} lates
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leave Utilization by Type */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Leave Utilization by Category
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('leave')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Approvals Inbox →
            </button>
          </div>

          <div className="space-y-3.5">
            {data.leaveByType?.map((item: any) => {
              const quota = item.quota === 999 ? 50 : item.quota;
              const pct = Math.min(100, Math.round((item.usedDays / Math.max(1, quota)) * 100));

              return (
                <div key={item.name} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {item.usedDays} days used / {item.quota === 999 ? 'Unlimited' : `${item.quota} quota`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
