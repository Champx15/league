import { formatReportingTime, formatTrialDate } from '../lib/format'

function dayParts(value) {
  const [year, month, day] = String(value ?? '').slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return { day: '—', month: '' }
  const date = new Date(Date.UTC(year, month - 1, day))
  return {
    day: String(day).padStart(2, '0'),
    month: new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' }).format(date),
  }
}

export default function FixtureBoard({ sessions, status, errorMessage, onRetry, limit = 4 }) {
  const shown = sessions.slice(0, limit)
  const remaining = sessions.length - shown.length

  return (
    <section className="board" aria-labelledby="fixtures-heading">
      <div className="board__head">
        <h2 className="board__title" id="fixtures-heading">
          Trial schedule
        </h2>
        {status === 'ready' && sessions.length > 0 && (
          <span className="board__count">
            {sessions.length} {sessions.length === 1 ? 'trial' : 'trials'}
          </span>
        )}
      </div>

      {status === 'loading' && <p className="board__state">Loading trial dates…</p>}

      {status === 'error' && (
        <div className="board__state">
          <p>{errorMessage}</p>
          {onRetry && (
            <button type="button" className="btn btn--ghost" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      )}

      {status === 'ready' && sessions.length === 0 && (
        <p className="board__state">
          No trials are scheduled right now. Dates for the next round will be listed here as soon as they
          are confirmed.
        </p>
      )}

      {status === 'ready' && sessions.length > 0 && (
        <>
          <ul className="board__list">
            {shown.map((session) => {
              const parts = dayParts(session.trial_date)
              return (
                <li className="board__row" key={session.id}>
                  <p className="board__day">
                    <strong>{parts.day}</strong>
                    <span>{parts.month}</span>
                  </p>
                  <div>
                    <h3 className="board__city">{session.city}</h3>
                    <p className="board__venue">{session.venue}</p>
                    <p className="board__time">
                      {formatTrialDate(session.trial_date)}
                      {session.reporting_time
                        ? `, reporting at ${formatReportingTime(session.reporting_time)}`
                        : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
          {remaining > 0 && (
            <p className="board__foot">
              {remaining} more {remaining === 1 ? 'trial is' : 'trials are'} listed on the registration form.
            </p>
          )}
        </>
      )}
    </section>
  )
}
