import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { AssistantPage } from '@/pages/AssistantPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HelpPage } from '@/pages/HelpPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PrescriptionsPage } from '@/pages/PrescriptionsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RecordsPage } from '@/pages/RecordsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignupPage } from '@/pages/SignupPage'
import { WellnessPage } from '@/pages/WellnessPage'
import { DoctorOverviewPage } from '@/pages/doctor/DoctorOverviewPage'
import { DoctorPatientsPage } from '@/pages/doctor/DoctorPatientsPage'
import { DoctorPatientDetailPage } from '@/pages/doctor/DoctorPatientDetailPage'
import { DoctorAppointmentsPage } from '@/pages/doctor/DoctorAppointmentsPage'
import { DoctorRequestsPage } from '@/pages/doctor/DoctorRequestsPage'
import { DoctorReportsPage } from '@/pages/doctor/DoctorReportsPage'
import { DoctorPrescriptionsPage } from '@/pages/doctor/DoctorPrescriptionsPage'

/** Authenticated area: mounts the data provider + app shell. */
function ProtectedLayout() {
  const { isAuthenticated, session } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    // Keying on the account forces the data layer to re-read every scoped
    // collection when the signed-in user changes (e.g. a second tab switches
    // accounts), so one account's data can never leak into another's view.
    <DataProvider key={session?.userId ?? 'anonymous'}>
      <AppLayout />
    </DataProvider>
  )
}

/** Redirects already-authenticated users away from the sign-in screen. */
function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, session } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={session?.role === 'doctor' ? '/doctor' : '/'} replace />
  }
  return <>{children}</>
}

export default function App() {
  // The signed-in route tree depends on the account role: patients get the
  // personal health workspace, doctors get the separate practice portal.
  // NOTE: these must be real <Route> elements (or fragments of them) — React
  // Router only understands <Route>/<Fragment> children, not custom components.
  const { session } = useAuth()
  const isDoctor = session?.role === 'doctor'

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <SignupPage />
          </PublicOnly>
        }
      />

      <Route path="/" element={<ProtectedLayout />}>
        {isDoctor ? (
          <>
            <Route index element={<Navigate to="/doctor" replace />} />
            <Route path="doctor" element={<DoctorOverviewPage />} />
            <Route path="doctor/patients" element={<DoctorPatientsPage />} />
            <Route path="doctor/patients/:patientId" element={<DoctorPatientDetailPage />} />
            <Route path="doctor/requests" element={<DoctorRequestsPage />} />
            <Route path="doctor/reports" element={<DoctorReportsPage />} />
            <Route path="doctor/prescriptions" element={<DoctorPrescriptionsPage />} />
            <Route path="doctor/appointments" element={<DoctorAppointmentsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="doctor/*" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/doctor" replace />} />
          </>
        ) : (
          <>
            <Route index element={<DashboardPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="prescriptions" element={<PrescriptionsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="wellness" element={<WellnessPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </>
        )}
      </Route>
    </Routes>
  )
}