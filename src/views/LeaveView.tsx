/**
 * HCM Lite - Leave Portal & Approval Inbox (M5)
 * Implements Working Days calculation, Quotas, Overlap & Balance checks (422), Smart Leave & HR Approvals
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Plus,
  MessageSquare,
  XCircle,
  FileText,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { LeaveTypeConfig, UserRole } from '../types/hcm';
import { SmartLeaveModal } from '../components/SmartLeaveModal';

interface LeaveViewProps {
  currentUserRole: UserRole;
  onOpenAIWithPrompt: (prompt: string) => void;
}

export const LeaveView: React.FC<LeaveViewProps> = ({
  currentUserRole,
  onOpenAIWithPrompt,
}) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [inboxLeaves, setInboxLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Review comment
  const [hrComments, setHrComments] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    setLoading(true);
    try {
      const [typesRes, balRes, myRes] = await Promise.all([
        apiRequest('/api/leave-types'),
        apiRequest('/api/leaves/balances'),
        apiRequest('/api/leaves/my'),
      ]);

      setLeaveTypes(typesRes || []);
      setBalances(balRes || []);
      setMyLeaves(myRes || []);
      if (typesRes?.length > 0 && !leaveTypeId) setLeaveTypeId(typesRes[0].id);

      if (currentUserRole !== 'employee') {
        const inboxRes = await apiRequest('/api/leaves/inbox');
        setInboxLeaves(inboxRes || []);
      }
    } catch (err) {
      console.error('Failed to load leave records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplyError(null);

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

      setShowApplyModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      loadLeaveData();
    } catch (err: any) {
      setApplyError(err.message || 'Leave application failed.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleReviewLeave = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const comment = hrComments[id] || (status === 'approved' ? 'Approved by HR' : 'Rejected');
      await apiRequest(`/api/leaves/${id}/review`, {
        method: 'POST',
        body: { status, hrComment: comment },
      });
      loadLeaveData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
            M5 Module · Time Off & Absence
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            Leave Requests & Quotas
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSmartModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Leave (Plain Words)</span>
          </button>

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply Leave Form</span>
          </button>
        </div>
      </div>

      {/* Leave Quota Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {balances.map((b) => (
          <div
            key={b.leaveTypeId}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {b.leaveTypeName}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {b.remaining === 999 ? '∞' : b.remaining}
              </span>
              <span className="text-xs text-slate-400">
                / {b.quota === 999 ? 'Unl' : `${b.quota} days`}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 flex justify-between border-t border-slate-100 dark:border-slate-700 pt-1.5">
              <span>Used: {b.used} days</span>
              <span className="text-emerald-600 font-medium">Working days</span>
            </div>
          </div>
        ))}
      </div>

      {/* HR Approvals Inbox (Visible to HR & Admin) */}
      {currentUserRole !== 'employee' && (
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Leave Approvals Inbox (HR Operations)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {inboxLeaves.filter((l) => l.status === 'pending').length} pending approval
            </span>
          </div>

          {inboxLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No leave requests in inbox.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {inboxLeaves.map((l) => (
                <div
                  key={l.id}
                  className="py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {l.employeeName}
                      </span>
                      <span className="text-slate-400 font-mono">({l.employeeCode})</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {l.leaveTypeName}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {l.startDate} to {l.endDate} ({l.workingDays} working days)
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full ${
                          l.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Reason: "{l.reason}"
                    </p>
                    {l.hrComment && (
                      <p className="text-[11px] text-teal-600">HR Comment: {l.hrComment}</p>
                    )}
                  </div>

                  {l.status === 'pending' && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="HR review comment..."
                        value={hrComments[l.id] || ''}
                        onChange={(e) =>
                          setHrComments({ ...hrComments, [l.id]: e.target.value })
                        }
                        className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex-1 md:w-48"
                      />
                      <button
                        onClick={() => handleReviewLeave(l.id, 'approved')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewLeave(l.id, 'rejected')}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Leave Requests Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            My Absence & Leave Applications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-750/70 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date Range</th>
                <th className="py-3 px-4">Working Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status & Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {myLeaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                myLeaves.map((l) => {
                  const lt = leaveTypes.find((t) => t.id === l.leaveTypeId);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {lt?.name.toUpperCase() || 'Leave'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {l.startDate} to {l.endDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600">
                        {l.workingDays} days
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {l.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            l.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : l.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status}
                        </span>
                        {l.hrComment && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            "{l.hrComment}"
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800 dark:text-slate-100">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Apply for Leave
            </h3>
            <p className="text-slate-500 mb-4">
              Weekends (Sat-Sun) and configured holidays are excluded automatically.
            </p>

            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Leave Category</label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
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
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason for Absence *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the reason clearly..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              {applyError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300">
                  {applyError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="flex-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {applyLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Leave Modal */}
      <SmartLeaveModal
        isOpen={showSmartModal}
        onClose={() => setShowSmartModal(false)}
        onSuccess={() => loadLeaveData()}
        leaveTypes={leaveTypes}
      />
    </div>
  );
};
