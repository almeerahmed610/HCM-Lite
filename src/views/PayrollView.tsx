/**
 * HCM Lite - Payroll Lite Engine & Payslips (M6)
 * Implements Gross 1.5x calculation, working day deductions, Section 3 Tax Slabs, Admin Lock & Payslip Modal
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileText,
  Lock,
  Unlock,
  RotateCw,
  Plus,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  Building2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../services/api';
import { PayrollRun, PayrollItem, UserRole } from '../types/hcm';
import { PayslipModal } from '../components/PayslipModal';

interface PayrollViewProps {
  currentUserRole: UserRole;
  companyName: string;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  currentUserRole,
  companyName,
}) => {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);

  // Draft generator
  const [draftMonth, setDraftMonth] = useState('2026-10');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [finalizingRun, setFinalizingRun] = useState(false);

  // Payslip modal
  const [selectedPayslipItem, setSelectedPayslipItem] = useState<PayrollItem | null>(null);

  useEffect(() => {
    loadPayrollRuns();
  }, []);

  const loadPayrollRuns = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/payroll/runs');
      setRuns(res || []);
      if (res?.length > 0) {
        setSelectedRun(res[res.length - 1]);
      }
    } catch (err) {
      console.error('Failed to load payroll runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    setGeneratingDraft(true);
    try {
      const res = await apiRequest('/api/payroll/draft', {
        method: 'POST',
        body: { month: draftMonth },
      });
      await loadPayrollRuns();
      setSelectedRun(res.run);
    } catch (err: any) {
      alert(err.message || 'Failed to prepare payroll draft');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleFinalize = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently finalize and lock this payroll run? This action cannot be undone.')) {
      return;
    }
    setFinalizingRun(true);
    try {
      const res = await apiRequest(`/api/payroll/${id}/finalize`, {
        method: 'POST',
      });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      await loadPayrollRuns();
      setSelectedRun(res.run);
    } catch (err: any) {
      alert(err.message || 'Failed to finalize payroll run.');
    } finally {
      setFinalizingRun(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            M6 Module · Payroll & Compensation
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            Monthly Payroll Runs & Payslips
          </h1>
        </div>

        {currentUserRole !== 'employee' && (
          <div className="flex items-center gap-2">
            <select
              value={draftMonth}
              onChange={(e) => setDraftMonth(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="2026-10">October 2026</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
            <button
              onClick={handleGenerateDraft}
              disabled={generatingDraft}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              {generatingDraft ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Generate Monthly Draft</span>
            </button>
          </div>
        )}
      </div>

      {/* Runs Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {runs.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRun(r)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
              selectedRun?.id === r.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            {r.status === 'finalized' ? (
              <Lock className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{r.month}</span>
            <span
              className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ${
                r.status === 'finalized'
                  ? 'bg-emerald-500/30 text-emerald-100'
                  : 'bg-amber-500/30 text-amber-100'
              }`}
            >
              {r.status}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Run Details Header */}
      {selectedRun && (
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  Payroll Run for {selectedRun.month}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    selectedRun.status === 'finalized'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                  }`}
                >
                  {selectedRun.status === 'finalized' ? 'Locked & Finalized' : 'Draft / Under Review'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total Working Days in Month: {selectedRun.totalWorkingDays} days (excluding weekends & holidays)
              </p>
            </div>

            {/* Admin Finalization Button */}
            {currentUserRole === 'admin' && selectedRun.status === 'draft' && (
              <button
                onClick={() => handleFinalize(selectedRun.id)}
                disabled={finalizingRun}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                {finalizingRun ? <RotateCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Finalize & Lock Month (Admin Only)</span>
              </button>
            )}
          </div>

          {/* Aggregate Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Gross</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                PKR {selectedRun.totalGross?.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Deductions</span>
              <span className="text-lg font-black text-rose-600">
                - PKR {selectedRun.totalDeductions?.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Income Tax</span>
              <span className="text-lg font-black text-rose-600">
                - PKR {selectedRun.totalTax?.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl">
              <span className="text-blue-900 dark:text-blue-300 block text-[10px] uppercase font-bold">
                Total Net Disbursement
              </span>
              <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                PKR {selectedRun.totalNet?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Employee Salary Table */}
      {selectedRun && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-750/70 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Basic Salary</th>
                  <th className="py-3 px-4">HRA + Med</th>
                  <th className="py-3 px-4">Gross (1.5x)</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Tax (Slab)</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {selectedRun.items?.map((item) => (
                  <tr key={item.employeeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.employeeName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.employeeCode} · {item.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      PKR {item.basicSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      PKR {(item.hra + item.medical).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      PKR {item.grossSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-rose-600 font-mono">
                      {item.totalDeductions > 0 ? `- PKR ${item.totalDeductions.toLocaleString()}` : '0'}
                    </td>
                    <td className="py-3 px-4 text-rose-600 font-mono">
                      - PKR {item.monthlyTax.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                      PKR {item.netSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayslipItem(item)}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg text-xs transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!selectedPayslipItem}
        onClose={() => setSelectedPayslipItem(null)}
        item={selectedPayslipItem}
        month={selectedRun?.month || '2026-10'}
        companyName={companyName}
      />
    </div>
  );
};
