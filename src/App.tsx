import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ToastContainer } from '@/components/Toast'

import LoginPage           from '@/pages/LoginPage'
import EmployeeDashboard   from '@/pages/EmployeeDashboard'
import MyLeavesPage        from '@/pages/MyLeavesPage'
import ApplyLeavePage      from '@/pages/ApplyLeavePage'
import AdminDashboard      from '@/pages/AdminDashboard'
import AdminRequestsPage   from '@/pages/AdminRequestsPage'
import AdminEmployeesPage  from '@/pages/AdminEmployeesPage'
import AdminSettingsPage   from '@/pages/AdminSettingsPage'
import NotFoundPage        from '@/pages/NotFoundPage'

function RootRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Employee */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="employee"><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/my-leaves" element={
        <ProtectedRoute requiredRole="employee"><MyLeavesPage /></ProtectedRoute>
      } />
      <Route path="/apply" element={
        <ProtectedRoute requiredRole="employee"><ApplyLeavePage /></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/requests" element={
        <ProtectedRoute requiredRole="admin"><AdminRequestsPage /></ProtectedRoute>
      } />
      <Route path="/admin/employees" element={
        <ProtectedRoute requiredRole="admin"><AdminEmployeesPage /></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute requiredRole="admin"><AdminSettingsPage /></ProtectedRoute>
      } />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  )
}
