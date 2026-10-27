import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import type { AdminDashboardStats } from '@/types/leave'
import { LEAVE_TYPE_LABELS } from '@/types/leave'

const PIE_COLORS = ['#3b82f6', '#10b981', '#7c3aed']
const AREA_GRADIENT_ID = 'areaGrad'

const customTooltipStyle = {
  background: '#1e293b',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.875rem',
  color: '#e2e8f0',
  fontSize: '0.8125rem',
}

export function LeaveByTypeChart({ data }: { data: AdminDashboardStats['by_type'] }) {
  const chartData = data.map(d => ({
    name: LEAVE_TYPE_LABELS[d.leave_type],
    Requests: d.requests,
    'Approved Days': d.approved_days,
  }))

  return (
    <div className="glass p-5 animate-fade-in">
      <h3 className="font-semibold text-white mb-4">Leaves by Type</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barGap={4} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
          <Bar dataKey="Requests"       fill="#3b82f6" radius={[4,4,0,0]} />
          <Bar dataKey="Approved Days"  fill="#10b981" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MonthlyTrendChart({ data }: { data: AdminDashboardStats['monthly'] }) {
  const chartData = data.map(d => ({
    month: d.month.slice(5), // MM
    Requests: d.requests,
    'Approved Days': d.approved_days,
  }))

  return (
    <div className="glass p-5 animate-fade-in">
      <h3 className="font-semibold text-white mb-4">Monthly Trend (last 6 months)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={customTooltipStyle} />
          <Area type="monotone" dataKey="Requests"       stroke="#3b82f6" strokeWidth={2} fill="url(#grad1)" dot={false} />
          <Area type="monotone" dataKey="Approved Days"  stroke="#10b981" strokeWidth={2} fill="url(#grad2)" dot={false} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: '#94a3b8', fontSize: '0.75rem' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LeaveDistributionPie({ data }: { data: AdminDashboardStats['by_type'] }) {
  const chartData = data.map(d => ({ name: LEAVE_TYPE_LABELS[d.leave_type], value: d.requests }))
  return (
    <div className="glass p-5 animate-fade-in">
      <h3 className="font-semibold text-white mb-4">Request Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
            paddingAngle={4} dataKey="value" strokeWidth={0}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={customTooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: '#94a3b8', fontSize: '0.75rem' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
