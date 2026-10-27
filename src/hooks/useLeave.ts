import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { LeaveBalance, LeaveRequest, LeaveRequestInput, LeaveFilters, AdminDashboardStats } from '@/types/leave'
import { MOCK_BALANCES, MOCK_REQUESTS, MOCK_ADMIN_STATS, MOCK_ALL_REQUESTS } from '@/lib/mockData'

// ----------- Employee hooks -----------

export function useMyBalances() {
  const { user, isConfigured } = useAuth()
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 300))
      setBalances(MOCK_BALANCES)
      setLoading(false)
      return
    }
    const { data, error: e } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', user?.id)
      .order('leave_type')
    if (e) setError(e.message)
    else setBalances((data ?? []) as LeaveBalance[])
    setLoading(false)
  }, [user?.id, isConfigured])

  useEffect(() => { fetch() }, [fetch])
  return { balances, loading, error, refresh: fetch }
}

export function useMyRequests(filters?: LeaveFilters) {
  const { user, isConfigured } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 400))
      let items = MOCK_REQUESTS
      if (filters?.leaveType && filters.leaveType !== 'all') items = items.filter(r => r.leave_type === filters.leaveType)
      if (filters?.status && filters.status !== 'all') items = items.filter(r => r.status === filters.status)
      setRequests(items)
      setLoading(false)
      return
    }
    let q = supabase.from('leave_requests').select('*').eq('employee_id', user?.id)
    if (filters?.leaveType && filters.leaveType !== 'all') q = q.eq('leave_type', filters.leaveType)
    if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)
    if (filters?.from) q = q.gte('start_date', filters.from)
    if (filters?.to) q = q.lte('end_date', filters.to)
    q = q.order('created_at', { ascending: false })
    const { data, error: e } = await q
    if (e) setError(e.message)
    else setRequests((data ?? []) as LeaveRequest[])
    setLoading(false)
  }, [user?.id, isConfigured, filters?.leaveType, filters?.status, filters?.from, filters?.to])

  useEffect(() => { fetch() }, [fetch])
  return { requests, loading, error, refresh: fetch }
}

export function useSubmitLeave() {
  const { isConfigured } = useAuth()
  const [loading, setLoading] = useState(false)

  const submit = async (input: LeaveRequestInput): Promise<{ error: string | null }> => {
    setLoading(true)
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 600))
      setLoading(false)
      // Simulate success
      return { error: null }
    }
    const { error } = await supabase.rpc('submit_leave_request', {
      p_leave_type: input.leave_type,
      p_start_date: input.start_date,
      p_end_date:   input.end_date,
      p_reason:     input.reason,
    })
    setLoading(false)
    return { error: error?.message ?? null }
  }

  return { submit, loading }
}

export function useCancelLeave() {
  const { isConfigured } = useAuth()
  const [loading, setLoading] = useState<string | null>(null) // loading = request id being cancelled

  const cancel = async (requestId: string): Promise<{ error: string | null }> => {
    setLoading(requestId)
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 500))
      setLoading(null)
      return { error: null }
    }
    const { error } = await supabase.rpc('cancel_leave_request', { p_request_id: requestId })
    setLoading(null)
    return { error: error?.message ?? null }
  }

  return { cancel, loading }
}

// ----------- Admin hooks -----------

export function useAllRequests(filters?: LeaveFilters) {
  const { isAdmin, isConfigured } = useAuth()
  const [requests, setRequests] = useState<(LeaveRequest & { employee?: { id: string; full_name: string; email: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    setError(null)
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 400))
      let items = MOCK_ALL_REQUESTS as typeof requests
      if (filters?.leaveType && filters.leaveType !== 'all') items = items.filter(r => r.leave_type === filters.leaveType)
      if (filters?.status && filters.status !== 'all') items = items.filter(r => r.status === filters.status)
      setRequests(items)
      setLoading(false)
      return
    }
    let q = supabase.from('leave_requests').select('*, employee:profiles!employee_id(id, full_name, email)')
    if (filters?.leaveType && filters.leaveType !== 'all') q = q.eq('leave_type', filters.leaveType)
    if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)
    q = q.order('created_at', { ascending: false })
    const { data, error: e } = await q
    if (e) setError(e.message)
    else setRequests((data ?? []) as typeof requests)
    setLoading(false)
  }, [isAdmin, isConfigured, filters?.leaveType, filters?.status])

  useEffect(() => { fetch() }, [fetch])
  return { requests, loading, error, refresh: fetch }
}

export function useReviewLeave() {
  const { isConfigured } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const review = async (requestId: string, decision: 'approved' | 'rejected', comment?: string): Promise<{ error: string | null }> => {
    setLoading(requestId)
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 600))
      setLoading(null)
      return { error: null }
    }
    const { error } = await supabase.rpc('review_leave_request', {
      p_request_id: requestId,
      p_decision: decision,
      p_comment: comment ?? null,
    })
    setLoading(null)
    return { error: error?.message ?? null }
  }

  return { review, loading }
}

export function useAdminStats() {
  const { isAdmin, isConfigured } = useAuth()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    setError(null)
    if (!isConfigured) {
      await new Promise(r => setTimeout(r, 400))
      setStats(MOCK_ADMIN_STATS)
      setLoading(false)
      return
    }
    const { data, error: e } = await supabase.rpc('admin_dashboard_stats')
    if (e) setError(e.message)
    else setStats(data as AdminDashboardStats)
    setLoading(false)
  }, [isAdmin, isConfigured])

  useEffect(() => { fetch() }, [fetch])
  return { stats, loading, error, refresh: fetch }
}
