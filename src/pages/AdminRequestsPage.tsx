import React, { useState } from 'react'
import { CheckCircle, XCircle, Filter, FileText, MessageSquare } from 'lucide-react'
import Layout, { PageHeader, StatusBadge, EmptyState, SkeletonRows } from '@/components/Layout'
import { useAllRequests, useReviewLeave } from '@/hooks/useLeave'
import { LEAVE_TYPE_LABELS, LEAVE_TYPES, LEAVE_STATUSES } from '@/types/leave'
import type { LeaveType, LeaveStatus, LeaveFilters, LeaveRequest } from '@/types/leave'
import { showToast } from '@/components/Toast'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ReviewModal({
  req, onClose, onDone,
}: {
  req: LeaveRequest & { employee?: { id: string; full_name: string; email: string } }
  onClose: () => void
  onDone: () => void
}) {
  const { review, loading } = useReviewLeave()
  const [comment, setComment] = useState('')
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)

  const handleSubmit = async () => {
    if (!decision) return
    const { error } = await review(req.id, decision, comment || undefined)
    if (error) showToast(error, 'error')
    else {
      showToast(`Request ${decision} successfully`, 'success')
      onDone()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Review Leave Request</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all">
            <XCircle size={18} />
          </button>
        </div>

        {/* Request details */}
        <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.1)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-white">{req.employee?.full_name ?? 'Employee'}</p>
              <p className="text-xs text-slate-400">{req.employee?.email}</p>
            </div>
            <StatusBadge status={req.status} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
            <div><p className="text-slate-600 mb-0.5">Type</p><p className="text-slate-200 font-medium">{LEAVE_TYPE_LABELS[req.leave_type]}</p></div>
            <div><p className="text-slate-600 mb-0.5">Duration</p><p className="text-slate-200 font-medium">{req.total_days}d</p></div>
            <div><p className="text-slate-600 mb-0.5">Dates</p><p className="text-slate-200 font-medium">{formatDate(req.start_date)} – {formatDate(req.end_date)}</p></div>
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}>
            <p className="text-xs text-slate-500 mb-1">Reason</p>
            <p className="text-sm text-slate-300">{req.reason}</p>
          </div>
        </div>

        {/* Decision buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setDecision('approved')}
            className={`btn flex-1 ${decision === 'approved' ? 'btn-success' : 'btn-secondary'}`}
          >
            <CheckCircle size={15} />Approve
          </button>
          <button
            onClick={() => setDecision('rejected')}
            className={`btn flex-1 ${decision === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
          >
            <XCircle size={15} />Reject
          </button>
        </div>

        {/* Comment */}
        <div className="mb-5">
          <label><MessageSquare size={12} className="inline mr-1" />Admin comment (optional)</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Leave a note for the employee…"
            value={comment}
            maxLength={1000}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button className="btn btn-secondary flex-1" onClick={onClose} disabled={!!loading}>Cancel</button>
          <button
            className={`btn flex-1 ${decision === 'approved' ? 'btn-success' : decision === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleSubmit}
            disabled={!decision || !!loading}
            id="confirm-review-btn"
          >
            {loading ? <><div className="spinner" />Processing…</> : `Confirm ${decision ?? 'Decision'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminRequestsPage() {
  const [filters, setFilters] = useState<LeaveFilters>({ status: 'pending' })
  const { requests, loading, refresh } = useAllRequests(filters)
  const [reviewReq, setReviewReq] = useState<(typeof requests)[0] | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const activeFiltersCount = [filters.leaveType, filters.status].filter(Boolean).length

  return (
    <Layout>
      <PageHeader
        title="Leave Requests"
        subtitle="Review and manage all employee leave requests"
        action={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-secondary ${activeFiltersCount ? 'text-blue-400 border-blue-500/40' : ''}`}
          >
            <Filter size={15} />Filters {activeFiltersCount ? `(${activeFiltersCount})` : ''}
          </button>
        }
      />

      {/* Filters */}
      {showFilters && (
        <div className="glass p-5 mb-5 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label>Status</label>
              <select
                className="input"
                value={filters.status ?? 'all'}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value === 'all' ? undefined : e.target.value as LeaveStatus }))}
              >
                <option value="all">All statuses</option>
                {LEAVE_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label>Leave Type</label>
              <select
                className="input"
                value={filters.leaveType ?? 'all'}
                onChange={e => setFilters(f => ({ ...f, leaveType: e.target.value === 'all' ? undefined : e.target.value as LeaveType }))}
              >
                <option value="all">All types</option>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => setFilters({ status: 'pending' })} className="btn btn-secondary btn-sm w-full">
                Reset to Pending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass overflow-hidden">
        {loading ? (
          <SkeletonRows count={6} />
        ) : requests.length === 0 ? (
          <EmptyState icon={FileText} title="No requests found" description="Try adjusting your filters." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} className="animate-fade-in">
                    <td>
                      <div>
                        <p className="font-medium text-slate-200">{(req as any).employee?.full_name ?? 'Employee'}</p>
                        <p className="text-xs text-slate-500">{(req as any).employee?.email}</p>
                      </div>
                    </td>
                    <td><span className="text-slate-300">{LEAVE_TYPE_LABELS[req.leave_type]}</span></td>
                    <td className="whitespace-nowrap text-xs text-slate-400">{formatDate(req.start_date)} → {formatDate(req.end_date)}</td>
                    <td><span className="font-semibold text-white">{req.total_days}d</span></td>
                    <td><span className="text-xs text-slate-400 max-w-[120px] block truncate" title={req.reason}>{req.reason}</span></td>
                    <td><StatusBadge status={req.status} /></td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">{formatDate(req.created_at)}</td>
                    <td>
                      {req.status === 'pending' ? (
                        <button
                          onClick={() => setReviewReq(req)}
                          className="btn btn-xs btn-primary"
                          id={`review-${req.id}`}
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">
                          {req.admin_comment ? `"${req.admin_comment.slice(0,20)}…"` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewReq && (
        <ReviewModal
          req={reviewReq}
          onClose={() => setReviewReq(null)}
          onDone={() => { setReviewReq(null); refresh() }}
        />
      )}
    </Layout>
  )
}
