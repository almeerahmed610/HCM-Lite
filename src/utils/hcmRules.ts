/**
 * HCM Lite - Exact Business Rules Engine
 * Implements Section 3, Section 6, and Section 7 specifications from the Hackathon Brief
 */

import { PublicHoliday } from '../types/hcm';

/**
 * Haversine formula to compute distance in meters between two GPS coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Checks if a given date string (YYYY-MM-DD) is a weekend
 * weekendDays: [0, 6] = Sunday (0) & Saturday (6)
 */
export function isWeekend(dateStr: string, weekendDays: number[] = [0, 6]): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  return weekendDays.includes(d.getDay());
}

/**
 * Checks if a given date string is a public holiday
 */
export function isHoliday(dateStr: string, holidays: PublicHoliday[]): boolean {
  return holidays.some((h) => h.date === dateStr);
}

/**
 * Calculates working days between start date and end date (inclusive)
 * automatically skipping weekends (Sat, Sun) and public holidays
 */
export function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string,
  weekendDays: number[] = [0, 6],
  holidays: PublicHoliday[] = []
): { count: number; validDates: string[] } {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  if (start > end) {
    return { count: 0, validDates: [] };
  }

  let count = 0;
  const validDates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isWknd = weekendDays.includes(current.getDay());
    const isHldy = holidays.some((h) => h.date === dateStr);

    if (!isWknd && !isHldy) {
      count++;
      validDates.push(dateStr);
    }

    current.setDate(current.getDate() + 1);
  }

  return { count, validDates };
}

/**
 * Count total working days in a calendar month (YYYY-MM)
 */
export function getWorkingDaysInMonth(
  yearMonth: string, // "2026-10"
  weekendDays: number[] = [0, 6],
  holidays: PublicHoliday[] = []
): number {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const daysInMonth = new Date(year, month, 0).getDate();

  const startDate = `${yearStr}-${monthStr.padStart(2, '0')}-01`;
  const endDate = `${yearStr}-${monthStr.padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  return calculateWorkingDays(startDate, endDate, weekendDays, holidays).count;
}

/**
 * Attendance Check-In status evaluator:
 * Office start 09:00, grace 15 min (late after 09:15)
 */
export function evaluateCheckInStatus(
  checkInISO: string,
  officeStartTime = '09:00',
  graceMinutes = 15
): 'present' | 'late' {
  const date = new Date(checkInISO);
  const [startH, startM] = officeStartTime.split(':').map((v) => parseInt(v, 10));

  const officeStartMinutes = startH * 60 + startM;
  const graceThresholdMinutes = officeStartMinutes + graceMinutes;

  const checkInMinutes = date.getHours() * 60 + date.getMinutes();

  if (checkInMinutes > graceThresholdMinutes) {
    return 'late';
  }
  return 'present';
}

/**
 * Evaluates work duration on check-out:
 * Half day if under 5 hours
 */
export function evaluateCheckOutStatus(
  checkInISO: string,
  checkOutISO: string,
  currentStatus: 'present' | 'late',
  halfDayThresholdHours = 5
): { status: 'present' | 'late' | 'half_day'; hoursWorked: number } {
  const inTime = new Date(checkInISO).getTime();
  const outTime = new Date(checkOutISO).getTime();
  const diffHours = (outTime - inTime) / (1000 * 60 * 60);
  const roundedHours = Math.round(diffHours * 100) / 100;

  if (roundedHours < halfDayThresholdHours) {
    return { status: 'half_day', hoursWorked: roundedHours };
  }

  return { status: currentStatus, hoursWorked: roundedHours };
}

/**
 * Annualized Income Tax Calculation according to Section 3:
 * Tax slab on annual gross (Gross * 12):
 * - 0 to 600,000: 0%
 * - 600,001 to 1,200,000: 5% of amount > 600k
 * - 1,200,001 to 2,400,000: 30,000 + 15% of amount > 1.2M
 * - 2,400,001 to 3,600,000: 210,000 + 25% of amount > 2.4M
 * - Above 3,600,000: 510,000 + 35% of amount > 3.6M
 */
export function calculateAnnualTax(annualGross: number): number {
  if (annualGross <= 600000) {
    return 0;
  }
  if (annualGross <= 1200000) {
    return (annualGross - 600000) * 0.05;
  }
  if (annualGross <= 2400000) {
    return 30000 + (annualGross - 1200000) * 0.15;
  }
  if (annualGross <= 3600000) {
    return 210000 + (annualGross - 2400000) * 0.25;
  }
  return 510000 + (annualGross - 3600000) * 0.35;
}

/**
 * Full Monthly Payroll Computation for an employee
 * Gross = 1.5 * basic (HRA 40%, Medical 10%)
 * Per day = Gross / working days in month
 * Deduct absent + unpaid + (0.5 * half_days) + optional late penalty (3 lates = 0.5 day)
 * Prorate joiners/leavers
 */
export function computeEmployeePayroll({
  basicSalary,
  joiningDate,
  exitDate,
  month, // "2026-10"
  workingDaysInMonth,
  daysPresent,
  daysLate,
  daysHalfDay,
  daysAbsent,
  daysUnpaidLeave,
  latePenaltyEnabled = false,
}: {
  basicSalary: number;
  joiningDate: string;
  exitDate?: string;
  month: string;
  workingDaysInMonth: number;
  daysPresent: number;
  daysLate: number;
  daysHalfDay: number;
  daysAbsent: number;
  daysUnpaidLeave: number;
  latePenaltyEnabled?: boolean;
}) {
  const hra = Math.round(basicSalary * 0.4);
  const medical = Math.round(basicSalary * 0.1);
  const grossSalary = basicSalary + hra + medical; // 1.5 * basic

  const perDayRate = workingDaysInMonth > 0 ? grossSalary / workingDaysInMonth : 0;

  // Proration for joiner in this month
  let proratedFactor = 1.0;
  const [yearStr, monthStr] = month.split('-');
  const monthStart = `${yearStr}-${monthStr}-01`;
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
  const monthEnd = `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  if (joiningDate > monthStart && joiningDate <= monthEnd) {
    const activeWorkingDays = calculateWorkingDays(joiningDate, monthEnd).count;
    proratedFactor = workingDaysInMonth > 0 ? Math.min(1, activeWorkingDays / workingDaysInMonth) : 1;
  }

  // Deductions
  const deductionsAbsent = Math.round(daysAbsent * perDayRate);
  const deductionsUnpaid = Math.round(daysUnpaidLeave * perDayRate);
  const deductionsHalfDay = Math.round(daysHalfDay * 0.5 * perDayRate);

  // Late penalty rule: 3 lates = 0.5 day deduction
  let latePenaltyDays = 0;
  if (latePenaltyEnabled && daysLate >= 3) {
    latePenaltyDays = Math.floor(daysLate / 3) * 0.5;
  }
  const deductionsLatePenalty = Math.round(latePenaltyDays * perDayRate);

  const totalDeductions =
    deductionsAbsent + deductionsUnpaid + deductionsHalfDay + deductionsLatePenalty;

  // Tax calculation on Gross * 12
  const annualizedGross = grossSalary * 12;
  const annualTax = Math.round(calculateAnnualTax(annualizedGross));
  const monthlyTax = Math.round(annualTax / 12);

  // Net Salary
  const earnedGross = Math.round(grossSalary * proratedFactor);
  const netSalary = Math.max(0, earnedGross - totalDeductions - monthlyTax);

  return {
    basicSalary,
    hra,
    medical,
    grossSalary,
    workingDaysInMonth,
    daysPresent,
    daysLate,
    daysHalfDay,
    daysAbsent,
    daysUnpaidLeave,
    latePenaltyDays,
    proratedFactor,
    deductionsAbsent,
    deductionsUnpaid,
    deductionsHalfDay,
    deductionsLatePenalty,
    totalDeductions,
    annualizedGross,
    annualTax,
    monthlyTax,
    netSalary,
  };
}

/**
 * Bonus: Attrition risk score calculation (0 - 100%)
 * Evaluates attendance rate, late frequency, leave patterns and tenure
 */
export function calculateAttritionRisk({
  tenureMonths,
  absenceRate,
  lateCount,
  salaryRatio,
}: {
  tenureMonths: number;
  absenceRate: number; // e.g. 0.15 = 15%
  lateCount: number;
  salaryRatio: number; // vs department average
}): { score: number; level: 'low' | 'medium' | 'high'; reasons: string[] } {
  let score = 20; // baseline
  const reasons: string[] = [];

  // Short tenure or 1-2 year milestone
  if (tenureMonths < 6) {
    score += 15;
    reasons.push('Probation / Onboarding transition period');
  } else if (tenureMonths >= 18 && tenureMonths <= 24) {
    score += 10;
    reasons.push('Typical 2-year career transition window');
  }

  // Absenteeism indicator
  if (absenceRate > 0.1) {
    score += 25;
    reasons.push(`High absenteeism rate (${Math.round(absenceRate * 100)}%)`);
  } else if (absenceRate > 0.05) {
    score += 10;
    reasons.push('Elevated casual leave frequency');
  }

  // Punctuality issues
  if (lateCount >= 4) {
    score += 20;
    reasons.push(`Frequent late check-ins (${lateCount} this month)`);
  }

  // Below average market/dept comp
  if (salaryRatio < 0.85) {
    score += 15;
    reasons.push('Compensation is below department average');
  }

  const finalScore = Math.min(95, Math.max(5, score));
  const level: 'low' | 'medium' | 'high' =
    finalScore >= 60 ? 'high' : finalScore >= 35 ? 'medium' : 'low';

  return { score: finalScore, level, reasons };
}
