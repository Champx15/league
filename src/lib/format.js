// Formats a Postgres `date` (YYYY-MM-DD) as "12 October 2026" without
// letting the browser timezone shift the day.
export function formatTrialDate(value) {
  if (!value) return ''
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return String(value)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

// Postgres `time`/`timetz` values arrive as "08:00:00". Plain text is passed
// through untouched so the league can store "8:00 AM" if it prefers.
export function formatReportingTime(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const match = raw.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return raw

  const hours = Number(match[1])
  const minutes = match[2]
  if (Number.isNaN(hours) || hours > 23) return raw

  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHours}:${minutes} ${suffix}`
}

export function formatSessionSummary(session) {
  if (!session) return ''
  return [
    session.city,
    formatTrialDate(session.trial_date),
    session.venue,
    session.reporting_time ? `Reporting ${formatReportingTime(session.reporting_time)}` : '',
  ]
    .filter(Boolean)
    .join(', ')
}
