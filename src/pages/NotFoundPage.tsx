import React from 'react'
import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
      <div className="text-center px-6">
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-xl font-bold text-white">Page Not Found</p>
        </div>
        <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          <Home size={16} />Go Home
        </Link>
      </div>
    </div>
  )
}
