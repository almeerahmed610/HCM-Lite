/**
 * HCM Lite - Interactive 5-Minute Demo Walkthrough Guide (Section 9)
 * Guides judges through the exact 5-minute hackathon evaluation sequence
 */

import React from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickLogin: (email: string, role: string) => void;
  onResetSystem: () => void;
  onSeedDemo: () => void;
  onOpenAIWithPrompt: (prompt: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({
  isOpen,
  onClose,
  onQuickLogin,
  onResetSystem,
  onSeedDemo,
  onOpenAIWithPrompt,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const demoSteps = [
    {
      num: '1',
      title: 'First-Run Setup & Organization',
      role: 'Admin',
      roleColor: 'bg-indigo-600',
      description: 'Admin configures company name, office start time (09:00), 15m grace, IT Park geofence, departments, and creates HR login.',
      actions: [
        { label: 'Login as Admin', onClick: () => onQuickLogin('admin@saylaniit.com', 'admin') },
        { label: 'Open Org Settings', onClick: () => onNavigateTab('settings') },
      ],
    },
    {
      num: '2',
      title: 'HR Registers Employees & Temp Password',
      role: 'HR',
      roleColor: 'bg-teal-600',
      description: 'HR registers employees with job details, department, and salary. Creates login with temporary password (must change on first sign-in).',
      actions: [
        { label: 'Login as HR', onClick: () => onQuickLogin('hr@saylaniit.com', 'hr') },
        { label: 'Employee Directory', onClick: () => onNavigateTab('employees') },
      ],
    },
    {
      num: '3',
      title: 'Employee First Login, Password Change & Camera Check-in',
      role: 'Employee',
      roleColor: 'bg-amber-600',
      description: 'Fatima logs in with temporary password, changes it, and marks attendance using Web or Camera with face detection + geofence.',
      actions: [
        { label: 'Login as Fatima (Temp PW)', onClick: () => onQuickLogin('fatima@saylaniit.com', 'employee') },
        { label: 'Self-Service Dashboard', onClick: () => onNavigateTab('dashboard') },
      ],
    },
    {
      num: '4',
      title: 'Smart Leave (Plain Words) & HR Approval',
      role: 'Employee / HR',
      roleColor: 'bg-emerald-600',
      description: 'Employee types: "Need next Monday and Tuesday off for my sister\'s wedding" (or Roman Urdu). AI pre-fills the form. HR approves with comment.',
      actions: [
        { label: 'Apply Leave (Smart Form)', onClick: () => onNavigateTab('leave') },
        { label: 'Switch to HR to Approve', onClick: () => onQuickLogin('hr@saylaniit.com', 'hr') },
      ],
    },
    {
      num: '5',
      title: 'HR AI Summary, Who is on leave? & Payroll Run',
      role: 'HR',
      roleColor: 'bg-teal-600',
      description: 'HR clicks "Summarize" on dashboard, asks AI "Who is on leave today?", and prepares monthly payroll draft for October 2026.',
      actions: [
        { label: 'HR Dashboard (AI Summary)', onClick: () => onNavigateTab('dashboard') },
        { label: 'Ask AI "Who is on leave?"', onClick: () => onOpenAIWithPrompt('Who is on leave today?') },
        { label: 'Prepare Payroll Draft', onClick: () => onNavigateTab('payroll') },
      ],
    },
    {
      num: '6',
      title: 'Admin Finalizes Payroll & Locks the Month',
      role: 'Admin',
      roleColor: 'bg-indigo-600',
      description: 'Admin reviews the monthly payroll with tax slabs and deductions, then finalizes and permanently locks it.',
      actions: [
        { label: 'Login as Admin', onClick: () => onQuickLogin('admin@saylaniit.com', 'admin') },
        { label: 'Finalize Payroll', onClick: () => onNavigateTab('payroll') },
      ],
    },
    {
      num: '7',
      title: 'Payslip Download & Colleague Salary Refusal Test',
      role: 'Employee',
      roleColor: 'bg-amber-600',
      description: 'Employee views/downloads PDF payslip, then asks AI "What is colleague\'s salary?" which the AI politely refuses under RBAC.',
      actions: [
        { label: 'Login as Rashid', onClick: () => onQuickLogin('rashid@saylaniit.com', 'employee') },
        { label: 'Test Salary Refusal in AI', onClick: () => onOpenAIWithPrompt('What is Hamza Tariq\'s salary?') },
        { label: 'Open Audit Log (Admin)', onClick: () => { onQuickLogin('admin@saylaniit.com', 'admin'); onNavigateTab('settings'); } },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full p-6 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Saylani Hackathon · 5-Minute Judging Demo
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium">
                  100 Pts + 10 Bonus
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                24 October 2026 · Zaitoon Ashraf IT Park · Interactive Evaluation Checklist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-light leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Quick Setup Actions */}
        <div className="my-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Judge Quick Controls:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSeedDemo();
                onClose();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Populate Full Demo Dataset
            </button>
            <button
              onClick={() => {
                onResetSystem();
                onClose();
              }}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset (Fresh Start)
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm">
          {demoSteps.map((step) => (
            <div
              key={step.num}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                    {step.num}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white ${step.roleColor}`}
                >
                  {step.role}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 ml-8">
                {step.description}
              </p>
              <div className="flex flex-wrap gap-2 ml-8">
                {step.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      act.onClick();
                      onClose();
                    }}
                    className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-700 dark:text-slate-200 rounded-md font-medium transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>{act.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bonus Checklist */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Bonus Points (+10) included:
            </span>
            <span>Camera Attendance · Attrition Risk · Roman Urdu AI · Late Penalty Rule · Dark Mode</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
