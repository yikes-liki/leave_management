import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastQueue: ((t: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = 'info') {
  toastQueue.forEach(fn => fn({ id: Date.now().toString(), message, type }))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000)
    }
    toastQueue.push(handler)
    return () => { toastQueue = toastQueue.filter(fn => fn !== handler) }
  }, [])

  const icons = { success: CheckCircle, error: XCircle, info: Info }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div key={t.id} className={`toast toast-${t.type} animate-slide-in`}>
            <Icon size={16} className="shrink-0" />
            <span>{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
