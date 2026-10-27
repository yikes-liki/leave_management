import React from 'react'
import { Settings, Calendar, Globe, Clock, Shield } from 'lucide-react'
import Layout, { PageHeader } from '@/components/Layout'

// Static settings display — in a real app these would be fetched from leave_settings table
export default function AdminSettingsPage() {
  return (
    <Layout>
      <PageHeader
        title="Settings"
        subtitle="System-wide leave policy configuration"
      />

      <div className="max-w-2xl flex flex-col gap-5">
        {/* Leave policy */}
        <div className="glass p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Calendar size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Leave Policy</h3>
              <p className="text-xs text-slate-400">Default entitlements per year</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Casual Leave',  days: 12, desc: 'Short personal or planned time off',   color: '#60a5fa' },
              { label: 'Sick Leave',    days: 10, desc: 'Illness or medical appointments',       color: '#34d399' },
              { label: 'Earned Leave',  days: 15, desc: 'Accrued annual leave',                  color: '#a78bfa' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.08)' }}>
                <div>
                  <p className="font-medium text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <span className="text-2xl font-bold" style={{ color: item.color }}>{item.days}d</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="glass p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <Shield size={18} className="text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Validation Rules</h3>
              <p className="text-xs text-slate-400">Business rules applied to all requests</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Exclude weekends from leave count',  value: 'Enabled',   on: true },
              { label: 'Exclude public holidays',            value: 'Enabled',   on: true },
              { label: 'Allow negative balance',             value: 'Disabled',  on: false },
              { label: 'Max days per single request',        value: '30 days',   on: true },
              { label: 'Sick leave backdate allowed',        value: '7 days',    on: true },
            ].map(rule => (
              <div key={rule.label} className="flex items-center justify-between py-2.5 px-1"
                style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                <p className="text-sm text-slate-300">{rule.label}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  rule.on
                    ? 'text-emerald-400 bg-emerald-400/10'
                    : 'text-red-400 bg-red-400/10'
                }`}>{rule.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div className="glass p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <Globe size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">System Timezone</h3>
              <p className="text-xs text-slate-400">Used for date calculations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <Clock size={16} className="text-amber-400" />
            <span className="font-medium text-slate-200">UTC</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 text-center pb-4">
          Settings are managed via database configuration. Contact your system administrator to modify these values.
        </p>
      </div>
    </Layout>
  )
}
