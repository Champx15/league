import { Link } from 'react-router-dom'
import FixtureBoard from '../components/FixtureBoard'
import { SeamArc } from '../components/Seam'
import { useTrialSessions } from '../hooks/useTrialSessions'
import { league } from '../config/league'
import '../styles/home.css'

export default function Home() {
  const { sessions, status, errorMessage, reload } = useTrialSessions()
  const hasTrials = status === 'ready' && sessions.length > 0

  return (
    <>
      <section className="hero">
        <SeamArc className="hero__seam" />
        <div className="shell hero__inner">
          <div>
            <p className="hero__status">
              {status === 'loading' && 'Checking trial dates'}
              {status === 'error' && 'Registration is open'}
              {status === 'ready' &&
                (hasTrials
                  ? `Registration is open for ${sessions.length} ${
                      sessions.length === 1 ? 'trial' : 'trials'
                    }`
                  : 'Registration opens with the next trial dates')}
            </p>

            <h1 className="hero__title">
              <span>{league.hero.headline}</span>
            </h1>
            <div className="hero__rule" />
            <p className="hero__text">{league.hero.subhead}</p>

            <div className="hero__actions">
              <Link className="btn" to="/registration">
                Register now
              </Link>
              <a className="btn btn--ghost" href="#how-it-works">
                How registration works
              </a>
            </div>
          </div>

          <FixtureBoard
            sessions={sessions}
            status={status}
            errorMessage={errorMessage}
            onRetry={reload}
          />
        </div>
      </section>

      <section className="band" aria-labelledby="about-heading">
        <div className="shell band__grid">
          <h2 className="section-title" id="about-heading">
            About the league
          </h2>
          <div className="band__body">
            {league.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="trial-heading">
        <div className="shell band__grid">
          <h2 className="section-title" id="trial-heading">
            On trial day
          </h2>
          <div className="band__body">
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '10px' }}>
              {league.trialNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="band" id="how-it-works" aria-labelledby="how-heading">
        <div className="shell">
          <h2 className="section-title" id="how-heading" style={{ marginBottom: '36px' }}>
            How registration works
          </h2>
          <ol className="steps">
            <li>
              <h3>Fill the form</h3>
              <p>
                Player details, parent details, where you play from, and what you bowl or bat. It takes
                about three minutes.
              </p>
            </li>
            <li>
              <h3>Pick your trial</h3>
              <p>
                Choose the city and date you can attend from the scheduled trials. One registration covers
                one trial.
              </p>
            </li>
            <li>
              <h3>Save your Player ID</h3>
              <p>
                You get an ID as soon as you submit. Bring it to the ground on trial day along with a photo
                ID.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="shell closing">
        <h2 className="section-title">Ready to put your name down?</h2>
        <Link className="btn" to="/registration">
          Register now
        </Link>
      </section>
    </>
  )
}
