import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Field from '../components/Field'
import { adminLogin, adminSessionActive } from '../lib/api'
import '../styles/admin.css'

const EMPTY_FORM = { email: '', password: '' }

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        await adminSessionActive()
        if (active) {
          navigate('/admin', { replace: true })
        }
      } catch {
        if (active) {
          setCheckingSession(false)
        }
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [navigate])

  function handleFieldChange(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  function validate() {
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid work email.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)

    try {
      await adminLogin({
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/admin', { replace: true })
    } catch (error) {
      const apiMessage = error?.status === 401 ? 'Invalid email or password.' : error?.message
      setSubmitError(apiMessage || 'Unable to sign in right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="admin-shell admin-page admin-loginshell">
        <div className="admin-card admin-card--login">
          <p className="admin-kicker">League administration</p>
          <div className="admin-loading" aria-live="polite">
            Checking your admin session…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell admin-page admin-loginshell">
      <div className="admin-card admin-card--login">
        <p className="admin-kicker">League administration</p>
        <h1>Admin sign in</h1>
        <p className="admin-login__intro">
          Use your approved league account to access player management.
        </p>

        {submitError && (
          <p className="admin-alert" role="alert">
            {submitError}
          </p>
        )}

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <Field id="admin-email" label="Email address" required error={errors.email}>
            {({ describedBy, invalid }) => (
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                disabled={isSubmitting}
              />
            )}
          </Field>

          <Field id="admin-password" label="Password" required error={errors.password}>
            {({ describedBy, invalid }) => (
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => handleFieldChange('password', event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                disabled={isSubmitting}
              />
            )}
          </Field>

          <button type="submit" className="btn btn--block" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
