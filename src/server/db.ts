/**
 * HCM Lite - Persistent Database Layer
 * Stores all organization state, users, attendance, leaves, payroll, audit logs
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  UserAccount,
  CompanySettings,
  Department,
  Designation,
  LeaveTypeConfig,
  PublicHoliday,
  Employee,
  AttendanceRecord,
  AttendanceCorrection,
  LeaveRequest,
  PayrollRun,
  Announcement,
  InAppNotification,
  AuditLogEntry,
  AILogEntry,
} from '../types/hcm';

export interface HCMDatabase {
  initialized: boolean;
  settings: CompanySettings;
  users: UserAccount[];
  departments: Department[];
  designations: Designation[];
  leaveTypes: LeaveTypeConfig[];
  holidays: PublicHoliday[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  attendanceCorrections: AttendanceCorrection[];
  leaves: LeaveRequest[];
  payrollRuns: PayrollRun[];
  announcements: Announcement[];
  notifications: InAppNotification[];
  auditLogs: AuditLogEntry[];
  aiLogs: AILogEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hcm_data.json');

// Default initial state (Uninitialized - starts clean for First-Run setup)
export function getInitialEmptyDb(): HCMDatabase {
  return {
    initialized: false,
    settings: {
      companyName: '',
      officeStartTime: '09:00',
      graceMinutes: 15,
      halfDayThresholdHours: 5,
      weekendDays: [0, 6], // Sunday & Saturday
      officeLocation: {
        lat: 24.8607, // Zaitoon Ashraf IT Park Karachi
        lng: 67.0011,
        radiusMeters: 150,
        address: 'Zaitoon Ashraf IT Park, Karachi, Pakistan',
      },
      latePenaltyEnabled: true,
      currency: 'PKR',
    },
    users: [],
    departments: [],
    designations: [],
    leaveTypes: [
      {
        id: 'lt-annual',
        name: 'annual',
        code: 'ANN',
        yearlyQuota: 14,
        paid: true,
        description: 'Annual Paid Vacation Leave (14 days)',
      },
      {
        id: 'lt-sick',
        name: 'sick',
        code: 'SCK',
        yearlyQuota: 8,
        paid: true,
        description: 'Medical & Sick Leave (8 days)',
      },
      {
        id: 'lt-casual',
        name: 'casual',
        code: 'CSL',
        yearlyQuota: 10,
        paid: true,
        description: 'Short Casual & Personal Leave (10 days)',
      },
      {
        id: 'lt-unpaid',
        name: 'unpaid',
        code: 'UNP',
        yearlyQuota: 999,
        paid: false,
        description: 'Unpaid Leave (deducted from salary)',
      },
    ],
    holidays: [
      { id: 'h-1', name: 'Pakistan Day', date: '2026-03-23', description: 'National Holiday' },
      { id: 'h-2', name: 'Eid-ul-Fitr Day 1', date: '2026-03-20', description: 'Public Holiday' },
      { id: 'h-3', name: 'Eid-ul-Fitr Day 2', date: '2026-03-21', description: 'Public Holiday' },
      { id: 'h-4', name: 'Labor Day', date: '2026-05-01', description: 'International Workers Day' },
      { id: 'h-5', name: 'Independence Day', date: '2026-08-14', description: 'National Independence Day' },
      { id: 'h-6', name: 'Quaid-e-Azam Day', date: '2026-12-25', description: 'Birth Anniversary of Quaid' },
    ],
    employees: [],
    attendance: [],
    attendanceCorrections: [],
    leaves: [],
    payrollRuns: [],
    announcements: [],
    notifications: [],
    auditLogs: [],
    aiLogs: [],
  };
}

// In-memory cache
let inMemoryDb: HCMDatabase | null = null;

export function loadDatabase(): HCMDatabase {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(content);
      return inMemoryDb!;
    }
  } catch (err) {
    console.error('Error reading database file, starting clean:', err);
  }

  inMemoryDb = getInitialEmptyDb();
  saveDatabase(inMemoryDb);
  return inMemoryDb;
}

export function saveDatabase(db: HCMDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    inMemoryDb = db;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

export function resetDatabase(): HCMDatabase {
  inMemoryDb = getInitialEmptyDb();
  saveDatabase(inMemoryDb);
  return inMemoryDb;
}

/**
 * Hash password with salt
 */
export function hashPassword(plainText: string): string {
  const salt = 'saylani-hcm-salt-2026';
  return crypto.createHmac('sha256', salt).update(plainText).digest('hex');
}

/**
 * Audit log helper
 */
export function addAuditLog(
  db: HCMDatabase,
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): AuditLogEntry {
  const log: AuditLogEntry = {
    id: 'aud-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  db.auditLogs.unshift(log);
  // Keep last 500 logs
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  return log;
}

/**
 * In-app Notification helper
 */
export function addNotification(
  db: HCMDatabase,
  entry: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>
): InAppNotification {
  const notif: InAppNotification = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    read: false,
    ...entry,
  };
  db.notifications.unshift(notif);
  return notif;
}
