import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, PlusCircle, Settings,
  Users, LogOut, ChevronRight, Briefcase, Menu, X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { showToast } from '@/components/Toast'

const employeeNav = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-leaves',        icon: FileText,         label: 'My Leaves' },
  { to: '/apply',            icon: PlusCircle,       label: 'Apply Leave' },
]
const adminNav = [
  { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/requests',   icon: FileText,         label: 'Leave Requests' },
  { to: '/admin/employees',  icon: Users,            label: 'Employees' },
  { to: '/admin/settings',   icon: Settings,         label: 'Settings' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, signOut, switchDemoRole, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const nav = isAdmin ? adminNav : employeeNav

  const handleSignOut = async () => {
    await signOut()
    showToast('Signed out successfully', 'info')
    navigate('/login')
  }

  const initials = (profile?.full_name ?? '??')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const Sidebar = () => (
    <aside
      className="flex flex-col h-full"
      style={{ background: 'rgba(15,23,42,0.98)', borderRight: '1px solid rgba(148,163,184,0.1)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}>
          <Briefcase size={18} color="white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none">LeaveSync</p>
          <p className="text-xs text-slate-500 mt-0.5">{isAdmin ? 'Admin Panel' : 'Employee Portal'}</p>
        </div>
      </div>

      <div className="px-3 mb-2">
        <div className="h-px" style={{ background: 'rgba(148,163,184,0.1)' }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/dashboard'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={17} className="nav-icon shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Demo mode switcher */}
      {!isConfigured && (
        <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <p className="text-xs font-semibold text-amber-400 mb-2">Demo Mode</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => { switchDemoRole('employee'); navigate('/dashboard') }}
              className={`btn btn-xs flex-1 ${!isAdmin ? 'btn-primary' : 'btn-secondary'}`}
            >Employee</button>
            <button
              onClick={() => { switchDemoRole('admin'); navigate('/admin') }}
              className={`btn btn-xs flex-1 ${isAdmin ? 'btn-primary' : 'btn-secondary'}`}
            >Admin</button>
          </div>
        </div>
      )}

      {/* User section */}
      <div className="px-3 pb-4">
        <div className="h-px mb-3" style={{ background: 'rgba(148,163,184,0.1)' }} />
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl"
          style={{ background: 'rgba(30,41,59,0.6)' }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{profile?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-60 shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 flex flex-col z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-blue-400" />
            <span className="font-bold text-white text-sm">LeaveSync</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}

// Reusable page header
export function PageHeader({ title, subtitle, action }: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-7">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// Stat card component
export function StatCard({
  label, value, icon: Icon, color = 'blue', sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color?: 'blue' | 'green' | 'amber' | 'red' | 'violet'
  sub?: string
}) {
  const colors = {
    blue:   { icon: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.2)' },
    green:  { icon: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.2)' },
    amber:  { icon: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.2)' },
    red:    { icon: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.2)' },
    violet: { icon: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.2)' },
  }
  const c = colors[color]

  return (
    <div className="glass p-5 stat-card animate-fade-in" style={{ '--tw-ring-color': c.border } as React.CSSProperties}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <Icon size={20} style={{ color: c.icon }} />
        </div>
      </div>
    </div>
  )
}

// Leave balance card
export function BalanceCard({ label, total, used, available, color }: {
  label: string; total: number; used: number; available: number
  color: 'blue' | 'green' | 'violet'
}) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0
  const colors = {
    blue:   { bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
    green:  { bar: 'linear-gradient(90deg,#10b981,#34d399)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#34d399' },
    violet: { bar: 'linear-gradient(90deg,#7c3aed,#a78bfa)', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', text: '#a78bfa' },
  }
  const c = colors[color]

  return (
    <div className="glass p-5 animate-fade-in" style={{ borderColor: c.border }}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-slate-200">{label}</p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
          {available} left
        </span>
      </div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-3xl font-bold text-white">{available}</p>
          <p className="text-xs text-slate-500">of {total} days available</p>
        </div>
        <p className="text-sm text-slate-400">{used} used</p>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(148,163,184,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: c.bar }}
        />
      </div>
    </div>
  )
}

// Status badge
export function StatusBadge({ status }: { status: string }) {
  const dots: Record<string, string> = {
    pending:   '🟡',
    approved:  '🟢',
    rejected:  '🔴',
    cancelled: '⚪',
  }
  return (
    <span className={`badge badge-${status}`}>
      <span>{dots[status] ?? '⚪'}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Empty state
export function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-2xl mb-4" style={{ background: 'rgba(51,65,85,0.4)' }}>
        <Icon size={32} className="text-slate-500" />
      </div>
      <p className="font-semibold text-slate-300">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>}
    </div>
  )
}

// Skeleton rows
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

// Generic confirm modal
export function ConfirmModal({
  title, message, confirmLabel, confirmClass = 'btn-danger',
  onConfirm, onCancel, loading,
}: {
  title: string; message: string; confirmLabel: string; confirmClass?: string
  onConfirm: () => void; onCancel: () => void; loading?: boolean
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm} disabled={loading}>
            {loading ? <><div className="spinner" />Processing…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Chevron right for breadcrumbs/rows
export { ChevronRight }
