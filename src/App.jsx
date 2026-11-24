import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './components/common/Toast'
import AppLayout from './components/layout/AppLayout'
import Loader from './components/common/Loader'
import { useAuth } from './hooks/useAuth'

// Lazy-loaded pages
const Login = React.lazy(() => import('./pages/Login'))
const Register = React.lazy(() => import('./pages/Register'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Groups = React.lazy(() => import('./pages/Groups'))
const GroupDetails = React.lazy(() => import('./pages/GroupDetails'))
const Settlements = React.lazy(() => import('./pages/Settlements'))
const Reports = React.lazy(() => import('./pages/Reports'))
const Settings = React.lazy(() => import('./pages/Settings'))
const NotFound = React.lazy(() => import('./pages/NotFound'))

/**
 * Route protection wrapper.
 * Displays a loader while session restores, redirects to /login if unauthenticated.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader fullPage text="Checking session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * Main application entry component.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <Suspense fallback={<Loader fullPage text="Loading CampusKite..." />}>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Application Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Groups />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups/:groupId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <GroupDetails />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settlements"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Settlements />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Reports />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Settings />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Redirects & 404 */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
