import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminPlayers } from '../lib/api'
import '../styles/admin.css'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 250

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getStatusClass(status) {
  const cleaned = String(status || '').trim().toUpperCase()

  if (cleaned.includes('PAID') || cleaned === 'SUCCESS') return 'admin-badge admin-badge--paid'
  if (cleaned.includes('PENDING') || cleaned.includes('INIT')) return 'admin-badge admin-badge--pending'
  return 'admin-badge admin-badge--unpaid'
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [players, setPlayers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput.trim())
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  useEffect(() => {
    let active = true

    async function loadPlayers() {
      setLoading(true)
      setError('')

      try {
        const data = await getAdminPlayers({
          page,
          limit: PAGE_SIZE,
          search: searchTerm,
        })

        if (!active) return

        setPlayers(data.players || [])
        setPagination(data.pagination || null)
      } catch (requestError) {
        if (!active) return

        if (requestError?.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }

        setPlayers([])
        setPagination(null)
        setError(requestError?.message || 'Unable to load the player list.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadPlayers()

    return () => {
      active = false
    }
  }, [page, searchTerm, navigate])

  const summary = useMemo(() => {
    const counts = { paid: 0, pending: 0, unpaid: 0 }

    for (const player of players) {
      const status = String(player.payment_status || '').trim().toUpperCase()
      if (status.includes('PAID') || status === 'SUCCESS') counts.paid += 1
      else if (status.includes('PENDING')) counts.pending += 1
      else counts.unpaid += 1
    }

    return {
      total: pagination?.total ?? players.length,
      currentPage: pagination?.page ?? page,
      visible: players.length,
      paid: counts.paid,
      pending: counts.pending,
      unpaid: counts.unpaid,
    }
  }, [page, pagination, players])

  const totalPages = pagination?.totalPages || 1

  return (
    <div className="admin-shell admin-page">
      <header className="admin-header">
        <div className="admin-header__meta">
          <p className="admin-kicker">Administration</p>
          <h1 className="admin-title">Player management</h1>
        </div>
      </header>

      <section className="admin-grid" aria-label="Player overview">
        <div className="admin-card admin-stat">
          <span className="admin-stat__label">Total players</span>
          <span className="admin-stat__value">{summary.total}</span>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-stat__label">Current page</span>
          <span className="admin-stat__value">{summary.currentPage}</span>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-stat__label">On this page</span>
          <span className="admin-stat__value">{summary.visible}</span>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-stat__label">Paid</span>
          <span className="admin-stat__value">{summary.paid}</span>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-search">
            <label htmlFor="admin-player-search">Search players</label>
            <div className="admin-search__field">
              <input
                id="admin-player-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by registration ID, name or mobile"
                aria-label="Search players"
              />
              {searchInput && (
                <button type="button" className="btn btn--ghost" onClick={() => setSearchInput('')}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="admin-skeleton-table" aria-live="polite" aria-busy="true">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="admin-skeleton-row">
                {[1, 2, 3, 4, 5, 6].map((cell) => (
                  <span key={cell} className="skeleton" style={{ height: '18px' }} />
                ))}
              </div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="admin-empty">
            No players matched your search. Try a different registration ID, player name or mobile number.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Registration ID</th>
                  <th>Player</th>
                  <th>Mobile</th>
                  <th>Proficiency</th>
                  <th>State</th>
                  <th>Payment</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id}>
                    <td>{player.registration_id || '—'}</td>
                    <td>
                      <div className="admin-table__name">{player.player_name || '—'}</div>
                    </td>
                    <td>{player.player_mobile || '—'}</td>
                    <td>{Array.isArray(player.proficiency) ? player.proficiency.join(', ') || '—' : player.proficiency || '—'}</td>
                    <td>{player.state || '—'}</td>
                    <td>
                      <span className={getStatusClass(player.payment_status)}>
                        {player.payment_status || 'Unpaid'}
                      </span>
                    </td>
                    <td>{formatDate(player.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn admin-table__action"
                        onClick={() => navigate(`/admin/players/${player.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination && players.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination__controls">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </button>
            </div>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        )}
      </section>
    </div>
  )
}
