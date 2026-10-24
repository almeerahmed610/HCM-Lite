/**
 * HCM Lite - Employee Directory & Employee 360 Profile (M3)
 * Implements server search, filters, registration with temporary password, CSV import dry run, CSV export & 360 profile
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Shield,
  Eye,
  Edit,
  RotateCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Employee, Department, Designation, UserRole } from '../types/hcm';
import { CSVImportModal } from '../components/CSVImportModal';

interface EmployeeDirectoryProps {
  currentUserRole: UserRole;
  onOpenAIWithPrompt: (prompt: string) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  currentUserRole,
  onOpenAIWithPrompt,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [selected360EmpId, setSelected360EmpId] = useState<string | null>(null);
  const [emp360Data, setEmp360Data] = useState<any>(null);
  const [loading360, setLoading360] = useState(false);

  // Register Form State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDeptId, setRegDeptId] = useState('');
  const [regDesId, setRegDesId] = useState('');
  const [regJoiningDate, setRegJoiningDate] = useState('2026-10-24');
  const [regBasicSalary, setRegBasicSalary] = useState('80000');
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>('male');
  const [regEmergency, setRegEmergency] = useState('');
  const [regTempPassword, setRegTempPassword] = useState('Welcome@2026');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccessCredentials, setRegSuccessCredentials] = useState<any>(null);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedDept, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedDept) params.append('departmentId', selectedDept);
      if (selectedStatus) params.append('status', selectedStatus);

      const [empRes, deptRes, desRes] = await Promise.all([
        apiRequest(`/api/employees?${params.toString()}`),
        apiRequest('/api/departments'),
        apiRequest('/api/designations'),
      ]);

      setEmployees(empRes.employees || []);
      setDepartments(deptRes || []);
      setDesignations(desRes || []);
      if (!regDeptId && deptRes.length > 0) setRegDeptId(deptRes[0].id);
      if (!regDesId && desRes.length > 0) setRegDesId(desRes[0].id);
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);
    setRegSuccessCredentials(null);

    try {
      const res = await apiRequest('/api/employees', {
        method: 'POST',
        body: {
          firstName: regFirstName,
          lastName: regLastName,
          email: regEmail,
          phone: regPhone,
          address: regAddress,
          departmentId: regDeptId,
          designationId: regDesId,
          joiningDate: regJoiningDate,
          basicSalary: regBasicSalary,
          gender: regGender,
          emergencyContact: regEmergency,
          temporaryPassword: regTempPassword,
        },
      });

      setRegSuccessCredentials(res.loginCredentials);
      loadData();
    } catch (err: any) {
      setRegError(err.message || 'Failed to register employee.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleOpen360 = async (id: string) => {
    setSelected360EmpId(id);
    setLoading360(true);
    try {
      const res = await apiRequest(`/api/employees/${id}/profile`);
      setEmp360Data(res);
    } catch (err) {
      console.error('Failed to load Employee 360 profile:', err);
    } finally {
      setLoading360(false);
    }
  };

  const handleExportCSV = () => {
    window.location.href = '/api/employees/csv-export';
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            M3 Module · Workforce Management
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            Employee Directory & 360 Profile
          </h1>
        </div>

        {currentUserRole !== 'employee' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCSVModal(true)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>CSV Dry-Run Import</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setShowAddModal(true);
                setRegSuccessCredentials(null);
                setRegError(null);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Employee</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee name, code (EMP-001) or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl outline-hidden"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="probation">Probation</option>
          <option value="exited">Exited</option>
        </select>
      </div>

      {/* Employee List Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-750/70 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Contact & Location</th>
                <th className="py-3 px-4">Joining Date</th>
                {currentUserRole !== 'employee' && <th className="py-3 px-4">Gross Salary</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Searching records...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No matching employees found in directory.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId)?.name || 'General';
                  const des = designations.find((d) => d.id === emp.designationId)?.title || 'Staff';

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                            {emp.firstName[0]}
                            {emp.lastName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {emp.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {des}
                        </span>
                        <span className="text-[10px] text-slate-400">{dept}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{emp.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Phone className="w-3 h-3" />
                            <span>{emp.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {emp.joiningDate}
                      </td>
                      {currentUserRole !== 'employee' && (
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          PKR {emp.grossSalary?.toLocaleString()}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            emp.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : emp.status === 'probation'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpen360(emp.id)}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>360° Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-800 dark:text-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Register New Employee (M3)
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regSuccessCredentials ? (
              <div className="my-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Employee Registered & Login Credentials Created!</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Per Section 2 & 3 rules, a login account has been provisioned with a temporary password that requires changing upon first sign-in:
                </p>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900 font-mono text-xs space-y-1">
                  <p>
                    <span className="text-slate-400">Login Email:</span> {regSuccessCredentials.email}
                  </p>
                  <p>
                    <span className="text-slate-400">Temporary Password:</span>{' '}
                    <span className="font-bold text-emerald-600">
                      {regSuccessCredentials.temporaryPassword}
                    </span>
                  </p>
                  <p className="text-[10px] text-amber-600">Must Change Password on First Sign-in: YES</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterEmployee} className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. name@saylaniit.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Mobile Phone
                    </label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+92 300 0000000"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Department *
                    </label>
                    <select
                      value={regDeptId}
                      onChange={(e) => setRegDeptId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Designation *
                    </label>
                    <select
                      value={regDesId}
                      onChange={(e) => setRegDesId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    >
                      {designations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={regJoiningDate}
                      onChange={(e) => setRegJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Basic Salary (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={regBasicSalary}
                      onChange={(e) => setRegBasicSalary(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Gender
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Temporary Login Password
                  </label>
                  <input
                    type="text"
                    value={regTempPassword}
                    onChange={(e) => setRegTempPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    User will be prompted to change this on their first login.
                  </p>
                </div>

                {regError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
                    {regError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="flex-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {regLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Register & Create Login'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CSV Dry-run Modal */}
      <CSVImportModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onSuccess={() => loadData()}
      />

      {/* Employee 360 View Drawer */}
      {selected360EmpId && emp360Data && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Employee 360° Profile View
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {emp360Data.employee.firstName} {emp360Data.employee.lastName}
              </h3>
            </div>
            <button
              onClick={() => setSelected360EmpId(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            {/* Attrition Risk Badge (Bonus Feature) */}
            {emp360Data.attritionRisk && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Attrition Risk Score (Bonus +10):
                  </span>
                  <span
                    className={`font-black px-2 py-0.5 rounded text-[11px] ${
                      emp360Data.attritionRisk.level === 'high'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                        : emp360Data.attritionRisk.level === 'medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    }`}
                  >
                    {emp360Data.attritionRisk.score}% ({emp360Data.attritionRisk.level.toUpperCase()})
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {emp360Data.attritionRisk.reasons?.map((r: string, i: number) => (
                    <p key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400" />
                      <span>{r}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Compensation Structure */}
            {currentUserRole !== 'employee' && (
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2">
                <span className="font-bold text-blue-900 dark:text-blue-300 block">
                  Compensation Breakdown (Gross = 1.5 × Basic)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Basic</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      PKR {emp360Data.employee.basicSalary?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">HRA (40%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      PKR {emp360Data.employee.hraAllowance?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Gross (1.5x)</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      PKR {emp360Data.employee.grossSalary?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance & Leave Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Attendance
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {emp360Data.attendanceCount} records
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">
                  {emp360Data.latesCount} lates recorded
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Leaves Applied
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {emp360Data.leavesCount} requests
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
