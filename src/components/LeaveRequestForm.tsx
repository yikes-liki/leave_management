import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, FileText, Send, X, ChevronRight } from 'lucide-react'
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from '@/types/leave'
import type { LeaveRequestInput } from '@/types/leave'
import { useSubmitLeave } from '@/hooks/useLeave'
import { useMyBalances } from '@/hooks/useLeave'
import { showToast } from '@/components/Toast'

interface Props {
  onSuccess?: () => void
  inline?: boolean // render as page content (no modal wrapper)
}

export default function LeaveRequestForm({ onSuccess, inline = false }: Props) {
  const navigate = useNavigate()
  const { submit, loading } = useSubmitLeave()
  const { balances } = useMyBalances()

  const [form, setForm] = useState<LeaveRequestInput>({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveRequestInput, string>>>({})

  const today = new Date().toISOString().split('T')[0]

  const selectedBalance = balances.find(b => b.leave_type === form.leave_type)

  const workingDays = (() => {
    if (!form.start_date || !form.end_date) return 0
    const start = new Date(form.start_date)
    const end = new Date(form.end_date)
    if (end < start) return 0
    let count = 0
    const cur = new Date(start)
    while (cur <= end) {
      const day = cur.getDay()
      if (day !== 0 && day !== 6) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  })()

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.start_date) e.start_date = 'Start date is required'
    if (!form.end_date)   e.end_date   = 'End date is required'
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      e.end_date = 'End date must be on or after start date'
    }
    if (form.reason.trim().length < 3) e.reason = 'Reason must be at least 3 characters'
    if (form.reason.trim().length > 1000) e.reason = 'Reason must be 1000 characters or fewer'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const { error } = await submit(form)
    if (error) {
      showToast(error, 'error')
    } else {
      showToast('Leave request submitted successfully!', 'success')
      if (onSuccess) onSuccess()
      else navigate('/my-leaves')
    }
  }

  const leaveTypeColors = { casual: 'blue', sick: 'green', earned: 'violet' } as const

  const content = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Leave type selector */}
      <div>
        <label>Leave Type</label>
        <div className="grid grid-cols-3 gap-2">
          {LEAVE_TYPES.map(type => {
            const colors = {
              casual: { active: 'rgba(59,130,246,0.2)', border: '#3b82f6', text: '#60a5fa' },
              sick:   { active: 'rgba(52,211,153,0.2)', border: '#10b981', text: '#34d399' },
              earned: { active: 'rgba(167,139,250,0.2)',border: '#7c3aed', text: '#a78bfa' },
            }
            const c = colors[type]
            const isSelected = form.leave_type === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, leave_type: type }))}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: isSelected ? c.active : 'rgba(15,23,42,0.6)',
                  border: `1px solid ${isSelected ? c.border : 'rgba(148,163,184,0.15)'}`,
                  color: isSelected ? c.text : '#94a3b8',
                }}
              >
                <p className="text-xs font-bold">{LEAVE_TYPE_LABELS[type].split(' ')[0]}</p>
                <p className="text-xs opacity-70 mt-0.5">{LEAVE_TYPE_LABELS[type].split(' ')[1] ?? ''}</p>
              </button>
            )
          })}
        </div>
        {selectedBalance && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <CalendarDays size={12} />
            <span>{selectedBalance.available_days} days available of {selectedBalance.total_days} total</span>
          </div>
        )}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date">Start Date</label>
          <input
            id="start_date"
            type="date"
            className={`input ${errors.start_date ? 'border-red-500' : ''}`}
            value={form.start_date}
            min={today}
            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
          />
          {errors.start_date && <p className="text-xs text-red-400 mt-1">{errors.start_date}</p>}
        </div>
        <div>
          <label htmlFor="end_date">End Date</label>
          <input
            id="end_date"
            type="date"
            className={`input ${errors.end_date ? 'border-red-500' : ''}`}
            value={form.end_date}
            min={form.start_date || today}
            onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
          />
          {errors.end_date && <p className="text-xs text-red-400 mt-1">{errors.end_date}</p>}
        </div>
      </div>

      {/* Working days preview */}
      {workingDays > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm animate-fade-in"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <CalendarDays size={15} className="text-blue-400 shrink-0" />
          <span className="text-blue-300">
            <strong>{workingDays} working day{workingDays !== 1 ? 's' : ''}</strong> selected (excluding weekends)
          </span>
        </div>
      )}

      {/* Reason */}
      <div>
        <label htmlFor="reason">Reason <span className="text-slate-600">({form.reason.length}/1000)</span></label>
        <textarea
          id="reason"
          className={`input ${errors.reason ? 'border-red-500' : ''}`}
          placeholder="Please describe the reason for your leave…"
          value={form.reason}
          maxLength={1000}
          rows={3}
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
        />
        {errors.reason && <p className="text-xs text-red-400 mt-1">{errors.reason}</p>}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn btn-primary flex-1" disabled={loading} id="submit-leave-btn">
          {loading ? <><div className="spinner" />Submitting…</> : <><Send size={15} />Submit Request</>}
        </button>
        {!inline && (
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )

  if (inline) return content

  return (
    <div className="max-w-lg mx-auto">
      <div className="glass p-7 animate-scale-in">
        <div className="flex items-center gap-3 mb-7">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <FileText size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">Apply for Leave</h2>
            <p className="text-xs text-slate-400">Fill in the details to submit your request</p>
          </div>
        </div>
        {content}
      </div>
    </div>
  )
}
