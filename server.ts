/**
 * HCM Lite - Complete Express Backend & Vite Middleware Entry Point
 * Implements M1 to M9 modules per Saylani Hackathon HCM Lite Challenge Brief
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import {
  loadDatabase,
  saveDatabase,
  resetDatabase,
  hashPassword,
  addAuditLog,
  addNotification,
  HCMDatabase,
} from './src/server/db';
import { populateDemoSeedData } from './src/server/seed';
import {
  calculateHaversineDistance,
  calculateWorkingDays,
  getWorkingDaysInMonth,
  evaluateCheckInStatus,
  evaluateCheckOutStatus,
  computeEmployeePayroll,
  calculateAttritionRisk,
} from './src/utils/hcmRules';
import { handleAIChat, summarizeDashboardKPIs, parseSmartLeave } from './src/server/aiService';
import { UserRole, Employee, AttendanceRecord, LeaveRequest } from './src/types/hcm';

const JWT_SECRET = process.env.JWT_SECRET || 'saylani-hcm-jwt-secret-key-2026';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  name: string;
}

// Extend Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Load Database
  let db: HCMDatabase = loadDatabase();

  // Authentication Middleware
  function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }

  function requireRole(allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: `Forbidden: This action requires one of [${allowedRoles.join(', ')}] roles.`,
        });
      }
      next();
    };
  }

  // ==========================================
  // MODULE 1: AUTH & ACCESS
  // ==========================================

  // Auth Status (Check if system is initialized and get logged-in profile)
  app.get('/api/auth/status', (req: Request, res: Response) => {
    let currentUser: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as AuthUser;
        const userRec = db.users.find((u) => u.id === decoded.id && u.active);
        if (userRec) {
          currentUser = {
            id: userRec.id,
            email: userRec.email,
            role: userRec.role,
            name: userRec.name,
            employeeId: userRec.employeeId,
            mustChangePassword: userRec.mustChangePassword,
          };
        }
      } catch (e) {
        // invalid token
      }
    }

    res.json({
      initialized: db.initialized,
      companyName: db.settings.companyName,
      user: currentUser,
    });
  });

  // First-Run Setup: Creates Company Profile and the First Admin Account
  app.post('/api/auth/setup', (req: Request, res: Response) => {
    if (db.initialized && db.users.some((u) => u.role === 'admin')) {
      return res.status(400).json({ error: 'System is already initialized with an Admin account.' });
    }

    const { companyName, adminName, adminEmail, adminPassword, officeLocation } = req.body;

    if (!companyName || !adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({ error: 'Company name, admin name, email and password are required.' });
    }

    db.initialized = true;
    db.settings.companyName = companyName;
    if (officeLocation) {
      db.settings.officeLocation = { ...db.settings.officeLocation, ...officeLocation };
    }

    // Default basic departments
    if (db.departments.length === 0) {
      db.departments = [
        { id: 'dept-1', name: 'Software Engineering', code: 'ENG' },
        { id: 'dept-2', name: 'Human Resources', code: 'HR' },
        { id: 'dept-3', name: 'Operations', code: 'OPS' },
      ];
    }
    if (db.designations.length === 0) {
      db.designations = [
        { id: 'des-1', title: 'Software Engineer', departmentId: 'dept-1' },
        { id: 'des-2', title: 'HR Manager', departmentId: 'dept-2' },
        { id: 'des-3', title: 'Operations Lead', departmentId: 'dept-3' },
      ];
    }

    const adminUser = {
      id: 'usr-admin-' + Date.now(),
      email: adminEmail.toLowerCase().trim(),
      passwordHash: hashPassword(adminPassword),
      role: 'admin' as UserRole,
      name: adminName.trim(),
      active: true,
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(adminUser);

    addAuditLog(db, {
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: 'admin',
      action: 'create',
      entity: 'company',
      summary: `Initial setup: Company '${companyName}' configured and primary Admin '${adminName}' created.`,
    });

    saveDatabase(db);

    const token = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
      },
    });
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.active
    );

    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    user.lastLoginAt = new Date().toISOString();
    saveDatabase(db);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        name: user.name,
        mustChangePassword: user.mustChangePassword,
      },
    });
  });

  // Change Password (for first-time login or self-service)
  app.post('/api/auth/change-password', authMiddleware, (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const user = db.users.find((u) => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (currentPassword && user.passwordHash !== hashPassword(currentPassword)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = false;

    addAuditLog(db, {
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'update',
      entity: 'user',
      entityId: user.id,
      summary: `User ${user.email} changed their password.`,
    });

    saveDatabase(db);
    res.json({ success: true, message: 'Password updated successfully.' });
  });

  // Reset to Fresh Install (Clean wipe for judging fresh start)
  app.post('/api/auth/reset', (req: Request, res: Response) => {
    db = resetDatabase();
    res.json({ success: true, message: 'System reset to clean fresh install state.' });
  });

  // Seed Demo Data (1-click load for judging live test)
  app.post('/api/auth/seed', (req: Request, res: Response) => {
    db = resetDatabase();
    populateDemoSeedData(db);
    saveDatabase(db);
    res.json({ success: true, message: 'Saylani Hackathon demo data populated successfully.' });
  });

  // ==========================================
  // MODULE 2: ORGANIZATION SETUP & SETTINGS
  // ==========================================

  // Get Settings
  app.get('/api/settings', authMiddleware, (req: Request, res: Response) => {
    res.json(db.settings);
  });

  // Update Settings (Admin Only)
  app.put('/api/settings', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const oldSettings = { ...db.settings };
    db.settings = { ...db.settings, ...req.body };

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'admin',
      action: 'update',
      entity: 'company',
      summary: 'Updated company configuration settings and office geofence rules.',
      beforeData: oldSettings,
      afterData: db.settings,
    });

    saveDatabase(db);
    res.json({ success: true, settings: db.settings });
  });

  // Departments CRUD
  app.get('/api/departments', authMiddleware, (req: Request, res: Response) => {
    res.json(db.departments);
  });

  app.post('/api/departments', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const { name, code, headName } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required.' });
    }

    const dept = {
      id: 'dept-' + Date.now(),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      headName,
    };
    db.departments.push(dept);
    saveDatabase(db);
    res.json({ success: true, department: dept });
  });

  app.delete('/api/departments/:id', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    db.departments = db.departments.filter((d) => d.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Designations CRUD
  app.get('/api/designations', authMiddleware, (req: Request, res: Response) => {
    res.json(db.designations);
  });

  app.post('/api/designations', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const { title, departmentId } = req.body;
    if (!title || !departmentId) {
      return res.status(400).json({ error: 'Title and department ID are required.' });
    }

    const des = {
      id: 'des-' + Date.now(),
      title: title.trim(),
      departmentId,
    };
    db.designations.push(des);
    saveDatabase(db);
    res.json({ success: true, designation: des });
  });

  app.delete('/api/designations/:id', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    db.designations = db.designations.filter((d) => d.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Leave Types & Quotas
  app.get('/api/leave-types', authMiddleware, (req: Request, res: Response) => {
    res.json(db.leaveTypes);
  });

  app.put('/api/leave-types/:id', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const lt = db.leaveTypes.find((l) => l.id === req.params.id);
    if (!lt) return res.status(404).json({ error: 'Leave type not found.' });

    const { yearlyQuota, paid, description } = req.body;
    if (yearlyQuota !== undefined) lt.yearlyQuota = yearlyQuota;
    if (paid !== undefined) lt.paid = paid;
    if (description !== undefined) lt.description = description;

    saveDatabase(db);
    res.json({ success: true, leaveType: lt });
  });

  // Public Holidays
  app.get('/api/holidays', authMiddleware, (req: Request, res: Response) => {
    res.json(db.holidays);
  });

  app.post('/api/holidays', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const { name, date, description } = req.body;
    if (!name || !date) return res.status(400).json({ error: 'Name and date are required.' });

    const holiday = { id: 'h-' + Date.now(), name, date, description };
    db.holidays.push(holiday);
    saveDatabase(db);
    res.json({ success: true, holiday });
  });

  app.delete('/api/holidays/:id', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    db.holidays = db.holidays.filter((h) => h.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // HR Logins Management (Admin Only)
  app.get('/api/users/hr', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const hrUsers = db.users
      .filter((u) => u.role === 'hr')
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        active: u.active,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }));
    res.json(hrUsers);
  });

  app.post('/api/users/hr', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const hrUser = {
      id: 'usr-hr-' + Date.now(),
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      role: 'hr' as UserRole,
      name: name.trim(),
      active: true,
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(hrUser);

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'admin',
      action: 'create',
      entity: 'user',
      entityId: hrUser.id,
      summary: `Created HR account for ${hrUser.name} (${hrUser.email}).`,
    });

    saveDatabase(db);
    res.json({ success: true, user: hrUser });
  });

  app.put('/api/users/:id/status', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const targetUser = db.users.find((u) => u.id === req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    const { active, resetPassword } = req.body;
    if (active !== undefined) targetUser.active = active;
    if (resetPassword) {
      targetUser.passwordHash = hashPassword(resetPassword);
      targetUser.mustChangePassword = true;
    }

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'admin',
      action: 'update',
      entity: 'user',
      entityId: targetUser.id,
      summary: `Updated account status for ${targetUser.email} (Active: ${targetUser.active}).`,
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // ==========================================
  // MODULE 3: EMPLOYEES & DIRECTORY
  // ==========================================

  // List Employees (Search, Filter, Paging, Scope Guard)
  app.get('/api/employees', authMiddleware, (req: Request, res: Response) => {
    const { query, departmentId, status, page = '1', limit = '50' } = req.query;
    const q = (query as string || '').toLowerCase();

    // Data-scope check: Employee only reads their own row unless general directory view
    let list = [...db.employees];

    if (q) {
      list = list.filter(
        (e) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
      );
    }

    if (departmentId) {
      list = list.filter((e) => e.departmentId === departmentId);
    }

    if (status) {
      list = list.filter((e) => e.status === status);
    }

    const total = list.length;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // If requester is an employee, hide sensitive compensation details from colleague profiles
    const sanitized = paginated.map((e) => {
      if (req.user!.role === 'employee' && req.user!.employeeId !== e.id) {
        return {
          id: e.id,
          code: e.code,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          phone: e.phone,
          departmentId: e.departmentId,
          designationId: e.designationId,
          joiningDate: e.joiningDate,
          status: e.status,
          gender: e.gender,
        };
      }
      return e;
    });

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      employees: sanitized,
    });
  });

  // Register Employee (HR Only: creates employee + creates login with temporary password)
  app.post('/api/employees', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      departmentId,
      designationId,
      joiningDate,
      gender = 'other',
      basicSalary,
      emergencyContact,
      temporaryPassword = 'Welcome@2026',
    } = req.body;

    if (!firstName || !lastName || !email || !departmentId || !designationId || !joiningDate || !basicSalary) {
      return res.status(400).json({ error: 'All core employee fields and basic salary are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (db.employees.some((e) => e.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'An employee with this email already exists.' });
    }

    // Auto-generate unique code
    const empCount = db.employees.length + 1;
    const code = `EMP-${String(empCount).padStart(3, '0')}`;

    const parsedSalary = parseFloat(basicSalary);
    const hra = Math.round(parsedSalary * 0.4);
    const medical = Math.round(parsedSalary * 0.1);
    const gross = parsedSalary + hra + medical; // 1.5 * basic

    const newEmp: Employee = {
      id: 'emp-' + Date.now(),
      code,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone: phone || '',
      address: address || '',
      departmentId,
      designationId,
      joiningDate,
      status: 'active',
      gender,
      emergencyContact,
      basicSalary: parsedSalary,
      hraAllowance: hra,
      medicalAllowance: medical,
      grossSalary: gross,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.employees.push(newEmp);

    // Create user login with temporary password and mustChangePassword = true
    const userAccount = {
      id: 'usr-emp-' + Date.now(),
      email: cleanEmail,
      passwordHash: hashPassword(temporaryPassword),
      role: 'employee' as UserRole,
      employeeId: newEmp.id,
      name: `${newEmp.firstName} ${newEmp.lastName}`,
      active: true,
      mustChangePassword: true, // First sign-in requires password change!
      createdAt: new Date().toISOString(),
    };

    db.users.push(userAccount);

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'create',
      entity: 'employee',
      entityId: newEmp.id,
      summary: `Registered new employee ${newEmp.code} (${newEmp.firstName} ${newEmp.lastName}) with login created.`,
      afterData: newEmp,
    });

    saveDatabase(db);

    res.json({
      success: true,
      employee: newEmp,
      loginCredentials: {
        email: cleanEmail,
        temporaryPassword,
        mustChangePassword: true,
      },
    });
  });

  // Edit Employee Details (HR/Admin can edit all; Employee only phone & address)
  app.put('/api/employees/:id', authMiddleware, (req: Request, res: Response) => {
    const emp = db.employees.find((e) => e.id === req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    // Data-scope check
    if (req.user!.role === 'employee') {
      if (req.user!.employeeId !== emp.id) {
        return res.status(403).json({ error: 'You are only permitted to edit your own contact profile.' });
      }
      // Employee self-service: only phone and address
      const { phone, address, emergencyContact } = req.body;
      if (phone !== undefined) emp.phone = phone;
      if (address !== undefined) emp.address = address;
      if (emergencyContact !== undefined) emp.emergencyContact = emergencyContact;
      emp.updatedAt = new Date().toISOString();
      saveDatabase(db);
      return res.json({ success: true, employee: emp });
    }

    // HR / Admin edit
    const oldData = { ...emp };
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      departmentId,
      designationId,
      joiningDate,
      exitDate,
      status,
      gender,
      basicSalary,
      emergencyContact,
    } = req.body;

    if (firstName) emp.firstName = firstName.trim();
    if (lastName) emp.lastName = lastName.trim();
    if (email) emp.email = email.toLowerCase().trim();
    if (phone !== undefined) emp.phone = phone;
    if (address !== undefined) emp.address = address;
    if (departmentId) emp.departmentId = departmentId;
    if (designationId) emp.designationId = designationId;
    if (joiningDate) emp.joiningDate = joiningDate;
    if (exitDate !== undefined) emp.exitDate = exitDate;
    if (status) emp.status = status;
    if (gender) emp.gender = gender;
    if (emergencyContact !== undefined) emp.emergencyContact = emergencyContact;

    if (basicSalary !== undefined) {
      const num = parseFloat(basicSalary);
      emp.basicSalary = num;
      emp.hraAllowance = Math.round(num * 0.4);
      emp.medicalAllowance = Math.round(num * 0.1);
      emp.grossSalary = num + emp.hraAllowance + emp.medicalAllowance;
    }

    emp.updatedAt = new Date().toISOString();

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'update',
      entity: 'employee',
      entityId: emp.id,
      summary: `Updated profile details for employee ${emp.code} (${emp.firstName} ${emp.lastName}).`,
      beforeData: oldData,
      afterData: emp,
    });

    saveDatabase(db);
    res.json({ success: true, employee: emp });
  });

  // Employee 360 View: Personal info, Attendance stats, Leave history, Payslips, Attrition risk score
  app.get('/api/employees/:id/profile', authMiddleware, (req: Request, res: Response) => {
    const emp = db.employees.find((e) => e.id === req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    // Scope check: Employee can only view own 360 profile
    if (req.user!.role === 'employee' && req.user!.employeeId !== emp.id) {
      return res.status(403).json({ error: 'Access denied to colleague 360 profile.' });
    }

    const attendance = db.attendance.filter((a) => a.employeeId === emp.id);
    const leaves = db.leaves.filter((l) => l.employeeId === emp.id);
    const payslips = db.payrollRuns
      .filter((r) => r.status === 'finalized')
      .map((r) => r.items.find((i) => i.employeeId === emp.id))
      .filter(Boolean);

    // Attrition Risk calculation
    const joining = new Date(emp.joiningDate);
    const now = new Date('2026-10-24');
    const tenureMonths = Math.max(1, Math.round((now.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const lates = attendance.filter((a) => a.status === 'late').length;
    const absences = attendance.filter((a) => a.status === 'absent').length;
    const absenceRate = attendance.length > 0 ? absences / attendance.length : 0;

    // Dept average salary
    const deptEmps = db.employees.filter((e) => e.departmentId === emp.departmentId);
    const avgDeptSalary =
      deptEmps.reduce((acc, e) => acc + e.grossSalary, 0) / Math.max(1, deptEmps.length);
    const salaryRatio = avgDeptSalary > 0 ? emp.grossSalary / avgDeptSalary : 1.0;

    const attritionRisk = calculateAttritionRisk({
      tenureMonths,
      absenceRate,
      lateCount: lates,
      salaryRatio,
    });

    const department = db.departments.find((d) => d.id === emp.departmentId);
    const designation = db.designations.find((d) => d.id === emp.designationId);

    res.json({
      employee: emp,
      departmentName: department?.name || 'N/A',
      designationTitle: designation?.title || 'N/A',
      attendanceCount: attendance.length,
      latesCount: lates,
      leavesCount: leaves.length,
      attritionRisk,
      recentAttendance: attendance.slice(-10),
      recentLeaves: leaves,
      recentPayslips: payslips,
    });
  });

  // CSV Dry Run: Validates row + field + reason
  app.post('/api/employees/csv-dryrun', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const { rows } = req.body; // array of objects
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Provide rows array in CSV format.' });
    }

    const errors: { row: number; field: string; reason: string }[] = [];
    const seenEmails = new Set(db.employees.map((e) => e.email.toLowerCase()));
    const validDeptCodes = new Set(db.departments.map((d) => d.code.toUpperCase()));

    rows.forEach((row, index) => {
      const rowNum = index + 1;

      // Required fields
      if (!row.firstName) errors.push({ row: rowNum, field: 'firstName', reason: 'First name is required.' });
      if (!row.lastName) errors.push({ row: rowNum, field: 'lastName', reason: 'Last name is required.' });

      // Email validation
      if (!row.email) {
        errors.push({ row: rowNum, field: 'email', reason: 'Email is required.' });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push({ row: rowNum, field: 'email', reason: 'Invalid email syntax.' });
      } else if (seenEmails.has(row.email.toLowerCase())) {
        errors.push({ row: rowNum, field: 'email', reason: 'Email already exists in company database.' });
      } else {
        seenEmails.add(row.email.toLowerCase());
      }

      // Department check
      if (!row.departmentCode) {
        errors.push({ row: rowNum, field: 'departmentCode', reason: 'Department code is required.' });
      } else if (!validDeptCodes.has(row.departmentCode.toUpperCase())) {
        errors.push({
          row: rowNum,
          field: 'departmentCode',
          reason: `Unknown department '${row.departmentCode}'. Known codes: ${Array.from(validDeptCodes).join(', ')}`,
        });
      }

      // ISO Date check
      if (!row.joiningDate || !/^\d{4}-\d{2}-\d{2}$/.test(row.joiningDate)) {
        errors.push({ row: rowNum, field: 'joiningDate', reason: 'Joining date must be ISO format (YYYY-MM-DD).' });
      }

      // Salary > 0 check
      const sal = parseFloat(row.basicSalary);
      if (isNaN(sal) || sal <= 0) {
        errors.push({ row: rowNum, field: 'basicSalary', reason: 'Basic salary must be a positive number greater than 0.' });
      }
    });

    res.json({
      totalRows: rows.length,
      valid: errors.length === 0,
      errorsCount: errors.length,
      errors,
    });
  });

  // CSV Import Commit
  app.post('/api/employees/csv-import', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided.' });
    }

    const imported: Employee[] = [];
    let count = db.employees.length;

    rows.forEach((row) => {
      count++;
      const code = `EMP-${String(count).padStart(3, '0')}`;
      const basic = parseFloat(row.basicSalary);
      const hra = Math.round(basic * 0.4);
      const medical = Math.round(basic * 0.1);
      const gross = basic + hra + medical;

      const dept = db.departments.find((d) => d.code.toUpperCase() === (row.departmentCode || '').toUpperCase()) || db.departments[0];
      const des = db.designations.find((d) => d.departmentId === dept.id) || db.designations[0];

      const emp: Employee = {
        id: 'emp-' + Date.now() + '-' + count,
        code,
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: row.email.toLowerCase().trim(),
        phone: row.phone || '',
        address: row.address || '',
        departmentId: dept.id,
        designationId: des.id,
        joiningDate: row.joiningDate,
        status: 'active',
        gender: (row.gender?.toLowerCase() === 'female' ? 'female' : 'male') as any,
        basicSalary: basic,
        hraAllowance: hra,
        medicalAllowance: medical,
        grossSalary: gross,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.employees.push(emp);
      imported.push(emp);

      // Create login
      db.users.push({
        id: 'usr-emp-' + Date.now() + '-' + count,
        email: emp.email,
        passwordHash: hashPassword('Welcome@2026'),
        role: 'employee',
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        active: true,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      });
    });

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'import',
      entity: 'employee',
      summary: `Batch imported ${imported.length} employees from CSV.`,
    });

    saveDatabase(db);
    res.json({ success: true, importedCount: imported.length, imported });
  });

  // CSV Export
  app.get('/api/employees/csv-export', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const headers = [
      'Code',
      'FirstName',
      'LastName',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'JoiningDate',
      'Status',
      'BasicSalary',
      'GrossSalary',
    ];

    const lines = [headers.join(',')];

    db.employees.forEach((e) => {
      const dept = db.departments.find((d) => d.id === e.departmentId)?.name || '';
      const des = db.designations.find((d) => d.id === e.designationId)?.title || '';
      lines.push(
        [
          e.code,
          `"${e.firstName}"`,
          `"${e.lastName}"`,
          e.email,
          `"${e.phone}"`,
          `"${dept}"`,
          `"${des}"`,
          e.joiningDate,
          e.status,
          e.basicSalary,
          e.grossSalary,
        ].join(',')
      );
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hcm_employees.csv"');
    res.send(lines.join('\n'));
  });

  // ==========================================
  // MODULE 4: ATTENDANCE & CAMERA GEOFENCE
  // ==========================================

  // Check-In (Web or Camera)
  app.post('/api/attendance/check-in', authMiddleware, (req: Request, res: Response) => {
    const targetEmpId =
      req.user!.role === 'employee' ? req.user!.employeeId : req.body.employeeId || req.user!.employeeId;

    if (!targetEmpId) {
      return res.status(400).json({ error: 'No employee account associated.' });
    }

    const todayStr = req.body.date || '2026-10-24';
    const serverTime = new Date().toISOString();

    // Rule: One record per employee per day (second check-in = 409 Conflict)
    const existing = db.attendance.find((a) => a.employeeId === targetEmpId && a.date === todayStr);
    if (existing) {
      return res.status(409).json({
        error: `Employee already checked in today at ${new Date(existing.checkInTime).toLocaleTimeString()}. Multiple check-ins on the same day are prohibited (409 Conflict).`,
      });
    }

    const { source = 'web', location, faceDetected, faceCount } = req.body;

    // Bonus Feature: Camera attendance verification
    if (source === 'camera') {
      // 1. Face count check: exactly one face in frame
      if (faceCount !== undefined && faceCount !== 1) {
        return res.status(400).json({
          error:
            faceCount === 0
              ? 'Attendance rejected: No face detected in camera frame. Please position yourself in front of the lens.'
              : `Attendance rejected: Multiple faces (${faceCount}) detected in camera frame. Only one individual permitted.`,
        });
      }

      // 2. GPS Geofence & accuracy check
      if (location) {
        const { lat, lng, accuracy } = location;
        if (accuracy > 100) {
          return res.status(400).json({
            error: `Attendance rejected: GPS accuracy is too low (${Math.round(accuracy)}m > 100m maximum allowed). Please enable high-accuracy device location.`,
          });
        }

        const office = db.settings.officeLocation;
        const distance = calculateHaversineDistance(lat, lng, office.lat, office.lng);

        if (distance > office.radiusMeters) {
          return res.status(400).json({
            error: `Attendance rejected: You are ${distance}m away from the office. You must be within ${office.radiusMeters}m of ${office.address}.`,
            distance,
            radius: office.radiusMeters,
          });
        }
      }
    }

    // Evaluate on-time / late status based on officeStartTime + graceMinutes
    const status = evaluateCheckInStatus(
      serverTime,
      db.settings.officeStartTime,
      db.settings.graceMinutes
    );

    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      employeeId: targetEmpId,
      date: todayStr,
      checkInTime: serverTime,
      status,
      source: source === 'camera' ? 'camera' : 'web',
      faceVerified: source === 'camera' && !!faceDetected,
      location:
        location && db.settings.officeLocation
          ? {
              lat: location.lat,
              lng: location.lng,
              distanceMeters: calculateHaversineDistance(
                location.lat,
                location.lng,
                db.settings.officeLocation.lat,
                db.settings.officeLocation.lng
              ),
              accuracy: location.accuracy,
            }
          : undefined,
    };

    db.attendance.push(record);
    saveDatabase(db);

    res.json({
      success: true,
      record,
      message:
        status === 'late'
          ? `Checked in successfully (Late: check-in occurred after ${db.settings.officeStartTime} + ${db.settings.graceMinutes}m grace).`
          : 'Checked in successfully (On Time).',
    });
  });

  // Check-Out
  app.post('/api/attendance/check-out', authMiddleware, (req: Request, res: Response) => {
    const targetEmpId =
      req.user!.role === 'employee' ? req.user!.employeeId : req.body.employeeId || req.user!.employeeId;
    const todayStr = req.body.date || '2026-10-24';

    const record = db.attendance.find((a) => a.employeeId === targetEmpId && a.date === todayStr);
    if (!record) {
      return res.status(404).json({ error: 'No active check-in record found for today.' });
    }

    if (record.checkOutTime) {
      return res.status(400).json({ error: 'Check-out already stamped for today.' });
    }

    const serverTime = new Date().toISOString();
    record.checkOutTime = serverTime;

    // Rule: Half day under 5 hours
    const evalOut = evaluateCheckOutStatus(
      record.checkInTime,
      serverTime,
      record.status as any,
      db.settings.halfDayThresholdHours
    );

    record.status = evalOut.status;
    record.totalHoursWorked = evalOut.hoursWorked;

    saveDatabase(db);

    res.json({
      success: true,
      record,
      message:
        evalOut.status === 'half_day'
          ? `Checked out. Duration (${evalOut.hoursWorked} hrs) is under 5h threshold; marked as Half Day.`
          : `Checked out successfully (${evalOut.hoursWorked} hrs recorded).`,
    });
  });

  // Daily Attendance Board (Admin & HR see all, Employee sees own)
  app.get('/api/attendance/board', authMiddleware, (req: Request, res: Response) => {
    const date = (req.query.date as string) || '2026-10-24';
    const deptId = req.query.departmentId as string;

    let targetEmps = db.employees.filter((e) => e.status !== 'exited');
    if (deptId) {
      targetEmps = targetEmps.filter((e) => e.departmentId === deptId);
    }

    // Role scope
    if (req.user!.role === 'employee') {
      targetEmps = targetEmps.filter((e) => e.id === req.user!.employeeId);
    }

    const records = db.attendance.filter((a) => a.date === date);
    const leavesToday = db.leaves.filter(
      (l) => l.status === 'approved' && l.startDate <= date && l.endDate >= date
    );

    const board = targetEmps.map((emp) => {
      const att = records.find((r) => r.employeeId === emp.id);
      const onLeave = leavesToday.find((l) => l.employeeId === emp.id);

      let currentStatus: string = 'absent';
      if (att) {
        currentStatus = att.status;
      } else if (onLeave) {
        currentStatus = 'on_leave';
      }

      const dept = db.departments.find((d) => d.id === emp.departmentId)?.name;
      const des = db.designations.find((d) => d.id === emp.designationId)?.title;

      return {
        employeeId: emp.id,
        employeeCode: emp.code,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: dept,
        designation: des,
        status: currentStatus,
        checkInTime: att?.checkInTime,
        checkOutTime: att?.checkOutTime,
        hoursWorked: att?.totalHoursWorked,
        source: att?.source,
        location: att?.location,
      };
    });

    res.json({ date, board });
  });

  // Employee Own Attendance Calendar / History
  app.get('/api/attendance/my', authMiddleware, (req: Request, res: Response) => {
    const targetEmpId =
      req.user!.role === 'employee' ? req.user!.employeeId : (req.query.employeeId as string) || req.user!.employeeId;

    if (!targetEmpId) return res.json([]);

    const records = db.attendance.filter((a) => a.employeeId === targetEmpId);
    res.json(records);
  });

  // Attendance Corrections
  app.post('/api/attendance/corrections', authMiddleware, (req: Request, res: Response) => {
    const targetEmpId =
      req.user!.role === 'employee' ? req.user!.employeeId : req.body.employeeId || req.user!.employeeId;
    const { date, requestedCheckIn, requestedCheckOut, reason } = req.body;

    if (!date || !requestedCheckIn || !reason) {
      return res.status(400).json({ error: 'Date, check-in time and valid reason are required.' });
    }

    const correction = {
      id: 'cor-' + Date.now(),
      employeeId: targetEmpId!,
      date,
      requestedCheckIn,
      requestedCheckOut: requestedCheckOut || '18:00',
      reason: reason.trim(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    db.attendanceCorrections.push(correction);

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'create',
      entity: 'attendance',
      entityId: correction.id,
      summary: `Submitted attendance correction request for ${date}: ${reason}`,
    });

    saveDatabase(db);
    res.json({ success: true, correction });
  });

  app.get('/api/attendance/corrections', authMiddleware, (req: Request, res: Response) => {
    let list = db.attendanceCorrections;
    if (req.user!.role === 'employee') {
      list = list.filter((c) => c.employeeId === req.user!.employeeId);
    }
    res.json(list);
  });

  app.post('/api/attendance/corrections/:id/review', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const corr = db.attendanceCorrections.find((c) => c.id === req.params.id);
    if (!corr) return res.status(404).json({ error: 'Correction request not found.' });

    const { status, comment } = req.body; // 'approved' | 'rejected'
    corr.status = status;
    corr.hrComment = comment;
    corr.reviewedBy = req.user!.id;
    corr.reviewedAt = new Date().toISOString();

    if (status === 'approved') {
      // Update attendance record
      let att = db.attendance.find((a) => a.employeeId === corr.employeeId && a.date === corr.date);
      if (!att) {
        att = {
          id: 'att-' + Date.now(),
          employeeId: corr.employeeId,
          date: corr.date,
          checkInTime: `${corr.date}T${corr.requestedCheckIn}:00Z`,
          checkOutTime: `${corr.date}T${corr.requestedCheckOut}:00Z`,
          status: 'present',
          source: 'web',
          totalHoursWorked: 8.5,
          notes: `Updated via approved correction: ${comment || 'N/A'}`,
        };
        db.attendance.push(att);
      } else {
        att.checkInTime = `${corr.date}T${corr.requestedCheckIn}:00Z`;
        att.checkOutTime = `${corr.date}T${corr.requestedCheckOut}:00Z`;
        att.status = 'present';
        att.totalHoursWorked = 8.5;
        att.notes = `Corrected by HR: ${comment || 'Approved'}`;
      }
    }

    addNotification(db, {
      userId: corr.employeeId,
      title: `Attendance Correction ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your correction request for ${corr.date} has been ${status}. ${comment ? 'Comment: ' + comment : ''}`,
      type: 'attendance',
    });

    saveDatabase(db);
    res.json({ success: true, correction: corr });
  });

  // ==========================================
  // MODULE 5: LEAVE MANAGEMENT
  // ==========================================

  // Apply Leave (Working days only, Quotas, Overlap check)
  app.post('/api/leaves/apply', authMiddleware, (req: Request, res: Response) => {
    const targetEmpId =
      req.user!.role === 'employee' ? req.user!.employeeId : req.body.employeeId || req.user!.employeeId;

    if (!targetEmpId) return res.status(400).json({ error: 'Employee account required.' });

    const { leaveTypeId, startDate, endDate, reason } = req.body;
    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Leave type, start date, end date, and reason are required.' });
    }

    const leaveType = db.leaveTypes.find((lt) => lt.id === leaveTypeId);
    if (!leaveType) {
      return res.status(400).json({ error: 'Invalid leave type.' });
    }

    // 1. Calculate working days (skipping weekends & holidays)
    const { count: workingDays, validDates } = calculateWorkingDays(
      startDate,
      endDate,
      db.settings.weekendDays,
      db.holidays
    );

    if (workingDays <= 0) {
      return res.status(400).json({
        error: 'The requested date range contains 0 working days (dates fall entirely on weekends or public holidays).',
      });
    }

    // 2. Overlap Check: Reject if overlaps with existing approved or pending leaves
    const existingLeaves = db.leaves.filter(
      (l) => l.employeeId === targetEmpId && l.status !== 'rejected' && l.status !== 'cancelled'
    );

    for (const ex of existingLeaves) {
      const exDays = calculateWorkingDays(ex.startDate, ex.endDate, db.settings.weekendDays, db.holidays).validDates;
      const overlaps = validDates.some((d) => exDays.includes(d));
      if (overlaps) {
        return res.status(422).json({
          error: `Overlap Error (422): You already have an active or pending leave request covering these dates (${ex.startDate} to ${ex.endDate}).`,
        });
      }
    }

    // 3. Quota Balance Check: Check against quota (annual 14, sick 8, casual 10, unpaid unlimited)
    if (leaveType.yearlyQuota !== 999) {
      const usedDays = db.leaves
        .filter((l) => l.employeeId === targetEmpId && l.leaveTypeId === leaveTypeId && l.status === 'approved')
        .reduce((sum, l) => sum + l.workingDays, 0);

      const remainingQuota = leaveType.yearlyQuota - usedDays;
      if (workingDays > remainingQuota) {
        return res.status(422).json({
          error: `Over-balance Error (422): Requested ${workingDays} working days, but remaining balance for ${leaveType.name.toUpperCase()} is only ${remainingQuota} days (Quota: ${leaveType.yearlyQuota}, Used: ${usedDays}).`,
        });
      }
    }

    const leaveRequest: LeaveRequest = {
      id: 'lv-' + Date.now(),
      employeeId: targetEmpId,
      leaveTypeId,
      startDate,
      endDate,
      workingDays,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.leaves.push(leaveRequest);

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'create',
      entity: 'leave',
      entityId: leaveRequest.id,
      summary: `Submitted ${leaveType.name} leave request (${startDate} to ${endDate}, ${workingDays} working days): ${reason}`,
    });

    saveDatabase(db);

    res.json({
      success: true,
      leaveRequest,
      message: `Leave application submitted successfully for ${workingDays} working days.`,
    });
  });

  // Balances
  app.get('/api/leaves/balances', authMiddleware, (req: Request, res: Response) => {
    const targetEmpId =
      req.user!.role === 'employee' ? req.user!.employeeId : (req.query.employeeId as string) || req.user!.employeeId;

    if (!targetEmpId) return res.json([]);

    const approvedLeaves = db.leaves.filter(
      (l) => l.employeeId === targetEmpId && l.status === 'approved'
    );

    const balances = db.leaveTypes.map((lt) => {
      const used = approvedLeaves
        .filter((l) => l.leaveTypeId === lt.id)
        .reduce((sum, l) => sum + l.workingDays, 0);

      return {
        leaveTypeId: lt.id,
        leaveTypeName: lt.name.toUpperCase(),
        quota: lt.yearlyQuota,
        used,
        remaining: lt.yearlyQuota === 999 ? 999 : Math.max(0, lt.yearlyQuota - used),
      };
    });

    res.json(balances);
  });

  // My Leaves
  app.get('/api/leaves/my', authMiddleware, (req: Request, res: Response) => {
    const targetEmpId =
      req.user!.role === 'employee' ? req.user!.employeeId : (req.query.employeeId as string) || req.user!.employeeId;
    const leaves = db.leaves.filter((l) => l.employeeId === targetEmpId);
    res.json(leaves);
  });

  // Approvals Inbox (HR & Admin)
  app.get('/api/leaves/inbox', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const pending = db.leaves.map((l) => {
      const emp = db.employees.find((e) => e.id === l.employeeId);
      const lt = db.leaveTypes.find((t) => t.id === l.leaveTypeId);
      return {
        ...l,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        employeeCode: emp?.code || 'N/A',
        department: db.departments.find((d) => d.id === emp?.departmentId)?.name || 'N/A',
        leaveTypeName: lt?.name.toUpperCase() || 'N/A',
      };
    });
    res.json(pending);
  });

  // Approve / Reject Leave
  app.post('/api/leaves/:id/review', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const leave = db.leaves.find((l) => l.id === req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found.' });

    const { status, hrComment } = req.body;
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
    }

    leave.status = status;
    leave.hrComment = hrComment;
    leave.reviewedBy = req.user!.id;
    leave.reviewedAt = new Date().toISOString();

    const emp = db.employees.find((e) => e.id === leave.employeeId);

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: status === 'approved' ? 'approve' : 'reject',
      entity: 'leave',
      entityId: leave.id,
      summary: `${status === 'approved' ? 'Approved' : 'Rejected'} leave request for ${emp ? emp.firstName + ' ' + emp.lastName : leave.employeeId}.`,
    });

    addNotification(db, {
      userId: leave.employeeId,
      title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your leave request for ${leave.startDate} to ${leave.endDate} was ${status}. ${hrComment ? 'HR: ' + hrComment : ''}`,
      type: 'leave',
    });

    saveDatabase(db);
    res.json({ success: true, leave });
  });

  // ==========================================
  // MODULE 6: PAYROLL LITE
  // ==========================================

  // Create Monthly Payroll Draft (HR Only)
  app.post('/api/payroll/draft', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const { month = '2026-10' } = req.body;

    const existingFinalized = db.payrollRuns.find((r) => r.month === month && r.status === 'finalized');
    if (existingFinalized) {
      return res.status(400).json({ error: `Payroll for month ${month} is already finalized and locked.` });
    }

    const workingDays = getWorkingDaysInMonth(month, db.settings.weekendDays, db.holidays);

    // Compute payroll items for each employee
    const items = db.employees.map((emp) => {
      // Gather attendance & leaves for the month
      const monthAtt = db.attendance.filter(
        (a) => a.employeeId === emp.id && a.date.startsWith(month)
      );

      const daysPresent = monthAtt.filter((a) => a.status === 'present').length;
      const daysLate = monthAtt.filter((a) => a.status === 'late').length;
      const daysHalfDay = monthAtt.filter((a) => a.status === 'half_day').length;

      // Approved leaves
      const monthLeaves = db.leaves.filter(
        (l) => l.employeeId === emp.id && l.status === 'approved' && l.startDate.startsWith(month)
      );
      const unpaidLeaveType = db.leaveTypes.find((lt) => lt.name === 'unpaid');
      const daysUnpaid = monthLeaves
        .filter((l) => l.leaveTypeId === unpaidLeaveType?.id)
        .reduce((sum, l) => sum + l.workingDays, 0);

      // Absent: working days minus attended and minus approved leaves
      const attendedCount = daysPresent + daysLate + daysHalfDay;
      const approvedPaidLeaveDays = monthLeaves
        .filter((l) => l.leaveTypeId !== unpaidLeaveType?.id)
        .reduce((sum, l) => sum + l.workingDays, 0);

      const daysAbsent = Math.max(0, workingDays - (attendedCount + approvedPaidLeaveDays + daysUnpaid));

      const calc = computeEmployeePayroll({
        basicSalary: emp.basicSalary,
        joiningDate: emp.joiningDate,
        exitDate: emp.exitDate,
        month,
        workingDaysInMonth: workingDays,
        daysPresent,
        daysLate,
        daysHalfDay,
        daysAbsent,
        daysUnpaidLeave: daysUnpaid,
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

    const totalGross = items.reduce((acc, i) => acc + i.grossSalary, 0);
    const totalDeductions = items.reduce((acc, i) => acc + i.totalDeductions, 0);
    const totalTax = items.reduce((acc, i) => acc + i.monthlyTax, 0);
    const totalNet = items.reduce((acc, i) => acc + i.netSalary, 0);

    // Upsert draft
    let run = db.payrollRuns.find((r) => r.month === month && r.status === 'draft');
    if (run) {
      run.totalWorkingDays = workingDays;
      run.totalGross = totalGross;
      run.totalDeductions = totalDeductions;
      run.totalTax = totalTax;
      run.totalNet = totalNet;
      run.employeeCount = items.length;
      run.preparedBy = req.user!.id;
      run.preparedAt = new Date().toISOString();
      run.items = items;
    } else {
      run = {
        id: 'pay-' + month,
        month,
        year: parseInt(month.split('-')[0], 10),
        totalWorkingDays: workingDays,
        totalGross,
        totalDeductions,
        totalTax,
        totalNet,
        employeeCount: items.length,
        status: 'draft',
        preparedBy: req.user!.id,
        preparedAt: new Date().toISOString(),
        items,
      };
      db.payrollRuns.push(run);
    }

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'create',
      entity: 'payroll',
      entityId: run.id,
      summary: `Prepared monthly payroll draft for ${month} (Total Gross: PKR ${totalGross.toLocaleString()}).`,
    });

    saveDatabase(db);
    res.json({ success: true, run });
  });

  // Get Payroll Runs
  app.get('/api/payroll/runs', authMiddleware, (req: Request, res: Response) => {
    // If employee, return only finalized runs with only their own line item
    if (req.user!.role === 'employee') {
      const myRuns = db.payrollRuns
        .filter((r) => r.status === 'finalized')
        .map((r) => ({
          ...r,
          items: r.items.filter((i) => i.employeeId === req.user!.employeeId),
        }));
      return res.json(myRuns);
    }
    res.json(db.payrollRuns);
  });

  // Finalize Payroll Run (Admin Only locks the month)
  app.post('/api/payroll/:id/finalize', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const run = db.payrollRuns.find((r) => r.id === req.params.id);
    if (!run) return res.status(404).json({ error: 'Payroll run not found.' });

    if (run.status === 'finalized') {
      return res.status(400).json({ error: 'This payroll run is already finalized and permanently locked.' });
    }

    run.status = 'finalized';
    run.finalizedBy = req.user!.id;
    run.finalizedAt = new Date().toISOString();

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'admin',
      action: 'finalize',
      entity: 'payroll',
      entityId: run.id,
      summary: `Finalized and locked payroll run for ${run.month}. Total Net Disbursement: PKR ${run.totalNet.toLocaleString()}`,
    });

    // Notify employees
    run.items.forEach((item) => {
      addNotification(db, {
        userId: item.employeeId,
        title: `Payslip Available for ${run.month}`,
        message: `Your payslip for ${run.month} is finalized. Net pay: PKR ${item.netSalary.toLocaleString()}.`,
        type: 'payroll',
      });
    });

    saveDatabase(db);
    res.json({ success: true, run });
  });

  // ==========================================
  // MODULE 7: DASHBOARDS & ANALYTICS
  // ==========================================

  // Admin Dashboard Metrics
  app.get('/api/dashboards/admin', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    const activeEmps = db.employees.filter((e) => e.status === 'active');
    const probationEmps = db.employees.filter((e) => e.status === 'probation');
    const exitedEmps = db.employees.filter((e) => e.status === 'exited');
    const headcount = activeEmps.length + probationEmps.length;

    // Headcount / Attrition formula from Section 7:
    // (Active + probation on end date) / (exits in period / avg headcount * 100)
    const avgHeadcount = Math.max(1, headcount + exitedEmps.length / 2);
    const attritionRate = Math.round((exitedEmps.length / avgHeadcount) * 100);

    // Payroll metrics
    const latestRun = db.payrollRuns[db.payrollRuns.length - 1];
    const totalPayrollCost =
      latestRun?.totalGross || db.employees.reduce((acc, e) => acc + e.grossSalary, 0);
    const avgSalary =
      db.employees.length > 0 ? Math.round(totalPayrollCost / db.employees.length) : 0;

    // Headcount by department
    const headcountByDept = db.departments.map((dept) => {
      const count = db.employees.filter(
        (e) => e.departmentId === dept.id && e.status !== 'exited'
      ).length;
      const deptPayroll = db.employees
        .filter((e) => e.departmentId === dept.id && e.status !== 'exited')
        .reduce((sum, e) => sum + e.grossSalary, 0);

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        code: dept.code,
        headcount: count,
        payrollCost: deptPayroll,
      };
    });

    // Gender breakdown
    const maleCount = db.employees.filter((e) => e.gender === 'male').length;
    const femaleCount = db.employees.filter((e) => e.gender === 'female').length;
    const otherCount = db.employees.filter((e) => e.gender === 'other').length;

    res.json({
      headcount,
      activeCount: activeEmps.length,
      probationCount: probationEmps.length,
      exitedCount: exitedEmps.length,
      attritionRate: `${attritionRate}%`,
      totalPayrollCost,
      averageSalary: avgSalary,
      headcountByDept,
      genderDistribution: { male: maleCount, female: femaleCount, other: otherCount },
      auditFeed: db.auditLogs.slice(0, 10),
    });
  });

  // HR Dashboard Metrics
  app.get('/api/dashboards/hr', authMiddleware, requireRole(['hr', 'admin']), (req: Request, res: Response) => {
    const today = '2026-10-24';
    const activeEmps = db.employees.filter((e) => e.status !== 'exited');
    const todayAtt = db.attendance.filter((a) => a.date === today);

    const onLeaveToday = db.leaves.filter(
      (l) => l.status === 'approved' && l.startDate <= today && l.endDate >= today
    );

    const present = todayAtt.filter((a) => a.status === 'present').length;
    const late = todayAtt.filter((a) => a.status === 'late').length;
    const halfDay = todayAtt.filter((a) => a.status === 'half_day').length;
    const onLeave = onLeaveToday.length;

    // Pending approvals count
    const pendingLeaves = db.leaves.filter((l) => l.status === 'pending').length;
    const pendingCorrections = db.attendanceCorrections.filter((c) => c.status === 'pending').length;

    // Top late comers
    const lateRecords = db.attendance.filter((a) => a.status === 'late');
    const lateCounts: Record<string, number> = {};
    lateRecords.forEach((r) => {
      lateCounts[r.employeeId] = (lateCounts[r.employeeId] || 0) + 1;
    });

    const topLateComers = Object.entries(lateCounts)
      .map(([empId, count]) => {
        const emp = db.employees.find((e) => e.id === empId);
        return {
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Staff',
          department: db.departments.find((d) => d.id === emp?.departmentId)?.name || 'General',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Leave utilization by type
    const leaveByType = db.leaveTypes.map((lt) => {
      const used = db.leaves
        .filter((l) => l.leaveTypeId === lt.id && l.status === 'approved')
        .reduce((sum, l) => sum + l.workingDays, 0);
      return {
        name: lt.name.toUpperCase(),
        usedDays: used,
        quota: lt.yearlyQuota,
      };
    });

    // Attendance rate formula
    const denominator = Math.max(1, activeEmps.length - onLeave);
    const numerator = present + late + 0.5 * halfDay;
    const attendanceRate = Math.round((numerator / denominator) * 100);

    res.json({
      headcount: activeEmps.length,
      presentToday: present,
      onLeaveToday: onLeave,
      lateToday: late,
      halfDayToday: halfDay,
      attendanceRate: `${attendanceRate}%`,
      pendingApprovals: pendingLeaves + pendingCorrections,
      pendingLeavesCount: pendingLeaves,
      pendingCorrectionsCount: pendingCorrections,
      topLateComers,
      leaveByType,
    });
  });

  // Employee Dashboard Metrics
  app.get('/api/dashboards/employee', authMiddleware, (req: Request, res: Response) => {
    const empId = req.user!.employeeId;
    const emp = db.employees.find((e) => e.id === empId);

    const todayStr = '2026-10-24';
    const todayAtt = db.attendance.find((a) => a.employeeId === empId && a.date === todayStr);

    // Hours this week
    const recentAtt = db.attendance.filter((a) => a.employeeId === empId);
    const weeklyHours = recentAtt.reduce((sum, a) => sum + (a.totalHoursWorked || 8), 0);

    // Lates this month
    const latesThisMonth = recentAtt.filter(
      (a) => a.status === 'late' && a.date.startsWith('2026-10')
    ).length;

    // Leave balances
    const approvedLeaves = db.leaves.filter(
      (l) => l.employeeId === empId && l.status === 'approved'
    );
    const leaveBalances = db.leaveTypes.map((lt) => {
      const used = approvedLeaves
        .filter((l) => l.leaveTypeId === lt.id)
        .reduce((sum, l) => sum + l.workingDays, 0);
      return {
        id: lt.id,
        name: lt.name.toUpperCase(),
        quota: lt.yearlyQuota,
        used,
        remaining: lt.yearlyQuota === 999 ? 999 : Math.max(0, lt.yearlyQuota - used),
      };
    });

    // Last payslip
    const finalizedRuns = db.payrollRuns.filter((r) => r.status === 'finalized');
    const lastRun = finalizedRuns[finalizedRuns.length - 1];
    const lastPayslip = lastRun?.items.find((i) => i.employeeId === empId);

    res.json({
      employee: emp,
      todayAttendance: todayAtt,
      weeklyHoursWorked: Math.round(weeklyHours * 10) / 10,
      weeklyHoursTarget: 40,
      latesCount: latesThisMonth,
      leaveBalances,
      lastPayslip,
      announcements: db.announcements.slice(0, 3),
    });
  });

  // ==========================================
  // MODULE 8: AI ASSISTANT (M8)
  // ==========================================

  // Ask Assistant Chat
  app.post('/api/ai/chat', authMiddleware, async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

    const startTime = Date.now();
    try {
      const result = await handleAIChat(db, req.user!, prompt);
      const executionTimeMs = Date.now() - startTime;

      // Log in ai_logs table per guardrail requirements
      db.aiLogs.unshift({
        id: 'ailog-' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: req.user!.id,
        userRole: req.user!.role,
        prompt,
        toolUsed: result.toolUsed,
        response: result.text,
        executionTimeMs,
      });

      if (db.aiLogs.length > 200) db.aiLogs = db.aiLogs.slice(0, 200);
      saveDatabase(db);

      res.json({
        success: true,
        response: result.text,
        toolUsed: result.toolUsed,
        aiGenerated: true,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'AI assistant error: ' + (err.message || 'Service timed out'),
        aiGenerated: true,
      });
    }
  });

  // Dashboard AI Summarize
  app.post('/api/ai/summarize', authMiddleware, async (req: Request, res: Response) => {
    const { kpis } = req.body;
    try {
      const bullets = await summarizeDashboardKPIs(kpis || {}, req.user!.role);
      res.json({ success: true, bullets, aiGenerated: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate AI summary' });
    }
  });

  // Smart Leave NLP Extraction
  app.post('/api/ai/smart-leave', authMiddleware, async (req: Request, res: Response) => {
    const { sentence } = req.body;
    if (!sentence) return res.status(400).json({ error: 'Sentence is required.' });

    try {
      const parsed = await parseSmartLeave(sentence, db.leaveTypes);
      res.json({ success: true, parsed, aiGenerated: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to parse leave sentence' });
    }
  });

  // ==========================================
  // MODULE 9: COMMS & AUDIT LOGS
  // ==========================================

  // Announcements
  app.get('/api/announcements', authMiddleware, (req: Request, res: Response) => {
    res.json(db.announcements);
  });

  app.post('/api/announcements', authMiddleware, requireRole(['admin', 'hr']), (req: Request, res: Response) => {
    const { title, content, priority = 'normal', targetDepartmentId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const ann = {
      id: 'ann-' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      authorId: req.user!.id,
      authorName: req.user!.name,
      authorRole: req.user!.role,
      targetDepartmentId,
      priority,
      createdAt: new Date().toISOString(),
    };

    db.announcements.unshift(ann);

    addAuditLog(db, {
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'create',
      entity: 'announcement',
      entityId: ann.id,
      summary: `Published company announcement: "${ann.title}".`,
    });

    saveDatabase(db);
    res.json({ success: true, announcement: ann });
  });

  app.delete('/api/announcements/:id', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    db.announcements = db.announcements.filter((a) => a.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Notifications
  app.get('/api/notifications', authMiddleware, (req: Request, res: Response) => {
    const myNotifs = db.notifications.filter(
      (n) => n.userId === req.user!.id || n.userId === req.user!.employeeId
    );
    res.json(myNotifs);
  });

  app.post('/api/notifications/:id/read', authMiddleware, (req: Request, res: Response) => {
    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (notif) {
      notif.read = true;
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  // Audit Logs (Admin Only)
  app.get('/api/audit-logs', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
    res.json(db.auditLogs);
  });

  // ==========================================
  // FRONTEND INTEGRATION: VITE DEV / PRODUCTION STATIC
  // ==========================================

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HCM Lite Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal: Failed to start HCM Lite server:', err);
});
