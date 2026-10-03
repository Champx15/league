import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Field from '../components/Field'
import { createRegistration, isApiConfigured, loadRazorpay, verifyPayment } from '../lib/api'
import { states, unionTerritories } from '../data/indianStates'
import { proficiencyGroups } from '../data/proficiency'
import '../styles/registration.css'

const EMPTY_FORM = {
  player_name: '',
  date_of_birth: '',
  father_name: '',
  mother_name: '',
  father_mobile: '',
  aadhaar_number: '',
  state: '',
  pincode: '',
  full_address: '',
  player_mobile: '',
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

  if (!form.father_name.trim()) errors.father_name = 'Enter the father’s name.'
  if (!form.mother_name.trim()) errors.mother_name = 'Enter the mother’s name.'

  if (!form.father_mobile.trim()) errors.father_mobile = 'Enter the father’s mobile number.'
  else if (!isValidPhone(form.father_mobile)) {
    errors.father_mobile = 'Enter a 10-digit Indian mobile number.'
  }

  if (!/^\d{12}$/.test(form.aadhaar_number.trim())) {
    errors.aadhaar_number = 'Enter a valid 12-digit Aadhaar number.'
  }

  if (!form.state) errors.state = 'Select a state or union territory.'

  if (!/^[1-9]\d{5}$/.test(form.pincode.trim())) {
    errors.pincode = 'A pincode is 6 digits.'
  }

  if (!form.full_address.trim()) errors.full_address = 'Enter the full address.'

  const selectedGroup = proficiencyGroups.find((group) => group.id === proficiency.groupId)
  if (!selectedGroup) {
    errors.proficiency = 'Select a playing category.'
  } else if (
    (selectedGroup.options?.length > 0 || selectedGroup.subgroups) &&
    proficiency.options.length === 0
  ) {
    errors.proficiency = 'Select at least one option in your playing category.'
  }

  if (!form.player_mobile.trim()) errors.player_mobile = 'Enter the player’s mobile number.'
  else if (!isValidPhone(form.player_mobile)) {
    errors.player_mobile = 'Enter a 10-digit Indian mobile number.'
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email.trim())) {
    errors.email = 'Enter a valid email address, for example name@example.com.'
  }

  return errors
}

export default function Registration() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [proficiency, setProficiency] = useState({ groupId: '', options: [] })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null) // { id, playerName }
  const [pendingOrder, setPendingOrder] = useState(null)
  const [copied, setCopied] = useState(false)

  const fieldRefs = useRef({})
  const errorSummaryRef = useRef(null)
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

  function selectProficiencyGroup(groupId) {
    setProficiency({ groupId, options: [] })
    setErrors((current) => {
      if (!current.proficiency) return current
      const next = { ...current }
      delete next.proficiency
      return next
    })
  }

  function toggleProficiency(option) {
    setProficiency((current) => ({
      ...current,
      options: current.options.includes(option)
        ? current.options.filter((item) => item !== option)
        : [...current.options, option],
    }))
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

    if (!isApiConfigured) {
      setSubmitError(
        'The registration service is not configured. Add VITE_API_BASE_URL to .env and restart the dev server.'
      )
      return
    }

    const payload = {
      player_name: form.player_name.trim(),
      date_of_birth: form.date_of_birth,
      father_name: form.father_name.trim(),
      mother_name: form.mother_name.trim(),
      father_mobile: normalisePhone(form.father_mobile),
      aadhaar_number: form.aadhaar_number.trim(),
      state: form.state,
      pincode: form.pincode.trim(),
      category: proficiencyGroups.find((group) => group.id === proficiency.groupId)?.label,
      proficiency:
        proficiency.options.length > 0
          ? proficiency.options
          : [proficiencyGroups.find((group) => group.id === proficiency.groupId).label],
      full_address: form.full_address.trim(),
      player_mobile: normalisePhone(form.player_mobile),
      email: form.email.trim() ? form.email.trim() : null,
    }

    setSubmitting(true)
    try {
      await loadRazorpay()
      const order = await createRegistration(payload)
      setPendingOrder({ ...order, playerName: payload.player_name })
      openCheckout(order, payload)
    } catch (error) {
      console.error('Registration/payment initialization failed', error)
      if (error.data?.playerId) {
        setPendingOrder({
          playerId: error.data.playerId,
          playerName: payload.player_name,
          initializationFailed: true,
        })
      } else {
        setSubmitError(error.message || 'We could not start your registration. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function openCheckout(order, player = form) {
    if (!window.Razorpay) {
      setSubmitError('Secure checkout is unavailable. Please refresh the page and try again.')
      return
    }

    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'City Cricket League',
      description: 'Player registration fee',
      order_id: order.orderId,
      prefill: {
        name: player.player_name || order.playerName,
        email: player.email || '',
        contact: player.player_mobile || '',
      },
      handler: (payment) => confirmPayment(payment, order, player),
      modal: {
        ondismiss: () => setSubmitting(false),
      },
      theme: { color: '#1f5138' },
    })

    checkout.on('payment.failed', (response) => {
      setSubmitError(response.error?.description || 'Payment failed. You can retry using the same order.')
    })
    checkout.open()
  }

  async function confirmPayment(payment, order, player = form) {
    setSubmitting(true)
    setSubmitError('')
    try {
      const verified = await verifyPayment(payment)
      setResult({
        id: verified.playerId || order.playerId,
        playerName: order.playerName || player.player_name,
        paymentStatus: verified.paymentStatus || 'PAID',
      })
      setPendingOrder(null)
    } catch (error) {
      console.error('Payment verification failed', error)
      setPendingOrder((current) => ({ ...current, verificationPayment: payment }))
      setSubmitError(
        'Payment was received, but confirmation is delayed. Retry confirmation below; do not make another payment.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function startAnother() {
    setForm(EMPTY_FORM)
    setProficiency({ groupId: '', options: [] })
    setErrors({})
    setSubmitError('')
    setResult(null)
    setPendingOrder(null)
    setCopied(false)
  }

  async function copyId() {
    const id = result?.id || pendingOrder?.playerId
    if (!id) return
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  if (pendingOrder) {
    return (
      <div className="shell success">
        <p className="success__tick" aria-hidden="true">₹</p>
        <h1 className="success__title">
          {pendingOrder.initializationFailed ? 'Registration saved' : 'Complete your payment'}
        </h1>
        <p className="success__text">
          {pendingOrder.initializationFailed
            ? `Thank you, ${pendingOrder.playerName}. Payment could not be started. Contact the league and share your Player ID.`
            : `Your registration for ${pendingOrder.playerName} is saved. Complete the payment to confirm it.`}
        </p>
        {pendingOrder.playerId && (
          <div className="id-card">
            <p className="id-card__label">Your Player ID</p>
            <p className="id-card__value">{pendingOrder.playerId}</p>
            <div className="id-card__foot">
              <span>Keep this ID for your records.</span>
              <button type="button" className="copy-btn" onClick={copyId}>
                {copied ? 'Copied' : 'Copy ID'}
              </button>
            </div>
          </div>
        )}
        {submitError && <p className="alert" role="alert">{submitError}</p>}
        <div className="success__actions">
          {pendingOrder.orderId && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                pendingOrder.verificationPayment
                  ? confirmPayment(pendingOrder.verificationPayment, pendingOrder)
                  : openCheckout(pendingOrder)
              }
              disabled={submitting}
            >
              {submitting
                ? 'Please wait…'
                : pendingOrder.verificationPayment
                  ? 'Retry payment confirmation'
                  : 'Pay now'}
            </button>
          )}
          <Link className="btn btn--ghost" to="/">Back to home</Link>
        </div>
      </div>
    )
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
          Thank you, {result.playerName}. Your registration and payment have been confirmed.
        </p>

        {result.id ? (
          <div className="id-card">
            <p className="id-card__label">Your Player ID · Payment {result.paymentStatus}</p>
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

        <div className="grid reg__fields">
          <Field id="player_name" label="Player name" required error={errors.player_name}>
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

          <Field id="father_name" label="Father name" required error={errors.father_name}>
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

          <Field id="mother_name" label="Mother name" required error={errors.mother_name}>
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

          <Field id="state" label="State" required error={errors.state}>
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

          <Field id="pincode" label="Pincode" required error={errors.pincode}>
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

          <Field id="full_address" label="Full address" required error={errors.full_address} className="span-2">
            {({ describedBy, invalid }) => (
              <textarea
                className="textarea"
                id="full_address"
                rows={3}
                autoComplete="street-address"
                value={form.full_address}
                onChange={(event) => setValue('full_address', event.target.value)}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                ref={(node) => (fieldRefs.current.full_address = node)}
              />
            )}
          </Field>

          <Field
            id="player_mobile"
            label="Player mobile"
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
            id="father_mobile"
            label="Father mobile"
            required
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

          <Field
            id="aadhaar_number"
            label="Aadhaar number"
            required
            hint="12 digits, numbers only."
            error={errors.aadhaar_number}
          >
            {({ describedBy, invalid }) => (
              <input
                className="input"
                id="aadhaar_number"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={12}
                value={form.aadhaar_number}
                onChange={(event) => setValue('aadhaar_number', event.target.value.replace(/\D/g, ''))}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                ref={(node) => (fieldRefs.current.aadhaar_number = node)}
              />
            )}
          </Field>

          <Field id="email" label="Email" optional error={errors.email}>
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

        {/* 4. Proficiency */}
        <fieldset className="fieldset">
          <legend>
            <span className="legend">
              <span className="legend__text">Playing proficiency</span>
            </span>
            <p className="legend__note">Choose one category. You can select specialties only within that category.</p>
          </legend>

          <div className="prof">
            {proficiencyGroups.map((group, groupIndex) => (
              <div
                className={`prof__card${proficiency.groupId === group.id ? ' prof__card--selected' : ''}`}
                key={group.id}
              >
                <label className="prof__choice">
                  <input
                    type="radio"
                    name="proficiency-category"
                    value={group.id}
                    checked={proficiency.groupId === group.id}
                    onChange={() => selectProficiencyGroup(group.id)}
                    ref={groupIndex === 0 ? (node) => (fieldRefs.current.proficiency = node) : undefined}
                  />
                  <span className="prof__choice-copy">
                    <strong>{group.label}</strong>
                    <span>₹{group.fee}</span>
                  </span>
                </label>

                {proficiency.groupId === group.id && group.subgroups && (
                  <div className="prof__options">
                    {group.subgroups.map((subgroup) => (
                      <fieldset className="prof__subgroup" key={subgroup.label}>
                        <legend>{subgroup.label}</legend>
                        {subgroup.options.map((option) => (
                          <label className="check" key={option}>
                            <input
                              type="checkbox"
                              checked={proficiency.options.includes(option)}
                              onChange={() => toggleProficiency(option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </fieldset>
                    ))}
                  </div>
                )}

                {proficiency.groupId === group.id && group.options?.length > 0 && (
                  <div className="prof__options">
                    {group.options.map((option) => (
                      <label className="check" key={option}>
                        <input
                          type="checkbox"
                          checked={proficiency.options.includes(option)}
                          onChange={() => toggleProficiency(option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="selected-count" aria-live="polite">
            {!proficiency.groupId
              ? 'Nothing selected yet.'
              : `${proficiencyGroups.find((group) => group.id === proficiency.groupId).label}${
                  proficiency.options.length ? `: ${proficiency.options.join(', ')}` : ''
                }`}
          </p>

          {errors.proficiency && (
            <p className="field__error" style={{ marginTop: '10px' }}>
              {errors.proficiency}
            </p>
          )}
        </fieldset>

        <div className="submit">
          {submitError && (
            <p className="alert" role="alert">
              {submitError}
            </p>
          )}

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Starting secure checkout…' : 'Register & pay'}
          </button>
          <p className="submit__note" aria-live="polite">
            {submitting ? 'Saving your registration and preparing secure Razorpay checkout.' : ''}
          </p>
        </div>
      </form>
    </div>
  )
}
