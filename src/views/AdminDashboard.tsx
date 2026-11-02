/**
 * HCM Lite - Admin Executive Dashboard (M7)
 * Implements Headcount, Attrition YTD, Payroll Cost, Avg Salary, Dept Breakdown, Gender, Live Audit & AI Summary
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingDown,
  DollarSign,
  Briefcase,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Building2,
  PieChart,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenAIWithPrompt: (prompt: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
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
      const res = await apiRequest('/api/dashboards/admin');
      setData(res);
    } catch (e) {
      console.error('Failed to load admin dashboard:', e);
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
        <RotateCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading Executive Intelligence...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Page Title & AI Summarize Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Admin · Company Level Governance
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            Executive Overview & HR Analytics
          </h1>
        </div>
        <button
          onClick={handleSummarize}
          disabled={summarizing}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          {summarizing ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{aiSummary ? 'Regenerate AI Summary' : 'AI Executive Summary'}</span>
        </button>
      </div>

      {/* AI Summary Banner (Section 4 & 7) */}
      {aiSummary && (
        <div className="p-4 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
              AI Insight Summary (Computed from Live Records)
            </h3>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-200/60 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-semibold ml-auto">
              AI-generated
            </span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {aiSummary.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Headcount</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {data.headcount}
            </span>
            <span className="text-xs text-slate-500">
              ({data.activeCount} active, {data.probationCount} probation)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span>Formula: Active + Probation</span>
            <span className="text-emerald-600 font-medium">100% Retained</span>
          </div>
        </div>

        {/* Attrition YTD */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Attrition Rate YTD</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {data.attritionRate}
            </span>
            <span className="text-xs text-slate-500">({data.exitedCount} exits)</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span>Exits / Avg Headcount × 100</span>
            <span className="text-emerald-600 font-medium">Stable</span>
          </div>
        </div>

        {/* Payroll Cost */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Payroll Liability</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">PKR</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data.totalPayrollCost?.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span>Gross = 1.5 × Basic</span>
            <button
              onClick={() => onNavigateTab('payroll')}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Review Run
            </button>
          </div>
        </div>

        {/* Average Salary */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Gross Salary</span>
            <Briefcase className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">PKR</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data.averageSalary?.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span>Mean Gross across depts</span>
            <span className="text-slate-400">Monthly</span>
          </div>
        </div>
      </div>

      {/* Department Breakdown & Diversity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Headcount & Payroll by Department
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('employees')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Directory</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {data.headcountByDept?.map((dept: any) => {
              const maxHeadcount = Math.max(1, ...data.headcountByDept.map((d: any) => d.headcount));
              const pct = Math.round((dept.headcount / maxHeadcount) * 100);

              return (
                <div key={dept.departmentId} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-800 dark:text-slate-200">
                      {dept.departmentName} ({dept.code})
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {dept.headcount} employees · PKR {dept.payrollCost?.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender & Demographics */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Workforce Demographics
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Male Representation</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {data.genderDistribution?.male || 0} employees
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Female Representation</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {data.genderDistribution?.female || 0} employees
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Other / Unspecified</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {data.genderDistribution?.other || 0} employees
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
            <button
              onClick={() => onOpenAIWithPrompt('Summarize workforce demographics and gender ratio')}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              Analyze Tenure & Retention with AI →
            </button>
          </div>
        </div>
      </div>

      {/* Live Audit Feed (M9 Specification) */}
      <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Live Governance Audit Feed (M9)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            View Full Audit Log →
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
          {data.auditFeed?.slice(0, 5).map((log: any) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {log.summary}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                  <span>Actor: {log.actorName} ({log.actorRole})</span>
                  <span>•</span>
                  <span>Entity: {log.entity}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
