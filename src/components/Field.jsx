/**
 * Wraps one control with a real <label>, an optional hint and an error message
 * that is announced by screen readers. `children` receives the ids it must use
 * for aria-describedby.
 */
export default function Field({ id, label, required, optional, hint, error, className = '', children }) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="field__optional">Optional</span>}
      </label>

      {children({ describedBy, invalid: Boolean(error) })}

      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}
