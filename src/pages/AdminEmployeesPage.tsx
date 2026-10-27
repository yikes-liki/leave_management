import React from 'react'
import { Users, Mail, UserCheck, CalendarDays } from 'lucide-react'
import Layout, { PageHeader, EmptyState } from '@/components/Layout'

// Static demo employees list (real version would fetch from profiles table)
const DEMO_EMPLOYEES = [
  { id: '1', name: 'Jane Smith',    email: 'jane@company.com',  role: 'Employee',  joinDate: '2025-01-15', casual: 9, sick: 9, earned: 10 },
  { id: '2', name: 'Bob Johnson',   email: 'bob@company.com',   role: 'Employee',  joinDate: '2025-03-01', casual: 10, sick: 8, earned: 12 },
  { id: '3', name: 'Alice Wang',    email: 'alice@company.com', role: 'Employee',  joinDate: '2025-02-20', casual: 11, sick: 10, earned: 8 },
  { id: '4', name: 'Carlos Rivera', email: 'carlos@company.com',role: 'Employee',  joinDate: '2024-11-01', casual: 6,  sick: 7,  earned: 15 },
  { id: '5', name: 'Priya Patel',   email: 'priya@company.com', role: 'Employee',  joinDate: '2026-01-10', casual: 12, sick: 10, earned: 14 },
  { id: '6', name: 'Admin User',    email: 'admin@company.com', role: 'Admin',     joinDate: '2024-06-01', casual: 12, sick: 10, earned: 15 },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminEmployeesPage() {
  const employees = DEMO_EMPLOYEES
  const totalEmployees = employees.filter(e => e.role === 'Employee').length
  const totalAdmins    = employees.filter(e => e.role === 'Admin').length

  return (
    <Layout>
      <PageHeader
        title="Employees"
        subtitle="View and manage your team members"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-7">
        <div className="glass p-5 flex items-center gap-4 animate-fade-in">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalEmployees}</p>
            <p className="text-xs text-slate-400">Employees</p>
          </div>
        </div>
        <div className="glass p-5 flex items-center gap-4 animate-fade-in">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <UserCheck size={20} className="text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalAdmins}</p>
            <p className="text-xs text-slate-400">Admins</p>
          </div>
        </div>
        <div className="glass p-5 flex items-center gap-4 animate-fade-in">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <CalendarDays size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{employees.length}</p>
            <p className="text-xs text-slate-400">Total Members</p>
          </div>
        </div>
      </div>

      {/* Employees table */}
      <div className="glass overflow-hidden">
        {employees.length === 0 ? (
          <EmptyState icon={Users} title="No employees found" />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Casual Left</th>
                  <th>Sick Left</th>
                  <th>Earned Left</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="animate-fade-in">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          {emp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-200">{emp.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Mail size={12} className="shrink-0" />
                        {emp.email}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${emp.role === 'Admin' ? 'badge-approved' : 'badge-pending'}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{formatDate(emp.joinDate)}</td>
                    <td><span className="font-semibold text-blue-300">{emp.casual}d</span></td>
                    <td><span className="font-semibold text-emerald-300">{emp.sick}d</span></td>
                    <td><span className="font-semibold text-violet-300">{emp.earned}d</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
