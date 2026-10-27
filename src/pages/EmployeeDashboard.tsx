import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, CalendarDays, Clock, CheckCircle, XCircle, FileText, Loader } from 'lucide-react'
import Layout, { PageHeader, StatCard, BalanceCard, StatusBadge, EmptyState, SkeletonRows } from '@/components/Layout'
import { ConfirmModal } from '@/components/Layout'
import { useMyBalances, useMyRequests, useCancelLeave } from '@/hooks/useLeave'
import { useAuth } from '@/context/AuthContext'
import { LEAVE_TYPE_LABELS } from '@/types/leave'
import type { LeaveRequest } from '@/types/leave'
import { showToast } from '@/components/Toast'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function RequestRow({ req, onCancel, cancelLoadingId }: {
  req: LeaveRequest
  onCancel: (id: string) => void
  cancelLoadingId: string | null
}) {
  const canCancel = req.status === 'pending' || (req.status === 'approved' && new Date(req.start_date) > new Date())
  const isCancelling = cancelLoadingId === req.id

  return (
    <tr className="animate-fade-in">
      <td>
        <span className="font-medium text-slate-200">{LEAVE_TYPE_LABELS[req.leave_type]}</span>
      </td>
      <td>{formatDate(req.start_date)}</td>
      <td>{formatDate(req.end_date)}</td>
      <td>
        <span className="font-semibold text-white">{req.total_days}d</span>
      </td>
      <td><StatusBadge status={req.status} /></td>
      <td>
        {req.admin_comment
          ? <span className="text-xs text-slate-400 italic max-w-[140px] block truncate" title={req.admin_comment}>"{req.admin_comment}"</span>
          : <span className="text-slate-600 text-xs">—</span>
        }
      </td>
      <td>
        {canCancel && (
          <button
            onClick={() => onCancel(req.id)}
            disabled={!!cancelLoadingId}
            className="btn btn-xs btn-danger"
            id={`cancel-req-${req.id}`}
          >
            {isCancelling ? <div className="spinner" style={{ width: '0.75rem', height: '0.75rem' }} /> : <XCircle size={12} />}
            Cancel
          </button>
        )}
      </td>
    </tr>
  )
}

export default function EmployeeDashboard() {
  const { profile } = useAuth()
  const { balances, loading: balLoading } = useMyBalances()
  const { requests, loading: reqLoading, refresh } = useMyRequests()
  const { cancel, loading: cancelLoading } = useCancelLeave()
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)

  const pending   = requests.filter(r => r.status === 'pending').length
  const approved  = requests.filter(r => r.status === 'approved').length
  const totalUsed = balances.reduce((s, b) => s + b.used_days, 0)
  const totalAvail= balances.reduce((s, b) => s + b.available_days, 0)

  const balanceColors: ('blue' | 'green' | 'violet')[] = ['blue', 'green', 'violet']

  const handleConfirmCancel = async () => {
    if (!confirmCancel) return
    const { error } = await cancel(confirmCancel)
    setConfirmCancel(null)
    if (error) showToast(error, 'error')
    else { showToast('Leave request cancelled', 'info'); refresh() }
  }

  return (
    <Layout>
      <PageHeader
        title={`Hello, ${profile?.full_name?.split(' ')[0]} 👋`}
        subtitle="Here's your leave overview"
        action={
          <Link to="/apply" className="btn btn-primary" id="apply-leave-btn">
            <PlusCircle size={16} />Apply Leave
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Available Days"   value={totalAvail} icon={CalendarDays} color="blue"  sub="across all types" />
        <StatCard label="Days Used"        value={totalUsed}  icon={Clock}        color="violet" sub="this year" />
        <StatCard label="Pending"          value={pending}    icon={Clock}        color="amber"  sub="awaiting review" />
        <StatCard label="Approved"         value={approved}   icon={CheckCircle}  color="green"  sub="total approved" />
      </div>

      {/* Balance cards */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Leave Balances</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {balLoading
          ? [0,1,2].map(i => <div key={i} className="skeleton h-36" />)
          : balances.map((b, i) => (
            <BalanceCard
              key={b.id}
              label={LEAVE_TYPE_LABELS[b.leave_type]}
              total={b.total_days}
              used={b.used_days}
              available={b.available_days}
              color={balanceColors[i % 3]}
            />
          ))
        }
      </div>

      {/* Recent requests */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Recent Requests</h2>
        <Link to="/my-leaves" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</Link>
      </div>
      <div className="glass overflow-hidden">
        {reqLoading ? (
          <SkeletonRows count={3} />
        ) : requests.length === 0 ? (
          <EmptyState icon={FileText} title="No leave requests yet" description="Click 'Apply Leave' to submit your first request." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th>Comment</th><th></th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 5).map(r => (
                  <RequestRow key={r.id} req={r} onCancel={setConfirmCancel} cancelLoadingId={cancelLoading} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmCancel && (
        <ConfirmModal
          title="Cancel Leave Request"
          message="Are you sure you want to cancel this leave request? This action cannot be undone."
          confirmLabel="Yes, Cancel It"
          onConfirm={handleConfirmCancel}
          onCancel={() => setConfirmCancel(null)}
          loading={!!cancelLoading}
        />
      )}
    </Layout>
  )
}
