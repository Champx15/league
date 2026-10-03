import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Registration from './pages/Registration'
import NotFound from './pages/NotFound'
import AdminLoginPage from './pages/AdminLogin'
import AdminDashboardPage from './pages/AdminDashboard'
import AdminPlayerDetailPage from './pages/AdminPlayerDetail'
import { adminSessionActive } from './lib/api'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AdminRouteGuard() {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        await adminSessionActive()
        if (!active) return
        setAuthenticated(true)
      } catch {
        if (!active) return
        setAuthenticated(false)
      } finally {
        if (active) {
          setChecking(false)
        }
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [])

  if (checking) {
    return (
      <div className="admin-shell admin-page">
        <div className="admin-card admin-stat">
          <span className="admin-stat__label">Access</span>
          <span className="admin-stat__value">Checking admin session…</span>
        </div>
      </div>
    )
  }

  return authenticated ? <AdminDashboardPage /> : <Navigate to="/admin/login" replace />
}

export default function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/admin" element={<AdminRouteGuard />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/players/:id" element={<AdminPlayerDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </>
  )
}
