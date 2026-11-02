/**
 * HCM Lite - Organization Setup & Governance Audit Log (M2 & M9)
 * Configures Office Start 09:00, Grace 15m, 5h Half Day, Geofence radius, HR Logins & Full Audit Log
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  MapPin,
  Clock,
  Shield,
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCw,
  Key,
  UserCheck,
  UserX,
  FileCode,
  Calendar,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { CompanySettings, Department, Designation, PublicHoliday, UserRole } from '../types/hcm';

interface SettingsViewProps {
  currentUserRole: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUserRole }) => {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'depts' | 'holidays' | 'hrusers' | 'audit'>('rules');

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [hrUsers, setHrUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings edit form
  const [officeStartTime, setOfficeStartTime] = useState('09:00');
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [halfDayHours, setHalfDayHours] = useState(5);
  const [officeLat, setOfficeLat] = useState(24.8607);
  const [officeLng, setOfficeLng] = useState(67.0011);
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [address, setAddress] = useState('Zaitoon Ashraf IT Park, Karachi, Pakistan');
  const [latePenalty, setLatePenalty] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Add HR User Modal state
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('Hr@123');
  const [addingHr, setAddingHr] = useState(false);

  // Add Dept state
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // Selected audit diff modal
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const [setRes, deptRes, desRes, holRes] = await Promise.all([
        apiRequest('/api/settings'),
        apiRequest('/api/departments'),
        apiRequest('/api/designations'),
        apiRequest('/api/holidays'),
      ]);

      setSettings(setRes);
      if (setRes) {
        setOfficeStartTime(setRes.officeStartTime);
        setGraceMinutes(setRes.graceMinutes);
        setHalfDayHours(setRes.halfDayThresholdHours);
        if (setRes.officeLocation) {
          setOfficeLat(setRes.officeLocation.lat);
          setOfficeLng(setRes.officeLocation.lng);
          setRadiusMeters(setRes.officeLocation.radiusMeters);
          setAddress(setRes.officeLocation.address);
        }
        setLatePenalty(setRes.latePenaltyEnabled ?? true);
      }

      setDepartments(deptRes || []);
      setDesignations(desRes || []);
      setHolidays(holRes || []);

      if (currentUserRole === 'admin') {
        const [hrRes, audRes] = await Promise.all([
          apiRequest('/api/users/hr'),
          apiRequest('/api/audit-logs'),
        ]);
        setHrUsers(hrRes || []);
        setAuditLogs(audRes || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = {
        officeStartTime,
        graceMinutes: Number(graceMinutes),
        halfDayThresholdHours: Number(halfDayHours),
        officeLocation: {
          lat: Number(officeLat),
          lng: Number(officeLng),
          radiusMeters: Number(radiusMeters),
          address,
        },
        latePenaltyEnabled: latePenalty,
      };

      await apiRequest('/api/settings', {
        method: 'PUT',
        body: updated,
      });

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateHrUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrName || !hrEmail || !hrPassword) return;
    setAddingHr(true);
    try {
      await apiRequest('/api/users/hr', {
        method: 'POST',
        body: { name: hrName, email: hrEmail, password: hrPassword },
      });
      setHrName('');
      setHrEmail('');
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to create HR account');
    } finally {
      setAddingHr(false);
    }
  };

  const handleToggleHrStatus = async (id: string, currentActive: boolean) => {
    try {
      await apiRequest(`/api/users/${id}/status`, {
        method: 'PUT',
        body: { active: !currentActive },
      });
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to update account status');
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    try {
      await apiRequest('/api/departments', {
        method: 'POST',
        body: { name: deptName, code: deptCode },
      });
      setDeptName('');
      setDeptCode('');
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <RotateCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading Organization Configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          M2 & M9 Modules · Governance & Audit
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
          Organization Setup & System Audit
        </h1>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2 rounded-xl transition ${
            activeSubTab === 'rules'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Company Rules & Geofence
        </button>

        <button
          onClick={() => setActiveSubTab('depts')}
          className={`px-4 py-2 rounded-xl transition ${
            activeSubTab === 'depts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Departments & Designations
        </button>

        <button
          onClick={() => setActiveSubTab('holidays')}
          className={`px-4 py-2 rounded-xl transition ${
            activeSubTab === 'holidays'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Public Holidays Calendar
        </button>

        {currentUserRole === 'admin' && (
          <>
            <button
              onClick={() => setActiveSubTab('hrusers')}
              className={`px-4 py-2 rounded-xl transition ${
                activeSubTab === 'hrusers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              HR Logins Management
            </button>

            <button
              onClick={() => setActiveSubTab('audit')}
              className={`px-4 py-2 rounded-xl transition ${
                activeSubTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Audit Log (M9)
            </button>
          </>
        )}
      </div>

      {/* SUBTAB 1: Company Rules & Geofence */}
      {activeSubTab === 'rules' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Office Hours & Status Evaluation Rules (Section 3)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Office Start Time
                </label>
                <input
                  type="text"
                  value={officeStartTime}
                  onChange={(e) => setOfficeStartTime(e.target.value)}
                  disabled={currentUserRole !== 'admin'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-mono"
                  placeholder="09:00"
                />
                <p className="text-[10px] text-slate-400 mt-1">Default start time: 09:00 AM</p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  disabled={currentUserRole !== 'admin'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Late flagged after 09:15</p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Half Day Duration Threshold (Hours)
                </label>
                <input
                  type="number"
                  value={halfDayHours}
                  onChange={(e) => setHalfDayHours(Number(e.target.value))}
                  disabled={currentUserRole !== 'admin'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Under 5 hours = Half Day</p>
              </div>
            </div>

            {/* Late penalty rule bonus */}
            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Bonus Penalty Rule: 3 Lates = 0.5 Day Deduction (+10 Pts)
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically flags a 0.5-day salary deduction for every 3 late check-ins in monthly payroll.
                </span>
              </div>
              <input
                type="checkbox"
                checked={latePenalty}
                onChange={(e) => setLatePenalty(e.target.checked)}
                disabled={currentUserRole !== 'admin'}
                className="w-5 h-5 rounded text-blue-600"
              />
            </div>
          </div>

          {/* Geofence Card */}
          <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Premises Geofence & Camera Attendance Coordinates (Section 5)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Office Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={officeLat}
                  onChange={(e) => setOfficeLat(Number(e.target.value))}
                  disabled={currentUserRole !== 'admin'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Office Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={officeLng}
                  onChange={(e) => setOfficeLng(Number(e.target.value))}
                  disabled={currentUserRole !== 'admin'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Geofence Radius (Meters)
                </label>
                <input
                  type="number"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  disabled={currentUserRole !== 'admin'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Official Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={currentUserRole !== 'admin'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl"
              />
            </div>
          </div>

          {settingsSaved && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated successfully and logged in immutable audit feed.
            </div>
          )}

          {currentUserRole === 'admin' && (
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              {savingSettings ? <RotateCw className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              <span>Save & Apply Configuration Rules</span>
            </button>
          )}
        </form>
      )}

      {/* SUBTAB 2: Departments & Designations */}
      {activeSubTab === 'depts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Departments
            </h3>

            {currentUserRole === 'admin' && (
              <form onSubmit={handleCreateDept} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Department Name (e.g. Marketing)"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="flex-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Code (MKT)"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-mono uppercase"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  Add
                </button>
              </form>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {departments.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{d.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Code: {d.code}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              Designations
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {designations.map((des) => {
                const dept = departments.find((d) => d.id === des.departmentId)?.name || 'General';
                return (
                  <div key={des.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{des.title}</span>
                      <span className="text-[10px] text-slate-400">Dept: {dept}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Public Holidays */}
      {activeSubTab === 'holidays' && (
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Official Public Holidays Calendar (Excluded from Working Days)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {holidays.map((h) => (
              <div key={h.id} className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">{h.name}</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px] font-semibold">{h.date}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">{h.description || 'Public Holiday'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: HR Logins Management (Admin Only) */}
      {activeSubTab === 'hrusers' && currentUserRole === 'admin' && (
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-600" />
            Provision HR Logins (Section 2 & 8)
          </h3>

          <form onSubmit={handleCreateHrUser} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="HR Full Name"
              value={hrName}
              onChange={(e) => setHrName(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={hrEmail}
              onChange={(e) => setHrEmail(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl"
            />
            <input
              type="text"
              placeholder="Password"
              value={hrPassword}
              onChange={(e) => setHrPassword(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl font-mono"
            />
            <button
              type="submit"
              disabled={addingHr}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs"
            >
              {addingHr ? 'Provisioning...' : 'Provision HR Login'}
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60 mt-4">
            {hrUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                  <span className="text-[11px] text-slate-400">{u.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {u.active ? 'Active' : 'Deactivated'}
                  </span>
                  <button
                    onClick={() => handleToggleHrStatus(u.id, u.active)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: Audit Log (M9 Specification - Admin Only) */}
      {activeSubTab === 'audit' && currentUserRole === 'admin' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Immutable Governance Audit Log (Section 8 Checklist #25)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {auditLogs.length} verified events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-750/70 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Summary</th>
                  <th className="py-2.5 px-4 text-right">JSON Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {log.actorName}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{log.entity}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {log.summary}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {(log.beforeData || log.afterData) && (
                        <button
                          onClick={() => setSelectedAuditLog(log)}
                          className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded text-[11px] font-semibold"
                        >
                          View Diff
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Diff Inspection Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-xs text-slate-800 dark:text-slate-100">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Audit Event Data Diff
            </h3>
            <p className="text-slate-400 mb-4">{selectedAuditLog.summary}</p>

            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div>
                <span className="font-bold text-rose-600 block mb-1">Before State JSON:</span>
                <pre className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto max-h-60">
                  {JSON.stringify(selectedAuditLog.beforeData || {}, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-bold text-emerald-600 block mb-1">After State JSON:</span>
                <pre className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto max-h-60">
                  {JSON.stringify(selectedAuditLog.afterData || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
