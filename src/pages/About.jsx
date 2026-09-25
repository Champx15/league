import { Link } from 'react-router-dom'
import { league } from '../config/league'

export default function About() {
  return (
    <div className="shell page">
      <header className="page__head">
        <h1 className="page__title">About us</h1>
        <p className="lede" style={{ marginTop: '14px' }}>
          Full league information is still being put together. Here is what is confirmed so far.
        </p>
      </header>

      <div className="prose">
        {league.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          Registration for the season trials is open now, and everything a player needs for trial day is
          listed on the home page.
        </p>
      </div>

      <div className="notice">
        <h2>Still to be published</h2>
        <ul>
          <li>League format, age categories and team list</li>
          <li>Season calendar and match venues</li>
          <li>Selection process after the trials</li>
          <li>Rules, fees and player eligibility</li>
        </ul>
      </div>

      <div style={{ marginTop: '40px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
        <Link className="btn" to="/registration">
          Register now
        </Link>
        <Link className="btn btn--ghost" to="/">
          See trial dates
        </Link>
      </div>
    </div>
  )
}
