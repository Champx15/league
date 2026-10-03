import { Link } from 'react-router-dom'
import { SeamArc } from '../components/Seam'
import { league } from '../config/league'
import '../styles/home.css'

export default function Home() {
  return (
    <>
      <section className="hero">
        <SeamArc className="hero__seam" />
        <div className="shell hero__inner">
          <div>
            <p className="hero__status">
              Registration is open
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
              <h3>Stay in touch</h3>
              <p>
                The league will follow up with next steps using the contact details you provide.
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
