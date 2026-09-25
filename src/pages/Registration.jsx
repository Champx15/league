import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Field from '../components/Field'
import { useTrialSessions } from '../hooks/useTrialSessions'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { states, unionTerritories } from '../data/indianStates'
import { proficiencyGroups } from '../data/proficiency'
import { formatReportingTime, formatTrialDate, formatSessionSummary } from '../lib/format'
import '../styles/registration.css'

const EMPTY_FORM = {
  player_name: '',
  date_of_birth: '',
  jersey_number: '',
  father_name: '',
  mother_name: '',
  father_mobile: '',
  state: '',
  pincode: '',
  full_address: '',
  trial_session_id: '',
  player_mobile: '',
  whatsapp_number: '',
  email: '',
}

const today = new Date().toISOString().slice(0, 10)

/** Reduces "+91 98765 43210", "098765 43210" etc. to "9876543210". */
function normalisePhone(value) {
  const digits = String(value).replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

function isValidPhone(value) {
  return /^[6-9]\d{9}$/.test(normalisePhone(value))
}

function validate(form, proficiency) {
  const errors = {}

  if (!form.player_name.trim()) errors.player_name = 'Enter the player’s full name.'
  else if (form.player_name.trim().length < 2) errors.player_name = 'Name looks too short.'

  if (!form.date_of_birth) {
    errors.date_of_birth = 'Enter the date of birth.'
  } else if (form.date_of_birth > today) {
    errors.date_of_birth = 'Date of birth cannot be in the future.'
  } else if (Number(form.date_of_birth.slice(0, 4)) < 1930) {
    errors.date_of_birth = 'Enter a valid date of birth.'
  }

  if (form.jersey_number !== '') {
    const jersey = Number(form.jersey_number)
    if (!Number.isInteger(jersey) || jersey < 0 || jersey > 999) {
      errors.jersey_number = 'Use a whole number between 0 and 999.'
    }
  }

  if (!form.father_name.trim()) errors.father_name = 'Enter the father’s name.'
  if (!form.mother_name.trim()) errors.mother_name = 'Enter the mother’s name.'

  if (form.father_mobile && !isValidPhone(form.father_mobile)) {
    errors.father_mobile = 'Enter a 10-digit Indian mobile number.'
  }

  if (!form.state) errors.state = 'Select a state or union territory.'

  if (form.pincode && !/^[1-9]\d{5}$/.test(form.pincode.trim())) {
    errors.pincode = 'A pincode is 6 digits.'
  }

  if (!form.trial_session_id) errors.trial_session_id = 'Select the trial you will attend.'

  if (proficiency.length === 0) errors.proficiency = 'Select at least one playing proficiency.'

  if (!form.player_mobile.trim()) errors.player_mobile = 'Enter the player’s mobile number.'
  else if (!isValidPhone(form.player_mobile)) {
    errors.player_mobile = 'Enter a 10-digit Indian mobile number.'
  }

  if (form.whatsapp_number && !isValidPhone(form.whatsapp_number)) {
    errors.whatsapp_number = 'Enter a 10-digit WhatsApp number.'
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email.trim())) {
    errors.email = 'Enter a valid email address, for example name@example.com.'
  }

  return errors
}

export default function Registration() {
  const { sessions, status, errorMessage, reload } = useTrialSessions()
  const [form, setForm] = useState(EMPTY_FORM)
  const [proficiency, setProficiency] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null) // { id, playerName, session }
  const [copied, setCopied] = useState(false)

  const fieldRefs = useRef({})
  const errorSummaryRef = useRef(null)
  const trialsAvailable = status === 'ready' && sessions.length > 0

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === form.trial_session_id) ?? null,
    [sessions, form.trial_session_id]
  )

  useEffect(() => {
    if (result) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [result])

  function setValue(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  function toggleProficiency(option) {
    setProficiency((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    )
    setErrors((current) => {
      if (!current.proficiency) return current
      const next = { ...current }
      delete next.proficiency
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    const nextErrors = validate(form, proficiency)
    setErrors(nextErrors)

    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      const node = fieldRefs.current[firstError]
      if (node && typeof node.focus === 'function') {
        node.focus()
        node.scrollIntoView({ block: 'center', behavior: 'smooth' })
      } else {
        errorSummaryRef.current?.focus()
      }
      return
    }

    if (!isSupabaseConfigured) {
      setSubmitError(
        'The site is not connected to the database yet. Add your Supabase credentials to .env and restart the dev server.'
      )
      return
    }

    const payload = {
      player_name: form.player_name.trim(),
      date_of_birth: form.date_of_birth,
      jersey_number: form.jersey_number === '' ? null : Number(form.jersey_number),
      father_name: form.father_name.trim(),
      mother_name: form.mother_name.trim(),
      father_mobile: form.father_mobile ? normalisePhone(form.father_mobile) : null,
      state: form.state,
      pincode: form.pincode ? form.pincode.trim() : null,
      trial_session_id: form.trial_session_id,
      proficiency,
      full_address: form.full_address.trim() ? form.full_address.trim() : null,
      player_mobile: normalisePhone(form.player_mobile),
      whatsapp_number: form.whatsapp_number ? normalisePhone(form.whatsapp_number) : null,
      email: form.email.trim() ? form.email.trim() : null,
    }

    setSubmitting(true)
    const { data, error } = await supabase.from('players').insert(payload).select('id').single()
    setSubmitting(false)

    if (error) {
      // The row is written, but RLS blocks reading it back, so the returned
      // representation is empty. The registration itself succeeded.
      if (error.code === 'PGRST116') {
        setResult({ id: null, playerName: payload.player_name, session: selectedSession })
        return
      }

      console.error('Registration failed', error)
      setSubmitError(
        'We could not save your registration. Check your internet connection and try again. If it keeps failing, contact the league.'
      )
      return
    }

    setResult({ id: data?.id ?? null, playerName: payload.player_name, session: selectedSession })
  }

  function startAnother() {
    setForm(EMPTY_FORM)
    setProficiency([])
    setErrors({})
    setSubmitError('')
    setResult(null)
    setCopied(false)
    reload()
  }

  async function copyId() {
    if (!result?.id) return
    try {
      await navigator.clipboard.writeText(result.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  /* ---------------------------------------------------------------- success */
  if (result) {
    return (
      <div className="shell success">
        <p className="success__tick" aria-hidden="true">
          ✓
        </p>
        <h1 className="success__title">Registration submitted</h1>
        <p className="success__text">
          Thank you, {result.playerName}. Your registration has been recorded for the trial you selected.
        </p>

        {result.id ? (
          <div className="id-card">
            <p className="id-card__label">Your Player ID</p>
            <p className="id-card__value">{result.id}</p>
            <div className="id-card__foot">
              <span>Save this ID. You will need it on trial day.</span>
              <button type="button" className="copy-btn" onClick={copyId}>
                {copied ? 'Copied' : 'Copy ID'}
              </button>
            </div>
          </div>
        ) : (
          <div className="id-card">
            <p className="id-card__label">Your Player ID</p>
            <p className="id-card__value" style={{ fontWeight: 400 }}>
              Your registration is saved, but the Player ID could not be shown here. Contact the league
              with the player name and mobile number to get it.
            </p>
          </div>
        )}

        {result.session && (
          <div className="success__summary">
            <p>{result.session.city}</p>
            <p>{formatTrialDate(result.session.trial_date)}</p>
            <p>{result.session.venue}</p>
            {result.session.reporting_time && (
              <p>Reporting at {formatReportingTime(result.session.reporting_time)}</p>
            )}
          </div>
        )}

        <div className="success__actions">
          <button type="button" className="btn" onClick={startAnother}>
            Register another player
          </button>
          <Link className="btn btn--ghost" to="/">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------- form */
  const errorCount = Object.keys(errors).length

  return (
    <div className="shell reg">
      <header className="reg__head">
        <h1 className="reg__title">Player registration</h1>
        <p className="reg__intro">
          One form, about three minutes. Fields marked with{' '}
          <span className="field__req" aria-hidden="true">
            *
          </span>{' '}
          are required.
        </p>
      </header>

      <form className="reg__form" onSubmit={handleSubmit} noValidate>
        {errorCount > 0 && (
          <div
            className="alert"
            role="alert"
            tabIndex={-1}
            ref={errorSummaryRef}
            style={{ marginTop: '24px' }}
          >
            {errorCount === 1
              ? 'One field needs attention before you can submit.'
              : `${errorCount} fields need attention before you can submit.`}
          </div>
        )}

        {/* 1. Player information */}
        <fieldset className="fieldset">
          <legend>
            <span className="legend">
              <span className="legend__index" aria-hidden="true">
                1
              </span>
              <span className="legend__text">Player information</span>
            </span>
          </legend>

          <div className="grid">
            <Field
              id="player_name"
              label="Player name"
              required
              error={errors.player_name}
              className="span-2"
            >
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="player_name"
                  name="player_name"
                  type="text"
                  autoComplete="name"
                  value={form.player_name}
                  onChange={(event) => setValue('player_name', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.player_name = node)}
                />
              )}
            </Field>

            <Field id="date_of_birth" label="Date of birth" required error={errors.date_of_birth}>
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  max={today}
                  value={form.date_of_birth}
                  onChange={(event) => setValue('date_of_birth', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.date_of_birth = node)}
                />
              )}
            </Field>

            <Field
              id="jersey_number"
              label="Jersey number"
              optional
              hint="Preferred number, if you have one."
              error={errors.jersey_number}
            >
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="jersey_number"
                  name="jersey_number"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="999"
                  step="1"
                  value={form.jersey_number}
                  onChange={(event) => setValue('jersey_number', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.jersey_number = node)}
                />
              )}
            </Field>
          </div>
        </fieldset>

        {/* 2. Parent information */}
        <fieldset className="fieldset">
          <legend>
            <span className="legend">
              <span className="legend__index" aria-hidden="true">
                2
              </span>
              <span className="legend__text">Parent information</span>
            </span>
          </legend>

          <div className="grid">
            <Field id="father_name" label="Father’s name" required error={errors.father_name}>
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="father_name"
                  type="text"
                  value={form.father_name}
                  onChange={(event) => setValue('father_name', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.father_name = node)}
                />
              )}
            </Field>

            <Field id="mother_name" label="Mother’s name" required error={errors.mother_name}>
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="mother_name"
                  type="text"
                  value={form.mother_name}
                  onChange={(event) => setValue('mother_name', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.mother_name = node)}
                />
              )}
            </Field>

            <Field
              id="father_mobile"
              label="Father’s mobile number"
              optional
              hint="10-digit Indian mobile number."
              error={errors.father_mobile}
            >
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="father_mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={form.father_mobile}
                  onChange={(event) => setValue('father_mobile', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.father_mobile = node)}
                />
              )}
            </Field>
          </div>
        </fieldset>

        {/* 3. Location */}
        <fieldset className="fieldset">
          <legend>
            <span className="legend">
              <span className="legend__index" aria-hidden="true">
                3
              </span>
              <span className="legend__text">Location</span>
            </span>
          </legend>

          <div className="grid">
            <Field id="state" label="State or union territory" required error={errors.state}>
              {({ describedBy, invalid }) => (
                <select
                  className="select"
                  id="state"
                  value={form.state}
                  onChange={(event) => setValue('state', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.state = node)}
                >
                  <option value="">Select a state</option>
                  <optgroup label="States">
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Union territories">
                    {unionTerritories.map((territory) => (
                      <option key={territory} value={territory}>
                        {territory}
                      </option>
                    ))}
                  </optgroup>
                </select>
              )}
            </Field>

            <Field id="pincode" label="Pincode" optional error={errors.pincode}>
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  value={form.pincode}
                  onChange={(event) => setValue('pincode', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.pincode = node)}
                />
              )}
            </Field>

            <Field id="full_address" label="Full address" optional className="span-2">
              {({ describedBy }) => (
                <textarea
                  className="textarea"
                  id="full_address"
                  rows={3}
                  autoComplete="street-address"
                  value={form.full_address}
                  onChange={(event) => setValue('full_address', event.target.value)}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
          </div>
        </fieldset>

        {/* 4. Trial selection */}
        <fieldset className="fieldset">
          <legend>
            <span className="legend">
              <span className="legend__index" aria-hidden="true">
                4
              </span>
              <span className="legend__text">Trial selection</span>
            </span>
            <p className="legend__note">Choose the one trial you will attend.</p>
          </legend>

          {status === 'loading' && (
            <div className="state-box">
              <strong>Loading trial dates…</strong>
              <span>This takes a moment.</span>
            </div>
          )}

          {status === 'error' && (
            <div className="state-box">
              <strong>Trial dates could not be loaded</strong>
              <span>{errorMessage}</span>
              <div>
                <button type="button" className="btn btn--ghost" onClick={reload}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {status === 'ready' && sessions.length === 0 && (
            <div className="state-box">
              <strong>No trials are scheduled right now</strong>
              <span>
                Registration reopens as soon as the next trial dates are confirmed. Check the home page or
                contact the league.
              </span>
            </div>
          )}

          {trialsAvailable && (
            <>
              <div
                className="trials"
                role="radiogroup"
                aria-labelledby="trial-group-label"
                aria-describedby={errors.trial_session_id ? 'trial_session_id-error' : undefined}
              >
                <span id="trial-group-label" className="field__label" style={{ display: 'none' }}>
                  Trial session
                </span>
                {sessions.map((session, index) => (
                  <label className="trial" key={session.id}>
                    <input
                      type="radio"
                      name="trial_session_id"
                      value={session.id}
                      checked={form.trial_session_id === session.id}
                      onChange={() => setValue('trial_session_id', session.id)}
                      ref={index === 0 ? (node) => (fieldRefs.current.trial_session_id = node) : undefined}
                    />
                    <span>
                      <span className="trial__city">{session.city}</span>
                      <span className="trial__date" style={{ display: 'block' }}>
                        {formatTrialDate(session.trial_date)}
                      </span>
                      <span className="trial__meta" style={{ display: 'block' }}>
                        {session.venue}
                      </span>
                      {session.reporting_time && (
                        <span className="trial__meta" style={{ display: 'block' }}>
                          Reporting at {formatReportingTime(session.reporting_time)}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              {errors.trial_session_id && (
                <p className="field__error" id="trial_session_id-error" style={{ marginTop: '10px' }}>
                  {errors.trial_session_id}
                </p>
              )}
            </>
          )}
        </fieldset>

        {/* 5. Proficiency */}
        <fieldset className="fieldset">
          <legend>
            <span className="legend">
              <span className="legend__index" aria-hidden="true">
                5
              </span>
              <span className="legend__text">Playing proficiency</span>
            </span>
            <p className="legend__note">Select everything that applies. At least one is required.</p>
          </legend>

          <div className="prof">
            {proficiencyGroups.map((group, groupIndex) => (
              <fieldset className="prof__group" key={group.id}>
                <legend>{group.label}</legend>
                {group.options.map((option, optionIndex) => (
                  <label className="check" key={option}>
                    <input
                      type="checkbox"
                      checked={proficiency.includes(option)}
                      onChange={() => toggleProficiency(option)}
                      ref={
                        groupIndex === 0 && optionIndex === 0
                          ? (node) => (fieldRefs.current.proficiency = node)
                          : undefined
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>

          <p className="selected-count" aria-live="polite">
            {proficiency.length === 0
              ? 'Nothing selected yet.'
              : `${proficiency.length} selected: ${proficiency.join(', ')}`}
          </p>

          {errors.proficiency && (
            <p className="field__error" style={{ marginTop: '10px' }}>
              {errors.proficiency}
            </p>
          )}
        </fieldset>

        {/* 6. Contact */}
        <fieldset className="fieldset">
          <legend>
            <span className="legend">
              <span className="legend__index" aria-hidden="true">
                6
              </span>
              <span className="legend__text">Contact information</span>
            </span>
            <p className="legend__note">The league will use this to confirm your trial slot.</p>
          </legend>

          <div className="grid">
            <Field
              id="player_mobile"
              label="Player mobile number"
              required
              hint="10-digit Indian mobile number."
              error={errors.player_mobile}
            >
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="player_mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={form.player_mobile}
                  onChange={(event) => setValue('player_mobile', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.player_mobile = node)}
                />
              )}
            </Field>

            <Field
              id="whatsapp_number"
              label="WhatsApp number"
              optional
              error={errors.whatsapp_number}
            >
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="whatsapp_number"
                  type="tel"
                  inputMode="numeric"
                  value={form.whatsapp_number}
                  onChange={(event) => setValue('whatsapp_number', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.whatsapp_number = node)}
                />
              )}
            </Field>

            <Field id="email" label="Email ID" optional error={errors.email} className="span-2">
              {({ describedBy, invalid }) => (
                <input
                  className="input"
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setValue('email', event.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  ref={(node) => (fieldRefs.current.email = node)}
                />
              )}
            </Field>
          </div>
        </fieldset>

        <div className="submit">
          {submitError && (
            <p className="alert" role="alert">
              {submitError}
            </p>
          )}

          {selectedSession && (
            <p className="submit__note">Submitting for {formatSessionSummary(selectedSession)}.</p>
          )}

          <button className="btn" type="submit" disabled={submitting || !trialsAvailable}>
            {submitting ? 'Submitting…' : 'Submit registration'}
          </button>

          {!trialsAvailable && status === 'ready' && (
            <p className="submit__note">
              Registration is closed until the next trial dates are published.
            </p>
          )}
          {!trialsAvailable && status === 'error' && (
            <p className="submit__note">
              Trial dates must load before a registration can be submitted.
            </p>
          )}
          <p className="submit__note" aria-live="polite">
            {submitting ? 'Saving your registration, please do not close this page.' : ''}
          </p>
        </div>
      </form>
    </div>
  )
}
