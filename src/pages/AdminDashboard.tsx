import React from 'react'
import { Users, FileText, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import Layout, { PageHeader, StatCard, SkeletonRows } from '@/components/Layout'
import { LeaveByTypeChart, MonthlyTrendChart, LeaveDistributionPie } from '@/components/Charts'
import { useAdminStats, useAllRequests } from '@/hooks/useLeave'
import { StatusBadge } from '@/components/Layout'
import { LEAVE_TYPE_LABELS } from '@/types/leave'
import { Link } from 'react-router-dom'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats()
  const { requests, loading: reqLoading } = useAllRequests({ status: 'pending' })

  return (
    <Layout>
      <PageHeader
        title="Admin Dashboard"
        subtitle="System-wide leave management overview"
        action={
          <Link to="/admin/requests" className="btn btn-primary" id="view-all-requests-btn">
            <FileText size={15} />View All Requests
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
        {statsLoading ? (
          Array.from({length:5}).map((_,i) => <div key={i} className="skeleton h-28" />)
        ) : stats ? (
          <>
            <StatCard label="Employees"  value={stats.total_employees}       icon={Users}        color="blue" />
            <StatCard label="Total"      value={stats.requests.total}         icon={FileText}     color="violet" />
            <StatCard label="Pending"    value={stats.requests.pending}       icon={Clock}        color="amber" />
            <StatCard label="Approved"   value={stats.requests.approved}      icon={CheckCircle}  color="green" />
            <StatCard label="Rejected"   value={stats.requests.rejected}      icon={XCircle}      color="red" />
          </>
        ) : null}
      </div>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
          <div className="lg:col-span-2">
            <MonthlyTrendChart data={stats.monthly} />
          </div>
          <LeaveDistributionPie data={stats.by_type} />
        </div>
      )}
      {stats && (
        <div className="mb-7">
          <LeaveByTypeChart data={stats.by_type} />
        </div>
      )}

      {/* Pending requests */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          Pending Requests
          {requests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {requests.length}
            </span>
          )}
        </h2>
        <Link to="/admin/requests" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Manage all →</Link>
      </div>
      <div className="glass overflow-hidden">
        {reqLoading ? (
          <SkeletonRows count={3} />
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-slate-500 text-sm">
            <CheckCircle size={28} className="mb-2 text-emerald-500/50" />
            All caught up! No pending requests.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Employee</th><th>Type</th><th>Duration</th><th>Days</th><th>Status</th><th>Submitted</th><th></th></tr>
              </thead>
              <tbody>
                {requests.slice(0, 5).map(req => (
                  <tr key={req.id}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-200">{(req as any).employee?.full_name ?? 'Employee'}</p>
                        <p className="text-xs text-slate-500">{(req as any).employee?.email}</p>
                      </div>
                    </td>
                    <td><span className="text-slate-200">{LEAVE_TYPE_LABELS[req.leave_type]}</span></td>
                    <td className="whitespace-nowrap text-xs text-slate-400">{formatDate(req.start_date)} → {formatDate(req.end_date)}</td>
                    <td><span className="font-semibold text-white">{req.total_days}d</span></td>
                    <td><StatusBadge status={req.status} /></td>
                    <td className="text-xs text-slate-500">{formatDate(req.created_at)}</td>
                    <td>
                      <Link to="/admin/requests" className="btn btn-xs btn-secondary">Review</Link>
                    </td>
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
