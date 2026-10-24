/**
 * HCM Lite - Employee CSV Import with Dry-Run Error Report (M3)
 * Implements row + field + reason validation inspection before committing
 */

import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertOctagon, FileSpreadsheet, RotateCw, X } from 'lucide-react';
import { apiRequest } from '../services/api';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const sampleCSV = `firstName,lastName,email,phone,departmentCode,joiningDate,basicSalary,gender
Taha,Siddiqui,taha.s@saylaniit.com,+92 300 1122334,ENG,2026-09-01,95000,male
Sana,Mirza,sana.m@saylaniit.com,+92 321 4455667,HR,2026-08-15,75000,female
Bilal,Ahmed,bilal.a@saylaniit.com,+92 333 7788990,OPS,2026-10-01,85000,male`;

  const [csvText, setCsvText] = useState(sampleCSV);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{
    valid: boolean;
    totalRows: number;
    errorsCount: number;
    errors: { row: number; field: string; reason: string }[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseCsvRows = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = parts[idx] || '';
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleDryRun = async () => {
    setIsDryRunning(true);
    setErrorMsg(null);
    setDryRunResult(null);

    try {
      const rows = parseCsvRows(csvText);
      if (rows.length === 0) {
        setErrorMsg('Please provide a valid CSV with headers and at least 1 data row.');
        return;
      }

      const res = await apiRequest('/api/employees/csv-dryrun', {
        method: 'POST',
        body: { rows },
      });

      setDryRunResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Dry run validation failed.');
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleCommitImport = async () => {
    setIsImporting(true);
    setErrorMsg(null);

    try {
      const rows = parseCsvRows(csvText);
      await apiRequest('/api/employees/csv-import', {
        method: 'POST',
        body: { rows },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import employee CSV.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-800 dark:text-slate-100 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Employee CSV Batch Import
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                M3 Specification · Mandatory dry run validation report before committing
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CSV Editor Area */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              CSV Data (Columns: firstName, lastName, email, phone, departmentCode, joiningDate, basicSalary, gender)
            </label>
            <button
              onClick={() => setCsvText(sampleCSV)}
              className="text-xs text-teal-600 hover:underline font-medium"
            >
              Reset to Sample Template
            </button>
          </div>
          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setDryRunResult(null);
            }}
            className="w-full font-mono text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden"
          />
        </div>

        {/* Dry-run action */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleDryRun}
            disabled={isDryRunning || !csvText.trim()}
            className="py-2 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            {isDryRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            Execute Dry Run Validation
          </button>
        </div>

        {/* Dry Run Results Report */}
        {dryRunResult && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {dryRunResult.valid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Dry Run Passed: {dryRunResult.totalRows} Rows Ready to Import
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4 text-rose-500" />
                    Dry Run Failed: {dryRunResult.errorsCount} Validation Errors Found
                  </>
                )}
              </span>
            </div>

            {/* Error Table if invalid */}
            {!dryRunResult.valid && (
              <div className="max-h-48 overflow-y-auto border border-rose-200 dark:border-rose-900/60 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 font-semibold">
                    <tr>
                      <th className="py-1.5 px-3">Row #</th>
                      <th className="py-1.5 px-3">Field</th>
                      <th className="py-1.5 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 dark:divide-rose-900/30">
                    {dryRunResult.errors.map((err, i) => (
                      <tr key={i} className="text-rose-700 dark:text-rose-300">
                        <td className="py-1.5 px-3 font-mono font-bold">Row {err.row}</td>
                        <td className="py-1.5 px-3 font-semibold">{err.field}</td>
                        <td className="py-1.5 px-3">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Modal footer */}
        <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCommitImport}
            disabled={!dryRunResult?.valid || isImporting}
            className="py-2 px-5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-1.5"
          >
            {isImporting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              'Commit & Create Accounts'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
