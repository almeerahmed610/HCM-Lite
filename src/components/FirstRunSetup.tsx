/**
 * HCM Lite - First-Run Company Setup Wizard (M1 & M2)
 * Renders on a fresh install to configure the organization profile and primary Admin account
 */

import React, { useState } from 'react';
import { Building2, Shield, User, Mail, Lock, MapPin, Sparkles, RotateCw, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';

interface FirstRunSetupProps {
  onSetupComplete: (user: any, token: string) => void;
  onLoadSeedData: () => void;
}

export const FirstRunSetup: React.FC<FirstRunSetupProps> = ({
  onSetupComplete,
  onLoadSeedData,
}) => {
  const [companyName, setCompanyName] = useState('Saylani IT Training (PVT) Ltd.');
  const [adminName, setAdminName] = useState('Muhammad Bilal');
  const [adminEmail, setAdminEmail] = useState('admin@saylaniit.com');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  // Office Location
  const [officeLat, setOfficeLat] = useState('24.8607');
  const [officeLng, setOfficeLng] = useState('67.0011');
  const [radiusMeters, setRadiusMeters] = useState('150');
  const [address, setAddress] = useState('Zaitoon Ashraf IT Park, Karachi, Pakistan');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminName || !adminEmail || !adminPassword) {
      setError('Please fill in all company and administrator fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/api/auth/setup', {
        method: 'POST',
        body: {
          companyName,
          adminName,
          adminEmail,
          adminPassword,
          officeLocation: {
            lat: parseFloat(officeLat) || 24.8607,
            lng: parseFloat(officeLng) || 67.0011,
            radiusMeters: parseInt(radiusMeters, 10) || 150,
            address,
          },
        },
      });

      onSetupComplete(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Setup initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-800/90 border border-slate-700 rounded-3xl shadow-2xl p-8 backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-lg">
            EIIR
          </div>
          <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
            Saylani Hackathon 2026 · Fresh Install
          </span>
          <h1 className="text-2xl font-black mt-2 text-white">
            HCM Lite System Initialization
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Configure your enterprise profile, office GPS location & primary Administrator account to start.
          </p>
        </div>

        {/* 1-Click Demo Shortcut */}
        <div className="mb-6 p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">Evaluating Hackathon? Load pre-configured dataset:</span>
          </div>
          <button
            type="button"
            onClick={onLoadSeedData}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-sm transition"
          >
            1-Click Demo Seed
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Company / Organization Name</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                placeholder="Saylani IT Training"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Primary Admin Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="Muhammad Bilal"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="admin@saylaniit.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Admin Secure Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Office Geofence */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-700/80 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Camera Attendance Geofence Location</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block">Latitude</label>
                <input
                  type="text"
                  value={officeLat}
                  onChange={(e) => setOfficeLat(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Longitude</label>
                <input
                  type="text"
                  value={officeLng}
                  onChange={(e) => setOfficeLng(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Radius (m)</label>
                <input
                  type="text"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">Premises Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Bootstrapping HCM Lite...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete First-Run Setup & Login
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
