import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAdminPlayerById } from '../lib/api'
import '../styles/admin.css'

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function getStatusClass(status) {
  const cleaned = String(status || '').trim().toUpperCase()

  if (cleaned.includes('PAID') || cleaned === 'SUCCESS') return 'admin-badge admin-badge--paid'
  if (cleaned.includes('PENDING') || cleaned.includes('INIT')) return 'admin-badge admin-badge--pending'
  return 'admin-badge admin-badge--unpaid'
}

export default function AdminPlayerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadPlayer() {
      setLoading(true)
      setError('')

      try {
        const data = await getAdminPlayerById(id)
        if (!active) return
        setPlayer(data.player || null)
      } catch (requestError) {
        if (!active) return

        if (requestError?.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }

        setError(
          requestError?.status === 404
            ? 'This player record could not be found.'
            : requestError?.message || 'Unable to load the player details.'
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadPlayer()

    return () => {
      active = false
    }
  }, [id, navigate])

  const detailRows = useMemo(() => {
    if (!player) return []

    return [
      ['Registration ID', player.registration_id],
      ['Player name', player.player_name],
      ['Date of birth', formatDate(player.date_of_birth)],
      ['State', player.state],
      ['Category', player.category],
      ['Proficiency', displayValue(player.proficiency)],
      ['Player mobile', player.player_mobile],
      ['Email', player.email],
      ['Father name', player.father_name],
      ['Mother name', player.mother_name],
      ['Father mobile', player.father_mobile],
      ['Aadhaar number', player.aadhaar_number],
      ['Pincode', player.pincode],
      ['Address', player.full_address],
      ['Payment status', player.payment_status],
      ['Payment completed', formatDate(player.payment_completed_at)],
      ['Razorpay order ID', player.razorpay_order_id],
      ['Razorpay payment ID', player.razorpay_payment_id],
      ['Created at', formatDate(player.created_at)],
      ['Updated at', formatDate(player.updated_at)],
    ].filter(([, value]) => value !== null && value !== undefined && value !== '')
  }, [player])

  const extraFields = useMemo(() => {
    if (!player) return []

    const ignored = new Set([
      'id',
      'registration_id',
      'player_name',
      'date_of_birth',
      'category',
      'proficiency',
      'state',
      'player_mobile',
      'email',
      'father_name',
      'mother_name',
      'father_mobile',
      'aadhaar_number',
      'pincode',
      'full_address',
      'payment_status',
      'payment_completed_at',
      'razorpay_order_id',
      'razorpay_payment_id',
      'created_at',
      'updated_at',
    ])

    return Object.entries(player).filter(([key, value]) => !ignored.has(key) && value !== null && value !== undefined && value !== '')
  }, [player])

  if (loading) {
    return (
      <div className="admin-shell admin-page">
        <div className="admin-detail-header">
          <div className="admin-detail-header__top">
            <div className="admin-detail-header__meta">
              <p className="admin-kicker">Administration</p>
              <div className="skeleton" style={{ width: '280px', height: '36px' }} />
            </div>
            <div className="skeleton" style={{ width: '110px', height: '38px' }} />
          </div>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-section">
            <div className="admin-skeleton-table">
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <div key={row} className="admin-skeleton-row">
                  <span className="skeleton" style={{ height: '18px' }} />
                  <span className="skeleton" style={{ height: '18px' }} />
                </div>
              ))}
            </div>
          </div>
          <div className="admin-detail-section">
            <div className="admin-skeleton-table">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="admin-skeleton-row">
                  <span className="skeleton" style={{ height: '18px' }} />
                  <span className="skeleton" style={{ height: '18px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="admin-shell admin-page">
        <div className="admin-detail-empty">
          {error || 'Player not found.'}
          <div style={{ marginTop: '18px' }}>
            <Link className="btn btn--ghost" to="/admin">
              Back to players
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell admin-page">
      <div className="admin-detail-header">
        <div className="admin-detail-header__top">
          <div className="admin-detail-header__meta">
            <p className="admin-kicker">Administration</p>
            <h1>{player.player_name || 'Player details'}</h1>
            <span>{player.registration_id || 'Registration pending'}</span>
          </div>
          <div className="admin-header__actions">
            <Link className="btn btn--ghost" to="/admin">
              Back to players
            </Link>
            <span className={getStatusClass(player.payment_status)}>
              {player.payment_status || 'Unpaid'}
            </span>
          </div>
        </div>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      <div className="admin-detail-grid">
        <section className="admin-detail-section" aria-label="Player summary">
          <h2>Player identity</h2>
          <div className="admin-detail-list">
            {detailRows.map(([label, value]) => (
              <div key={label} className="admin-detail-row">
                <div className="admin-detail-row__label">{label}</div>
                <div className="admin-detail-row__value">{displayValue(value)}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="admin-detail-section" aria-label="Player payment and registration details">
          <h2>Registration overview</h2>
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <div className="admin-detail-row__label">Payment status</div>
              <div className="admin-detail-row__value">
                <span className={getStatusClass(player.payment_status)}>
                  {player.payment_status || 'Unpaid'}
                </span>
              </div>
            </div>
            <div className="admin-detail-row">
              <div className="admin-detail-row__label">Created</div>
              <div className="admin-detail-row__value">{formatDate(player.created_at)}</div>
            </div>
            <div className="admin-detail-row">
              <div className="admin-detail-row__label">Updated</div>
              <div className="admin-detail-row__value">{formatDate(player.updated_at)}</div>
            </div>
            <div className="admin-detail-row">
              <div className="admin-detail-row__label">Player mobile</div>
              <div className="admin-detail-row__value">{displayValue(player.player_mobile)}</div>
            </div>
            <div className="admin-detail-row">
              <div className="admin-detail-row__label">Email</div>
              <div className="admin-detail-row__value">{displayValue(player.email)}</div>
            </div>
          </div>
        </aside>
      </div>

      {extraFields.length > 0 && (
        <section className="admin-detail-section" aria-label="Additional player details">
          <h2>Additional details</h2>
          <div className="admin-detail-list">
            {extraFields.map(([key, value]) => (
              <div key={key} className="admin-detail-row">
                <div className="admin-detail-row__label">{key.replace(/_/g, ' ')}</div>
                <div className="admin-detail-row__value">{displayValue(value)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
