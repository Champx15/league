import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="shell page">
      <header className="page__head">
        <h1 className="page__title">Page not found</h1>
      </header>
      <div className="prose">
        <p>That page does not exist. Registration and trial dates are both a click away.</p>
      </div>
      <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
        <Link className="btn" to="/registration">
          Register now
        </Link>
        <Link className="btn btn--ghost" to="/">
          Back to home
        </Link>
      </div>
    </div>
  )
}
