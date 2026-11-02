/**
 * HCM Lite - Official Salary Payslip Modal (M6)
 * Conforming to Section 3 & 6: Basic, HRA 40%, Medical 10%, Tax Slabs, Deductions & Net Pay
 */

import React from 'react';
import { Printer, Download, Building2, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { PayrollItem } from '../types/hcm';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PayrollItem | null;
  month: string;
  companyName: string;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  item,
  month,
  companyName,
}) => {
  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 dark:text-slate-100 my-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Finalized & Verified
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Container */}
        <div id="printable-payslip" className="mt-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          {/* Company Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 dark:border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  EIIR
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    {companyName || 'Saylani IT Training (PVT) Ltd.'}
                  </h2>
                  <p className="text-xs text-slate-500">Zaitoon Ashraf IT Park, Karachi, Pakistan</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 block">
                Salary Payslip
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Month: {month}
              </p>
              <p className="text-[11px] text-slate-400">Generated: 2026-10-24</p>
            </div>
          </div>

          {/* Employee Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{item.employeeName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee Code</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{item.employeeCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{item.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Designation</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{item.designation}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Working Days</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{item.workingDaysInMonth} days</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Present / Late / Half</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {item.daysPresent} / {item.daysLate} / {item.daysHalfDay}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Absent / Unpaid</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {item.daysAbsent} / {item.daysUnpaidLeave}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Mode</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">Bank Direct Deposit</span>
            </div>
          </div>

          {/* Earnings vs Deductions Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Earnings */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 flex justify-between">
                <span>Earnings (Gross = 1.5 × Basic)</span>
                <span>Amount (PKR)</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1.5">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                  <span className="font-medium">{item.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">House Rent Allowance (HRA 40%)</span>
                  <span className="font-medium">{item.hra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Medical Allowance (10%)</span>
                  <span className="font-medium">{item.medical.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold border-t border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                  <span>Gross Total Salary</span>
                  <span>PKR {item.grossSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 flex justify-between">
                <span>Deductions & Income Tax</span>
                <span>Amount (PKR)</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1.5">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Absent Days ({item.daysAbsent} d)</span>
                  <span className="font-medium">{item.deductionsAbsent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Unpaid Leave ({item.daysUnpaidLeave} d)</span>
                  <span className="font-medium">{item.deductionsUnpaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Half Day Deductions ({item.daysHalfDay} d)</span>
                  <span className="font-medium">{item.deductionsHalfDay.toLocaleString()}</span>
                </div>
                {item.deductionsLatePenalty > 0 && (
                  <div className="flex justify-between py-1 text-amber-600">
                    <span>Late Penalty (3 lates rule)</span>
                    <span className="font-medium">{item.deductionsLatePenalty.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Income Tax (Slab Rate)</span>
                  <span className="font-medium">{item.monthlyTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400">
                  <span>Total Deductions & Tax</span>
                  <span>PKR {(item.totalDeductions + item.monthlyTax).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Box */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-900 dark:text-blue-300 block">
                Net Disbursed Take-Home Pay
              </span>
              <span className="text-xs text-slate-500">Credited to registered account</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
                PKR {item.netSalary.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 text-center text-xs text-slate-400">
            <div>
              <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
              <span>HR & People Operations</span>
            </div>
            <div>
              <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
              <span>Authorized Finance Administrator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
