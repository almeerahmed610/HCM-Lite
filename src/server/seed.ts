/**
 * HCM Lite - Demo Seed Data Generator
 * Provides realistic dataset conforming to Saylani Hackathon HCM Lite brief
 */

import { HCMDatabase, hashPassword, addAuditLog } from './db';
import { computeEmployeePayroll, getWorkingDaysInMonth } from '../utils/hcmRules';

export function populateDemoSeedData(db: HCMDatabase): HCMDatabase {
  db.initialized = true;
  db.settings = {
    companyName: 'Saylani IT Training (PVT) Ltd.',
    officeStartTime: '09:00',
    graceMinutes: 15,
    halfDayThresholdHours: 5,
    weekendDays: [0, 6], // Sunday=0, Saturday=6
    officeLocation: {
      lat: 24.8607,
      lng: 67.0011,
      radiusMeters: 150,
      address: 'Zaitoon Ashraf IT Park, Karachi, Pakistan',
    },
    latePenaltyEnabled: true,
    currency: 'PKR',
  };

  // Departments
  db.departments = [
    { id: 'dept-eng', name: 'Software Engineering', code: 'ENG', headName: 'Rashid Ali' },
    { id: 'dept-hr', name: 'Human Capital & Talent', code: 'HR', headName: 'Ayesha Khan' },
    { id: 'dept-ops', name: 'Cloud & Infrastructure', code: 'OPS', headName: 'Usman Ghani' },
    { id: 'dept-mkt', name: 'Growth & Outreach', code: 'MKT', headName: 'Zainab Bibi' },
  ];

  // Designations
  db.designations = [
    { id: 'des-fsd', title: 'Senior Full Stack Engineer', departmentId: 'dept-eng' },
    { id: 'des-ui', title: 'Lead UI/UX Product Designer', departmentId: 'dept-eng' },
    { id: 'des-hr', title: 'HR & People Operations Lead', departmentId: 'dept-hr' },
    { id: 'des-devops', title: 'Cloud Infrastructure Architect', departmentId: 'dept-ops' },
    { id: 'des-growth', title: 'Growth & Communications Lead', departmentId: 'dept-mkt' },
  ];

  // Users & Employees
  const adminId = 'usr-admin-1';
  const hrId = 'usr-hr-1';
  const emp1Id = 'emp-001';
  const emp2Id = 'emp-002';
  const emp3Id = 'emp-003';
  const emp4Id = 'emp-004';
  const emp5Id = 'emp-005';

  db.employees = [
    {
      id: emp1Id,
      code: 'EMP-001',
      firstName: 'Rashid',
      lastName: 'Ali',
      email: 'rashid@saylaniit.com',
      phone: '+92 300 1234567',
      address: 'Gulshan-e-Iqbal, Block 13-D, Karachi',
      departmentId: 'dept-eng',
      designationId: 'des-fsd',
      joiningDate: '2025-01-15',
      status: 'active',
      gender: 'male',
      emergencyContact: '+92 321 9876543 (Father)',
      basicSalary: 120000,
      hraAllowance: 48000,
      medicalAllowance: 12000,
      grossSalary: 180000, // 1.5 * basic
      createdAt: '2025-01-15T09:00:00Z',
      updatedAt: '2026-10-24T09:00:00Z',
    },
    {
      id: emp2Id,
      code: 'EMP-002',
      firstName: 'Fatima',
      lastName: 'Zahra',
      email: 'fatima@saylaniit.com',
      phone: '+92 333 4567890',
      address: 'Clifton Block 2, Karachi',
      departmentId: 'dept-eng',
      designationId: 'des-ui',
      joiningDate: '2025-06-01',
      status: 'active',
      gender: 'female',
      emergencyContact: '+92 300 5551234 (Brother)',
      basicSalary: 80000,
      hraAllowance: 32000,
      medicalAllowance: 8000,
      grossSalary: 120000,
      createdAt: '2025-06-01T09:00:00Z',
      updatedAt: '2026-10-24T09:00:00Z',
    },
    {
      id: emp3Id,
      code: 'EMP-003',
      firstName: 'Hamza',
      lastName: 'Tariq',
      email: 'hamza@saylaniit.com',
      phone: '+92 312 3456789',
      address: 'Johar Town, Karachi',
      departmentId: 'dept-hr',
      designationId: 'des-hr',
      joiningDate: '2025-03-10',
      status: 'active',
      gender: 'male',
      emergencyContact: '+92 333 1112233',
      basicSalary: 70000,
      hraAllowance: 28000,
      medicalAllowance: 7000,
      grossSalary: 105000,
      createdAt: '2025-03-10T09:00:00Z',
      updatedAt: '2026-10-24T09:00:00Z',
    },
    {
      id: emp4Id,
      code: 'EMP-004',
      firstName: 'Usman',
      lastName: 'Ghani',
      email: 'usman@saylaniit.com',
      phone: '+92 345 8765432',
      address: 'Federal B Area, Block 6, Karachi',
      departmentId: 'dept-ops',
      designationId: 'des-devops',
      joiningDate: '2024-11-01',
      status: 'active',
      gender: 'male',
      emergencyContact: '+92 300 8889900',
      basicSalary: 110000,
      hraAllowance: 44000,
      medicalAllowance: 11000,
      grossSalary: 165000,
      createdAt: '2024-11-01T09:00:00Z',
      updatedAt: '2026-10-24T09:00:00Z',
    },
    {
      id: emp5Id,
      code: 'EMP-005',
      firstName: 'Zainab',
      lastName: 'Bibi',
      email: 'zainab@saylaniit.com',
      phone: '+92 301 9988776',
      address: 'DHA Phase 5, Karachi',
      departmentId: 'dept-mkt',
      designationId: 'des-growth',
      joiningDate: '2025-08-15',
      status: 'probation',
      gender: 'female',
      emergencyContact: '+92 321 4443322',
      basicSalary: 90000,
      hraAllowance: 36000,
      medicalAllowance: 9000,
      grossSalary: 135000,
      createdAt: '2025-08-15T09:00:00Z',
      updatedAt: '2026-10-24T09:00:00Z',
    },
  ];

  // User Accounts
  db.users = [
    {
      id: adminId,
      email: 'admin@saylaniit.com',
      passwordHash: hashPassword('Admin@123'),
      role: 'admin',
      name: 'Muhammad Bilal (Admin)',
      active: true,
      mustChangePassword: false,
      createdAt: '2025-01-01T09:00:00Z',
    },
    {
      id: hrId,
      email: 'hr@saylaniit.com',
      passwordHash: hashPassword('Hr@123'),
      role: 'hr',
      name: 'Ayesha Khan (HR Lead)',
      active: true,
      mustChangePassword: false,
      createdAt: '2025-01-05T09:00:00Z',
    },
    {
      id: 'usr-emp-1',
      email: 'rashid@saylaniit.com',
      passwordHash: hashPassword('Saylani@2026'),
      role: 'employee',
      employeeId: emp1Id,
      name: 'Rashid Ali',
      active: true,
      mustChangePassword: false,
      createdAt: '2025-01-15T09:00:00Z',
    },
    {
      id: 'usr-emp-2',
      email: 'fatima@saylaniit.com',
      passwordHash: hashPassword('Welcome@2026'),
      role: 'employee',
      employeeId: emp2Id,
      name: 'Fatima Zahra',
      active: true,
      mustChangePassword: true, // test temporary password workflow!
      createdAt: '2025-06-01T09:00:00Z',
    },
    {
      id: 'usr-emp-3',
      email: 'hamza@saylaniit.com',
      passwordHash: hashPassword('Saylani@2026'),
      role: 'employee',
      employeeId: emp3Id,
      name: 'Hamza Tariq',
      active: true,
      mustChangePassword: false,
      createdAt: '2025-03-10T09:00:00Z',
    },
    {
      id: 'usr-emp-4',
      email: 'usman@saylaniit.com',
      passwordHash: hashPassword('Saylani@2026'),
      role: 'employee',
      employeeId: emp4Id,
      name: 'Usman Ghani',
      active: true,
      mustChangePassword: false,
      createdAt: '2024-11-01T09:00:00Z',
    },
    {
      id: 'usr-emp-5',
      email: 'zainab@saylaniit.com',
      passwordHash: hashPassword('Saylani@2026'),
      role: 'employee',
      employeeId: emp5Id,
      name: 'Zainab Bibi',
      active: true,
      mustChangePassword: false,
      createdAt: '2025-08-15T09:00:00Z',
    },
  ];

  // Leaves
  db.leaves = [
    {
      id: 'lv-001',
      employeeId: emp2Id, // Fatima Zahra
      leaveTypeId: 'lt-casual',
      startDate: '2026-10-24',
      endDate: '2026-10-26',
      workingDays: 1, // Saturday 24th, Sunday 25th weekend, Monday 26th is 1 working day
      reason: 'Attending younger sister wedding ceremony in Lahore',
      status: 'approved',
      hrComment: 'Approved. Enjoy the family celebration!',
      reviewedBy: hrId,
      reviewedAt: '2026-10-23T16:00:00Z',
      createdAt: '2026-10-23T11:20:00Z',
    },
    {
      id: 'lv-002',
      employeeId: emp4Id, // Usman Ghani
      leaveTypeId: 'lt-sick',
      startDate: '2026-10-20',
      endDate: '2026-10-21',
      workingDays: 2,
      reason: 'Seasonal viral flu and doctor recommended bed rest',
      status: 'approved',
      hrComment: 'Approved. Get well soon!',
      reviewedBy: hrId,
      reviewedAt: '2026-10-20T10:00:00Z',
      createdAt: '2026-10-20T08:30:00Z',
    },
    {
      id: 'lv-003',
      employeeId: emp1Id, // Rashid Ali
      leaveTypeId: 'lt-annual',
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      workingDays: 5,
      reason: 'Annual vacation trip to northern areas with family',
      status: 'pending',
      createdAt: '2026-10-24T08:00:00Z',
    },
  ];

  // Today's Date is 2026-10-24
  const todayStr = '2026-10-24';

  // Seed Attendance Records for October 2026
  db.attendance = [
    // Today's attendance
    {
      id: 'att-today-1',
      employeeId: emp1Id, // Rashid Ali
      date: todayStr,
      checkInTime: `${todayStr}T08:55:00Z`,
      status: 'present',
      source: 'camera',
      faceVerified: true,
      location: {
        lat: 24.86071,
        lng: 67.00112,
        distanceMeters: 12,
        accuracy: 15,
      },
    },
    {
      id: 'att-today-3',
      employeeId: emp3Id, // Hamza Tariq (Late)
      date: todayStr,
      checkInTime: `${todayStr}T09:32:00Z`,
      status: 'late',
      source: 'web',
    },
    {
      id: 'att-today-4',
      employeeId: emp4Id, // Usman Ghani
      date: todayStr,
      checkInTime: `${todayStr}T09:05:00Z`,
      status: 'present',
      source: 'web',
    },
    {
      id: 'att-today-5',
      employeeId: emp5Id, // Zainab Bibi (Late)
      date: todayStr,
      checkInTime: `${todayStr}T09:22:00Z`,
      status: 'late',
      source: 'camera',
      faceVerified: true,
      location: {
        lat: 24.86068,
        lng: 67.00115,
        distanceMeters: 18,
        accuracy: 20,
      },
    },
    // Past attendance in October to show realistic trends and late comers
    {
      id: 'att-past-1',
      employeeId: emp3Id,
      date: '2026-10-23',
      checkInTime: '2026-10-23T09:40:00Z',
      checkOutTime: '2026-10-23T18:00:00Z',
      totalHoursWorked: 8.3,
      status: 'late',
      source: 'web',
    },
    {
      id: 'att-past-2',
      employeeId: emp3Id,
      date: '2026-10-22',
      checkInTime: '2026-10-22T09:28:00Z',
      checkOutTime: '2026-10-22T18:15:00Z',
      totalHoursWorked: 8.7,
      status: 'late',
      source: 'web',
    },
    {
      id: 'att-past-3',
      employeeId: emp1Id,
      date: '2026-10-23',
      checkInTime: '2026-10-23T08:50:00Z',
      checkOutTime: '2026-10-23T17:30:00Z',
      totalHoursWorked: 8.6,
      status: 'present',
      source: 'web',
    },
    {
      id: 'att-past-4',
      employeeId: emp5Id,
      date: '2026-10-22',
      checkInTime: '2026-10-22T09:10:00Z',
      checkOutTime: '2026-10-22T13:30:00Z',
      totalHoursWorked: 4.3, // under 5 hours => half day
      status: 'half_day',
      source: 'web',
    },
  ];

  // Attendance correction request
  db.attendanceCorrections = [
    {
      id: 'cor-001',
      employeeId: emp5Id,
      date: '2026-10-21',
      requestedCheckIn: '09:00',
      requestedCheckOut: '18:00',
      reason: 'Internet routing failure at home during remote shift punch',
      status: 'pending',
      createdAt: '2026-10-22T10:00:00Z',
    },
  ];

  // Past month finalized payroll (September 2026)
  const sepWorkingDays = getWorkingDaysInMonth('2026-09', db.settings.weekendDays, db.holidays);
  const sepItems = db.employees.map((emp) => {
    const calc = computeEmployeePayroll({
      basicSalary: emp.basicSalary,
      joiningDate: emp.joiningDate,
      month: '2026-09',
      workingDaysInMonth: sepWorkingDays,
      daysPresent: sepWorkingDays,
      daysLate: 1,
      daysHalfDay: 0,
      daysAbsent: 0,
      daysUnpaidLeave: 0,
      latePenaltyEnabled: db.settings.latePenaltyEnabled,
    });
    return {
      employeeId: emp.id,
      employeeCode: emp.code,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: db.departments.find((d) => d.id === emp.departmentId)?.name || 'General',
      designation: db.designations.find((d) => d.id === emp.designationId)?.title || 'Staff',
      joiningDate: emp.joiningDate,
      ...calc,
    };
  });

  const sepTotalGross = sepItems.reduce((acc, i) => acc + i.grossSalary, 0);
  const sepTotalDeductions = sepItems.reduce((acc, i) => acc + i.totalDeductions, 0);
  const sepTotalTax = sepItems.reduce((acc, i) => acc + i.monthlyTax, 0);
  const sepTotalNet = sepItems.reduce((acc, i) => acc + i.netSalary, 0);

  db.payrollRuns = [
    {
      id: 'pay-2026-09',
      month: '2026-09',
      year: 2026,
      totalWorkingDays: sepWorkingDays,
      totalGross: sepTotalGross,
      totalDeductions: sepTotalDeductions,
      totalTax: sepTotalTax,
      totalNet: sepTotalNet,
      employeeCount: sepItems.length,
      status: 'finalized',
      preparedBy: hrId,
      preparedAt: '2026-09-30T17:00:00Z',
      finalizedBy: adminId,
      finalizedAt: '2026-10-01T10:00:00Z',
      items: sepItems,
    },
  ];

  // Announcements
  db.announcements = [
    {
      id: 'ann-001',
      title: 'Saylani Hackathon 2026 - Zaitoon Ashraf IT Park',
      content:
        'Welcome all engineering teams and mentors to the 2026 HCM Lite Challenge! Today we evaluate full end-to-end HR operations, AI tools, and camera geofence attendance.',
      authorId: adminId,
      authorName: 'Muhammad Bilal (Admin)',
      authorRole: 'admin',
      priority: 'urgent',
      createdAt: '2026-10-24T08:00:00Z',
    },
    {
      id: 'ann-002',
      title: 'October 2026 Payroll Draft Preparation',
      content:
        'HR operations have generated the monthly payroll draft for October. Department heads are requested to confirm all pending leave and attendance correction requests by end of day.',
      authorId: hrId,
      authorName: 'Ayesha Khan (HR Lead)',
      authorRole: 'hr',
      priority: 'important',
      createdAt: '2026-10-23T14:30:00Z',
    },
  ];

  // Notifications
  db.notifications = [
    {
      id: 'notif-1',
      userId: 'usr-emp-2', // Fatima
      title: 'Leave Approved',
      message: 'Your casual leave request for sister wedding (2026-10-24 to 2026-10-26) was approved by HR.',
      type: 'leave',
      read: false,
      createdAt: '2026-10-23T16:01:00Z',
    },
    {
      id: 'notif-2',
      userId: 'usr-emp-1', // Rashid
      title: 'September Payslip Available',
      message: 'Your payslip for September 2026 has been generated and finalized. Net pay: PKR 172,000.',
      type: 'payroll',
      read: true,
      createdAt: '2026-10-01T10:05:00Z',
    },
  ];

  // Audit Logs
  addAuditLog(db, {
    actorId: adminId,
    actorName: 'Muhammad Bilal',
    actorRole: 'admin',
    action: 'create',
    entity: 'company',
    entityId: 'company-saylani',
    summary: 'Configured company profile, office start time 09:00, 15m grace, and geofence location at Zaitoon Ashraf IT Park.',
  });

  addAuditLog(db, {
    actorId: hrId,
    actorName: 'Ayesha Khan',
    actorRole: 'hr',
    action: 'approve',
    entity: 'leave',
    entityId: 'lv-001',
    summary: 'Approved casual leave request for Fatima Zahra (2026-10-24 to 2026-10-26).',
  });

  addAuditLog(db, {
    actorId: adminId,
    actorName: 'Muhammad Bilal',
    actorRole: 'admin',
    action: 'finalize',
    entity: 'payroll',
    entityId: 'pay-2026-09',
    summary: 'Locked and finalized September 2026 monthly payroll run.',
  });

  return db;
}
