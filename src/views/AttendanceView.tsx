/**
 * HCM Lite - Attendance Management & Daily Board (M4)
 * Implements Daily Attendance Board, Corrections Request & Review, Calendar and Camera verification
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Camera,
  MapPin,
  Plus,
  MessageSquare,
  Shield,
  FileCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { UserRole } from '../types/hcm';

interface AttendanceViewProps {
  currentUserRole: UserRole;
  onOpenCameraAttendance: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentUserRole,
  onOpenCameraAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-10-24');
  const [board, setBoard] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Correction Request Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrDate, setCorrDate] = useState('2026-10-23');
  const [corrIn, setCorrIn] = useState('09:00');
  const [corrOut, setCorrOut] = useState('18:00');
  const [corrReason, setCorrReason] = useState('');
  const [submittingCorr, setSubmittingCorr] = useState(false);

  // Review comment state
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const [boardRes, corrRes] = await Promise.all([
        apiRequest(`/api/attendance/board?date=${selectedDate}`),
        apiRequest('/api/attendance/corrections'),
      ]);
      setBoard(boardRes.board || []);
      setCorrections(corrRes || []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrDate || !corrIn || !corrReason) return;
    setSubmittingCorr(true);
    try {
      await apiRequest('/api/attendance/corrections', {
        method: 'POST',
        body: {
          date: corrDate,
          requestedCheckIn: corrIn,
          requestedCheckOut: corrOut,
          reason: corrReason,
        },
      });
      setShowCorrectionModal(false);
      setCorrReason('');
      loadAttendanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit correction');
    } finally {
      setSubmittingCorr(false);
    }
  };

  const handleReviewCorrection = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await apiRequest(`/api/attendance/corrections/${id}/review`, {
        method: 'POST',
        body: { status, comment: reviewComment || 'Reviewed by HR' },
      });
      setReviewComment('');
      loadAttendanceData();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            M4 Module · Time & Attendance
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            Attendance Operations & Corrections
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {currentUserRole === 'employee' && (
            <>
              <button
                onClick={onOpenCameraAttendance}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Check-In</span>
              </button>
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Correction</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Date Filter & Board Header */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900 dark:text-white">Daily Attendance Board:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
          />
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Present
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Late (&gt;09:15)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Half Day (&lt;5h)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> On Leave
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Absent
          </span>
        </div>
      </div>

      {/* Attendance Board Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-750/70 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source & Geofence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading board records...
                  </td>
                </tr>
              ) : board.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No records found for {selectedDate}.
                  </td>
                </tr>
              ) : (
                board.map((row) => (
                  <tr key={row.employeeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {row.employeeName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {row.employeeCode} · {row.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {row.checkInTime
                        ? new Date(row.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {row.checkOutTime
                        ? new Date(row.checkOutTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {row.hoursWorked ? `${row.hoursWorked} hrs` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          row.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : row.status === 'late'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : row.status === 'half_day'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : row.status === 'on_leave'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {row.source === 'camera' ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Camera className="w-3 h-3" /> Camera (Geofence Verified)
                        </span>
                      ) : row.checkInTime ? (
                        <span>Web Check-In</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Corrections Section */}
      <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Attendance Correction Requests (M4)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {corrections.filter((c) => c.status === 'pending').length} pending review
          </span>
        </div>

        {corrections.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No correction requests recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
            {corrections.map((corr) => (
              <div
                key={corr.id}
                className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Date: {corr.date}
                    </span>
                    <span className="text-slate-400">
                      Requested: {corr.requestedCheckIn} to {corr.requestedCheckOut}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full ${
                        corr.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : corr.status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {corr.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Reason: "{corr.reason}"
                  </p>
                  {corr.hrComment && (
                    <p className="text-[11px] text-teal-600 mt-0.5">HR comment: {corr.hrComment}</p>
                  )}
                </div>

                {currentUserRole !== 'employee' && corr.status === 'pending' && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Review comment..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                    <button
                      onClick={() => handleReviewCorrection(corr.id, 'approved')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewCorrection(corr.id, 'rejected')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
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

      {/* Request Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800 dark:text-slate-100">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Submit Attendance Correction
            </h3>
            <p className="text-slate-500 mb-4">
              Missed a punch due to connectivity or client visit? Request an HR correction with a valid reason.
            </p>

            <form onSubmit={handleSubmitCorrection} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={corrDate}
                  onChange={(e) => setCorrDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Check-In Time</label>
                  <input
                    type="time"
                    value={corrIn}
                    onChange={(e) => setCorrIn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    value={corrOut}
                    onChange={(e) => setCorrOut(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Justification Reason *</label>
                <textarea
                  rows={2}
                  required
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="e.g. Electric power cut at home during remote shift"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCorr}
                  className="flex-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  {submittingCorr ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
