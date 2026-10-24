/**
 * HCM Lite - Company Communications & Announcements (M9)
 */

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Calendar, User, RotateCw, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Announcement, UserRole } from '../types/hcm';

interface AnnouncementsViewProps {
  currentUserRole: UserRole;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ currentUserRole }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Post announcement
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/announcements');
      setAnnouncements(res || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    try {
      await apiRequest('/api/announcements', {
        method: 'POST',
        body: { title, content, priority },
      });
      setTitle('');
      setContent('');
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          M9 Module · Corporate Communications
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
          Announcements & Bulletins
        </h1>
      </div>

      {/* Post announcement form (Admin & HR only) */}
      {currentUserRole !== 'employee' && (
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs text-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-blue-600" />
            Publish Company Announcement
          </h3>

          <form onSubmit={handleCreateAnnouncement} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  required
                  placeholder="Announcement Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl"
                />
              </div>
              <div>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-bold"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent / Critical</option>
                </select>
              </div>
            </div>

            <div>
              <textarea
                rows={2}
                required
                placeholder="Full notice content for company boards..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                {submitting ? 'Publishing...' : 'Broadcast Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
            No announcements published yet.
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {ann.title}
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300'
                        : ann.priority === 'important'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}
                  >
                    {ann.priority}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                {ann.content}
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <span>Published by {ann.authorName}</span>
                <span>•</span>
                <span className="uppercase font-semibold">{ann.authorRole}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
