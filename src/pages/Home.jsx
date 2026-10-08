import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BallMark } from '../components/Seam'
import PlayerStories from '../components/PlayerStories'
import SectionHeading from '../components/SectionHeading'
import { league } from '../config/league'
import '../styles/home.css'

const trials = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  label: `Trial ${String(index + 1).padStart(2, '0')}`,
}))

const impact = [
  { value: '—', label: 'Total prize pool', note: 'Details to be published' },
  { value: '—', label: 'Trial cities', note: 'Details to be published' },
  { value: '—', label: 'Players', note: 'Details to be published' },
  { value: '—', label: 'Teams', note: 'Details to be published' },
  { value: '—', label: 'Trials', note: 'Details to be published' },
  { value: '—', label: 'Seasons', note: 'Details to be published' },
]

const faqs = [
  {
    question: 'Who can register?',
    answer:
      'Registration is open to players who meet the age, eligibility and participation requirements listed in the official registration form. Confirm the current rules before submitting.',
  },
  {
    question: 'How do the trials work?',
    answer:
      'Players submit their details through the registration flow and receive an ID. The JPL team will follow up with the trial date, venue and next steps using the provided contact details.',
  },
  {
    question: 'What is the registration fee?',
    answer:
      'Registration fee information and payment inclusions will be published alongside the official registration process.',
  },
  {
    question: 'What does the registration fee include?',
    answer:
      'The complete list of inclusions will be confirmed in the official registration information before payment.',
  },
  {
    question: 'Where are the trials held?',
    answer:
      'Trial locations and venues will be shared through the official JPL communication channels after registration.',
  },
  {
    question: 'What happens after registration?',
    answer:
      'The JPL team will follow up with registered players about the next steps, trial logistics and any required documents.',
  },
  {
    question: 'How are players selected?',
    answer:
      'The selection process and evaluation criteria will be published when the official JPL trial process is confirmed.',
  },
  {
    question: 'What happens after qualifying?',
    answer:
      'Qualified players will receive the next steps and participation information from JPL through the contact details provided during registration.',
  },
  {
    question: 'Can players from outside the region participate?',
    answer:
      'The official eligibility and travel information will be published with the JPL trial schedule.',
  },
  {
    question: 'How can I contact JPL?',
    answer:
      'Use the official contact details shown in the footer or the contact information included in the registration flow.',
  },
]

function RegisterLink({ children, className = '' }) {
  return (
    <Link className={`btn ${className}`.trim()} to="/registration">
      {children}
    </Link>
  )
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0)
  const [paused, setPaused] = useState(false)
  const trialViewportRef = useRef(null)

  const scrollTrials = (direction) => {
    const viewport = trialViewportRef.current
    if (!viewport) return

    setPaused(true)
    viewport.scrollBy({ left: direction * viewport.clientWidth * 0.72, behavior: 'smooth' })
    window.setTimeout(() => setPaused(false), 1800)
  }

  return (
    <>
      <section className="hero">
        <div className="shell hero__inner">
          <div className="hero__copy">
            <p className="hero__status">Registration is open</p>
            {/* <h1 className="hero__title">
              <span>{league.hero.headline}</span>
            </h1> */}
            <p className="hero__text">{league.hero.subhead}</p>
            <div className="hero__actions">
              <RegisterLink>Register for trials</RegisterLink>
              <a className="btn btn--ghost" href="#journey">
                See the journey
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section trials" id="trials" aria-labelledby="trials-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="Upcoming trials"
            title="Where the journey begins"
            description="Trial details will be added here as the venue and schedule are confirmed."
          />
          <div
            className={`trial-conveyor ${paused ? 'trial-conveyor--paused' : ''}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div className="trial-viewport" ref={trialViewportRef} tabIndex="0" aria-label="Upcoming JPL trials">
              <div className="trial-track">
                <div className="trial-group">
                  {trials.map((trial) => (
                    <article className="trial-card" key={trial.id} aria-label={`${trial.label} coming soon`}>
                      <div className="trial-card__content">
                        <img className="trial-card__logo" src="/jpl-logo.png" alt="JPL logo" />
                        <span>{trial.label}</span>
                        <strong>Coming Soon</strong>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="trial-group" aria-hidden="true">
                  {trials.map((trial) => (
                    <article className="trial-card" key={`duplicate-${trial.id}`}>
                      <div className="trial-card__content">
                        <img className="trial-card__logo" src="/jpl-logo.png" alt="" />
                        <span>{trial.label}</span>
                        <strong>Coming Soon</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <div className="trial-controls" aria-label="Trial conveyor controls">
              <button type="button" onClick={() => scrollTrials(-1)} aria-label="Move trials left">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button type="button" onClick={() => scrollTrials(1)} aria-label="Move trials right">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section journey" id="journey" aria-labelledby="journey-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="Path to glory"
            title="Every great journey has a starting point"
            description="A clear progression from registration to the JPL arena."
          />
          <div className="journey-line" aria-label="JPL player journey">
            {[
              ['01', 'Register', 'Complete the JPL registration and payment process.'],
              ['02', 'Attend trial', 'Turn up for the selected trial and represent your cricket.'],
              ['03', 'Selection', 'Perform through the JPL selection process.'],
              ['04', 'JPL journey', 'Selected players move into the league journey and community.'],
            ].map(([number, title, text], index) => (
              <article className="journey-step" key={number}>
                <div className="journey-step__marker"><span>{number}</span></div>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < 3 && <span className="journey-step__line" aria-hidden="true" />}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section impact" aria-labelledby="impact-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="JPL impact"
            title="A league built to move players forward"
            description="The live performance figures will be populated from confirmed JPL data."
          />
          <div className="impact-grid">
            {impact.map((item) => (
              <article className="impact-card" key={item.label}>
                <strong>{item.value}</strong>
                <h3>{item.label}</h3>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section mentors" aria-labelledby="mentors-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="JPL spotlight"
            title="Meet the people behind the game"
            description="Important coaches, selectors and cricket personalities will be introduced here."
          />
          <p className="coming-soon">Coming soon</p>
        </div>
      </section>

      <PlayerStories />

      <section className="section teams" aria-labelledby="teams-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="Official teams"
            title="The JPL team lineup"
            description="Official team names, logos and information will appear here when confirmed."
          />
          <p className="coming-soon">Coming soon</p>
        </div>
      </section>

      <section className="section gallery" aria-labelledby="gallery-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="Glimpses of glory"
            title="The moments that move the game"
            description="Event and player imagery will be displayed here when the official JPL media library is available."
          />
          <p className="coming-soon">Coming soon</p>
        </div>
      </section>

      <section className="section about" id="about" aria-labelledby="about-heading">
        <div className="shell about__grid">
          <div className="about__intro">
            <p className="eyebrow">About the league</p>
            <h2 id="about-heading">Cricket with a purpose.</h2>
            <p className="lede">
              JPL is creating a competitive cricket environment where players can learn, compete and build a stronger community.
            </p>
            <RegisterLink>Join the journey</RegisterLink>
          </div>
          <div className="about__copy">
            {league.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <dl className="about__facts">
              <div><dt>Our purpose</dt><dd>Player development and competitive cricket</dd></div>
              <div><dt>Our vision</dt><dd>A thriving cricket community and player pathway</dd></div>
              <div><dt>Our connection</dt><dd>Cricket, community and local culture</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section faq" aria-labelledby="faq-heading">
        <div className="shell faq__grid">
          <SectionHeading
            eyebrow="Questions, answered"
            title="Before you register"
            description="The current JPL registration and trial rules shown here are based on the existing project information."
          />
          <div className="accordion">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <article className={`faq-item ${isOpen ? 'faq-item--open' : ''}`} key={faq.question}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      <span>{faq.question}</span><span aria-hidden="true">+</span>
                    </button>
                  </h3>
                  <div className="faq-answer" id={`faq-answer-${index}`} hidden={!isOpen}>
                    <p>{faq.answer}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="shell final-cta__inner">
          <div>
            <p className="eyebrow">Your journey starts here</p>
            <h2>Ready to play your part?</h2>
            <p>Register for the next JPL trial and take the first step toward your cricket journey.</p>
          </div>
          <RegisterLink>Register now</RegisterLink>
        </div>
      </section>
    </>
  )
}
