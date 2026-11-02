/**
 * HCM Lite - Core Data Types & Models
 * Conforming to Saylani Hackathon HCM Lite Challenge Brief
 */

export type UserRole = 'admin' | 'hr' | 'employee';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: string; // linked employee if role === 'employee'
  name: string;
  active: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CompanySettings {
  companyName: string;
  officeStartTime: string; // "09:00"
  graceMinutes: number; // 15
  halfDayThresholdHours: number; // 5
  weekendDays: number[]; // [0, 6] (Sunday=0, Saturday=6)
  officeLocation: {
    lat: number; // e.g. 24.8607 (Zaitoon Ashraf IT Park)
    lng: number; // e.g. 67.0011
    radiusMeters: number; // e.g. 150
    address: string;
  };
  latePenaltyEnabled: boolean; // bonus: 3 lates = 0.5 day deduction
  currency: string; // "PKR"
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName?: string;
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
}

export interface LeaveTypeConfig {
  id: string;
  name: string; // 'annual' | 'sick' | 'casual' | 'unpaid'
  code: string;
  yearlyQuota: number; // annual: 14, sick: 8, casual: 10, unpaid: 999
  paid: boolean;
  description: string;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  description?: string;
}

export interface Employee {
  id: string;
  code: string; // e.g. EMP-001
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  departmentId: string;
  designationId: string;
  joiningDate: string; // YYYY-MM-DD
  exitDate?: string;
  status: 'active' | 'probation' | 'exited';
  gender: 'male' | 'female' | 'other';
  emergencyContact?: string;
  basicSalary: number; // Basic
  hraAllowance?: number; // 40% of Basic
  medicalAllowance?: number; // 10% of Basic
  grossSalary: number; // 1.5 * Basic
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'on_leave' | 'missing_checkout';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  totalHoursWorked?: number;
  status: AttendanceStatus;
  source: 'web' | 'camera';
  location?: {
    lat: number;
    lng: number;
    distanceMeters: number;
    accuracy: number;
  };
  faceVerified?: boolean;
  notes?: string;
}

export interface AttendanceCorrection {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  requestedCheckIn: string; // HH:mm
  requestedCheckOut: string; // HH:mm
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  hrComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  hrComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  quota: number;
  used: number;
  remaining: number;
}

export interface PayrollItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  joiningDate: string;
  basicSalary: number;
  hra: number; // 40%
  medical: number; // 10%
  grossSalary: number; // 1.5 * basic
  workingDaysInMonth: number;
  daysPresent: number;
  daysLate: number;
  daysHalfDay: number;
  daysAbsent: number;
  daysUnpaidLeave: number;
  latePenaltyDays: number;
  proratedFactor: number;
  deductionsAbsent: number;
  deductionsUnpaid: number;
  deductionsHalfDay: number;
  deductionsLatePenalty: number;
  totalDeductions: number;
  annualizedGross: number;
  annualTax: number;
  monthlyTax: number;
  netSalary: number;
}

export interface PayrollRun {
  id: string;
  month: string; // YYYY-MM (e.g. "2026-10")
  year: number;
  totalWorkingDays: number;
  totalGross: number;
  totalDeductions: number;
  totalTax: number;
  totalNet: number;
  employeeCount: number;
  status: 'draft' | 'finalized';
  preparedBy: string; // HR user id
  preparedAt: string;
  finalizedBy?: string; // Admin user id
  finalizedAt?: string;
  items: PayrollItem[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  targetDepartmentId?: string; // all or specific
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'leave' | 'payroll' | 'attendance' | 'announcement' | 'system';
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'finalize' | 'login' | 'import';
  entity: 'company' | 'employee' | 'attendance' | 'leave' | 'payroll' | 'user' | 'announcement';
  entityId?: string;
  summary: string;
  beforeData?: any;
  afterData?: any;
}

export interface AILogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userRole: UserRole;
  prompt: string;
  toolUsed?: string;
  response: string;
  executionTimeMs: number;
}
