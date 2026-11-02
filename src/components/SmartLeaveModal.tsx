/**
 * HCM Lite - Smart Leave Modal (M8 & M5)
 * Natural language leave sentence parser into pre-filled leave application form
 */

import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, AlertCircle, CheckCircle, RotateCw } from 'lucide-react';
import { apiRequest } from '../services/api';
import { LeaveTypeConfig } from '../types/hcm';

interface SmartLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveTypes: LeaveTypeConfig[];
}

export const SmartLeaveModal: React.FC<SmartLeaveModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leaveTypes,
}) => {
  const [naturalText, setNaturalText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [parsedConfidence, setParsedConfidence] = useState(false);

  if (!isOpen) return null;

  const handleParseSentence = async () => {
    if (!naturalText.trim()) return;
    setIsParsing(true);
    setError(null);

    try {
      const res = await apiRequest('/api/ai/smart-leave', {
        method: 'POST',
        body: { sentence: naturalText },
      });

      if (res.parsed) {
        if (res.parsed.leaveTypeId) setLeaveTypeId(res.parsed.leaveTypeId);
        if (res.parsed.startDate) setStartDate(res.parsed.startDate);
        if (res.parsed.endDate) setEndDate(res.parsed.endDate);
        if (res.parsed.reason) setReason(res.parsed.reason);
        setParsedConfidence(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse natural language sentence.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError('Start date, end date, and reason are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest('/api/leaves/apply', {
        method: 'POST',
        body: {
          leaveTypeId,
          startDate,
          endDate,
          reason,
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const examplePrompts = [
    'Need next Monday and Tuesday off for my sister’s wedding',
    'I have fever and doctor advised rest for 2 days',
    'Kal aur parson bhai ki shadi hai chutti chahiye',
    'Need 1 week annual vacation next month with family',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Smart Leave Application
                <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                  AI-Powered
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Type in plain English or Roman Urdu · Form auto-fills for your confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-light leading-none"
          >
            &times;
          </button>
        </div>

        {/* Natural Language Input Box */}
        <div className="mt-4 p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl">
          <label className="block text-xs font-semibold text-purple-900 dark:text-purple-300 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Type your leave request in plain words:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              placeholder="e.g. Need next Monday and Tuesday off for sister's wedding"
              className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleParseSentence();
                }
              }}
            />
            <button
              type="button"
              onClick={handleParseSentence}
              disabled={isParsing || !naturalText.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition shrink-0"
            >
              {isParsing ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Extract
            </button>
          </div>

          {/* Quick Examples */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 self-center">Try:</span>
            {examplePrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setNaturalText(p)}
                className="text-[11px] px-2 py-0.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900/60 hover:border-purple-400 rounded text-slate-600 dark:text-slate-300 transition"
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>

        {/* Pre-filled Leave Form */}
        <form onSubmit={handleSubmitLeave} className="mt-4 space-y-3.5">
          {parsedConfidence && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Form pre-filled by AI. Please review the dates and confirm below.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Leave Category
            </label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name.toUpperCase()} (Quota: {lt.yearlyQuota === 999 ? 'Unlimited' : `${lt.yearlyQuota} days`})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Absence
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clear purpose of leave..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-slate-600 dark:text-slate-400 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Weekends (Sat-Sun) & public holidays skipped automatically.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-2 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                'Confirm & Submit Leave'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
