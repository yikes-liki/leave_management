// Context types and mock data for when Supabase is not configured.
import type { Profile, LeaveBalance, LeaveRequest, AdminDashboardStats } from '@/types/leave'

export const MOCK_ADMIN: Profile = {
  id: 'admin-001',
  full_name: 'Admin User',
  email: 'admin@company.com',
  role: 'admin',
  created_at: '2026-01-01T00:00:00Z',
}

export const MOCK_EMPLOYEE: Profile = {
  id: 'emp-001',
  full_name: 'Jane Smith',
  email: 'jane@company.com',
  role: 'employee',
  created_at: '2026-01-01T00:00:00Z',
}

export const MOCK_BALANCES: LeaveBalance[] = [
  { id: 'b1', employee_id: 'emp-001', leave_type: 'casual', total_days: 12, used_days: 3, available_days: 9, updated_at: '2026-10-01T00:00:00Z' },
  { id: 'b2', employee_id: 'emp-001', leave_type: 'sick',   total_days: 10, used_days: 1, available_days: 9, updated_at: '2026-10-01T00:00:00Z' },
  { id: 'b3', employee_id: 'emp-001', leave_type: 'earned', total_days: 15, used_days: 5, available_days: 10, updated_at: '2026-10-01T00:00:00Z' },
]

export const MOCK_REQUESTS: LeaveRequest[] = [
  {
    id: 'req-001', employee_id: 'emp-001', leave_type: 'casual',
    start_date: '2026-11-04', end_date: '2026-11-05', total_days: 2,
    reason: 'Family function', status: 'pending',
    admin_comment: null, reviewed_by: null, reviewed_at: null, cancelled_at: null,
    created_at: '2026-10-20T09:00:00Z', updated_at: '2026-10-20T09:00:00Z',
  },
  {
    id: 'req-002', employee_id: 'emp-001', leave_type: 'sick',
    start_date: '2026-10-10', end_date: '2026-10-10', total_days: 1,
    reason: 'Not feeling well', status: 'approved',
    admin_comment: 'Get well soon!', reviewed_by: 'admin-001', reviewed_at: '2026-10-09T14:00:00Z', cancelled_at: null,
    created_at: '2026-10-09T08:00:00Z', updated_at: '2026-10-09T14:00:00Z',
  },
  {
    id: 'req-003', employee_id: 'emp-001', leave_type: 'earned',
    start_date: '2026-09-15', end_date: '2026-09-19', total_days: 5,
    reason: 'Annual vacation', status: 'approved',
    admin_comment: null, reviewed_by: 'admin-001', reviewed_at: '2026-09-14T10:00:00Z', cancelled_at: null,
    created_at: '2026-09-12T11:00:00Z', updated_at: '2026-09-14T10:00:00Z',
  },
  {
    id: 'req-004', employee_id: 'emp-001', leave_type: 'casual',
    start_date: '2026-08-20', end_date: '2026-08-20', total_days: 1,
    reason: 'Personal work', status: 'rejected',
    admin_comment: 'Critical deadline this week', reviewed_by: 'admin-001', reviewed_at: '2026-08-19T09:00:00Z', cancelled_at: null,
    created_at: '2026-08-18T08:00:00Z', updated_at: '2026-08-19T09:00:00Z',
  },
]

export const MOCK_ADMIN_STATS: AdminDashboardStats = {
  total_employees: 12,
  requests: { total: 47, pending: 5, approved: 32, rejected: 7, cancelled: 3 },
  by_type: [
    { leave_type: 'casual', requests: 18, approved_days: 36 },
    { leave_type: 'sick',   requests: 14, approved_days: 16 },
    { leave_type: 'earned', requests: 15, approved_days: 67 },
  ],
  monthly: [
    { month: '2026-05', requests: 6,  approved_days: 14 },
    { month: '2026-06', requests: 8,  approved_days: 18 },
    { month: '2026-07', requests: 10, approved_days: 22 },
    { month: '2026-08', requests: 7,  approved_days: 15 },
    { month: '2026-09', requests: 9,  approved_days: 24 },
    { month: '2026-10', requests: 7,  approved_days: 26 },
  ],
}

// All employee requests for admin view
export const MOCK_ALL_REQUESTS = [
  ...MOCK_REQUESTS,
  {
    id: 'req-005', employee_id: 'emp-002', leave_type: 'sick' as const,
    start_date: '2026-11-01', end_date: '2026-11-02', total_days: 2,
    reason: 'Medical appointment', status: 'pending' as const,
    admin_comment: null, reviewed_by: null, reviewed_at: null, cancelled_at: null,
    created_at: '2026-10-25T10:00:00Z', updated_at: '2026-10-25T10:00:00Z',
    employee: { id: 'emp-002', full_name: 'Bob Johnson', email: 'bob@company.com' },
  },
  {
    id: 'req-006', employee_id: 'emp-003', leave_type: 'earned' as const,
    start_date: '2026-11-10', end_date: '2026-11-14', total_days: 5,
    reason: 'Annual leave', status: 'pending' as const,
    admin_comment: null, reviewed_by: null, reviewed_at: null, cancelled_at: null,
    created_at: '2026-10-24T11:00:00Z', updated_at: '2026-10-24T11:00:00Z',
    employee: { id: 'emp-003', full_name: 'Alice Wang', email: 'alice@company.com' },
  },
]
