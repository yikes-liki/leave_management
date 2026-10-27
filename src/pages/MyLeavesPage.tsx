import React, { useState } from 'react'
import { XCircle, FileText, Filter } from 'lucide-react'
import Layout, { PageHeader, StatusBadge, EmptyState, SkeletonRows, ConfirmModal } from '@/components/Layout'
import { useMyRequests, useCancelLeave } from '@/hooks/useLeave'
import { LEAVE_TYPE_LABELS, LEAVE_TYPES, LEAVE_STATUSES } from '@/types/leave'
import type { LeaveType, LeaveStatus, LeaveFilters } from '@/types/leave'
import { showToast } from '@/components/Toast'
import { Link } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyLeavesPage() {
  const [filters, setFilters] = useState<LeaveFilters>({})
  const { requests, loading, refresh } = useMyRequests(filters)
  const { cancel, loading: cancelLoading } = useCancelLeave()
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const handleCancel = async () => {
    if (!confirmCancel) return
    const { error } = await cancel(confirmCancel)
    setConfirmCancel(null)
    if (error) showToast(error, 'error')
    else { showToast('Request cancelled', 'info'); refresh() }
  }

  const activeFiltersCount = [filters.leaveType, filters.status].filter(Boolean).length

  return (
    <Layout>
      <PageHeader
        title="My Leave Requests"
        subtitle="Track all your leave applications"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-secondary ${activeFiltersCount ? 'text-blue-400 border-blue-500/40' : ''}`}
              id="filter-toggle-btn"
            >
              <Filter size={15} />
              Filters {activeFiltersCount ? `(${activeFiltersCount})` : ''}
            </button>
            <Link to="/apply" className="btn btn-primary" id="apply-leave-btn">
              <PlusCircle size={15} />Apply
            </Link>
          </div>
        }
      />

      {/* Filters */}
      {showFilters && (
        <div className="glass p-5 mb-5 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              <label>From</label>
              <input type="date" className="input" value={filters.from ?? ''} onChange={e => setFilters(f => ({ ...f, from: e.target.value || undefined }))} />
            </div>
            <div>
              <label>To</label>
              <input type="date" className="input" value={filters.to ?? ''} onChange={e => setFilters(f => ({ ...f, to: e.target.value || undefined }))} />
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button onClick={() => setFilters({})} className="btn btn-secondary btn-sm mt-3">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="glass overflow-hidden">
        {loading ? (
          <SkeletonRows count={5} />
        ) : requests.length === 0 ? (
          <EmptyState icon={FileText} title="No requests found" description="Try adjusting your filters or submit a new leave request." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Comment</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const canCancel = req.status === 'pending' || (req.status === 'approved' && new Date(req.start_date) > new Date())
                  return (
                    <tr key={req.id} className="animate-fade-in">
                      <td><span className="font-medium text-slate-200">{LEAVE_TYPE_LABELS[req.leave_type]}</span></td>
                      <td className="whitespace-nowrap">
                        <span className="text-slate-200">{formatDate(req.start_date)}</span>
                        {req.start_date !== req.end_date && (
                          <span className="text-slate-500"> → {formatDate(req.end_date)}</span>
                        )}
                      </td>
                      <td><span className="font-semibold text-white">{req.total_days}d</span></td>
                      <td><StatusBadge status={req.status} /></td>
                      <td>
                        <span className="text-xs text-slate-400 max-w-[120px] block truncate" title={req.reason}>{req.reason}</span>
                      </td>
                      <td>
                        {req.admin_comment
                          ? <span className="text-xs text-slate-400 italic max-w-[120px] block truncate" title={req.admin_comment}>"{req.admin_comment}"</span>
                          : <span className="text-slate-600 text-xs">—</span>
                        }
                      </td>
                      <td className="whitespace-nowrap text-slate-500 text-xs">{formatDate(req.created_at)}</td>
                      <td>
                        {canCancel && (
                          <button
                            onClick={() => setConfirmCancel(req.id)}
                            disabled={!!cancelLoading}
                            className="btn btn-xs btn-danger"
                            id={`cancel-${req.id}`}
                          >
                            {cancelLoading === req.id
                              ? <div className="spinner" style={{ width: '0.7rem', height: '0.7rem' }} />
                              : <XCircle size={11} />
                            }
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmCancel && (
        <ConfirmModal
          title="Cancel Leave Request"
          message="Are you sure? If this is an approved future request, the days will be added back to your balance."
          confirmLabel="Cancel Request"
          onConfirm={handleCancel}
          onCancel={() => setConfirmCancel(null)}
          loading={!!cancelLoading}
        />
      )}
    </Layout>
  )
}
