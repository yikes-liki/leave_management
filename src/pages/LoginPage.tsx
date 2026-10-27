import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Briefcase, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { showToast } from '@/components/Toast'

export default function LoginPage() {
  const { signIn, profile, loading, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      showToast(error, 'error')
    } else {
      showToast('Welcome back!', 'success')
      // Determine destination from email for demo mode; real mode relies on profile role
      const isAdminDemo = email.startsWith('admin')
      navigate(isAdminDemo ? '/admin' : '/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#0f172a 50%,#0c1a2e 100%)' }}>
        {/* Glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent)' }} />
        <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#3b82f6,transparent)' }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}>
            <Briefcase size={20} color="white" />
          </div>
          <span className="font-bold text-white text-xl">LeaveSync</span>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}>
            <Sparkles size={12} />
            Streamlined Leave Management
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage leaves<br />
            <span className="gradient-text">effortlessly.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            A modern, role-based system for employees to apply for leave and admins to manage requests — all in one place.
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 flex flex-col gap-3">
          {[
            { emoji: '📅', text: 'Apply in seconds with real-time balance' },
            { emoji: '✅', text: 'Instant approval workflow for admins' },
            { emoji: '📊', text: 'Analytics and insights at a glance' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-base">{f.emoji}</span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}>
              <Briefcase size={18} color="white" />
            </div>
            <span className="font-bold text-white text-lg">LeaveSync</span>
          </div>

          <div className="glass p-8 animate-scale-in">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm mb-7">Sign in to your account</p>

            {/* Demo hint */}
            {!isConfigured && (
              <div className="p-3 rounded-xl mb-6 text-xs"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                <p className="font-semibold mb-1">🎭 Demo Mode (Supabase not configured)</p>
                <p className="text-amber-300/70">Employee: <strong>employee@demo.com</strong> / <strong>demo</strong></p>
                <p className="text-amber-300/70">Admin: <strong>admin@demo.com</strong> / <strong>demo</strong></p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    className="input pl-9"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    id="password"
                    type="password"
                    className="input pl-9"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="login-btn"
                className="btn btn-primary w-full mt-2"
                disabled={submitting || loading}
              >
                {submitting
                  ? <><div className="spinner" />Signing in…</>
                  : <>Sign In <ArrowRight size={15} /></>
                }
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            &copy; {new Date().getFullYear()} LeaveSync. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
