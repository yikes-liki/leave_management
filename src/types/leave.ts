// Shared domain types. They mirror the PostgreSQL schema in supabase/migrations.

export type AppRole = 'employee' | 'admin'
export type LeaveType = 'casual' | 'sick' | 'earned'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export const LEAVE_TYPES: readonly LeaveType[] = ['casual', 'sick', 'earned'] as const
export const LEAVE_STATUSES: readonly LeaveStatus[] = ['pending', 'approved', 'rejected', 'cancelled'] as const

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: 'Casual leave',
  sick: 'Sick leave',
  earned: 'Earned leave',
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export interface Profile {
  id: string
  full_name: string
  email: string
  role: AppRole
  created_at: string
}

export interface LeaveBalance {
  id: string
  employee_id: string
  leave_type: LeaveType
  total_days: number
  used_days: number
  /** total_days - used_days, computed by the database */
  available_days: number
  updated_at: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: LeaveType
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  total_days: number
  reason: string
  status: LeaveStatus
  admin_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

/** A request joined with the employee's name and email (admin views). */
export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee: Pick<Profile, 'id' | 'full_name' | 'email'>
}

export interface LeaveSettings {
  exclude_weekends: boolean
  exclude_public_holidays: boolean
  allow_negative_balance: boolean
  max_request_days: number
  sick_backdate_days: number
  timezone: string
}

export interface Holiday {
  holiday_date: string
  name: string
}

export interface AdminDashboardStats {
  total_employees: number
  requests: { total: number; pending: number; approved: number; rejected: number; cancelled: number }
  by_type: { leave_type: LeaveType; requests: number; approved_days: number }[]
  monthly: { month: string; requests: number; approved_days: number }[]
}

export interface LeaveRequestInput {
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
}

export interface LeaveFilters {
  leaveType?: LeaveType | 'all'
  status?: LeaveStatus | 'all'
  from?: string
  to?: string
}

/** SQLSTATE codes raised by our RPC functions (see migration 003). */
export const APP_ERROR_CODES = {
  validation: 'LM001',
  insufficientBalance: 'LM002',
  overlap: 'LM003',
  notAuthorized: 'LM004',
  invalidState: 'LM005',
  notFound: 'LM006',
} as const
