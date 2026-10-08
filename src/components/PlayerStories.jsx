import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { addReview, getReviews } from '../lib/api'
import { states, unionTerritories } from '../data/indianStates'

const PAGE_SIZE = 6
const proficiencyOptions = ['Batter', 'Fast Bowler', 'Spin Bowler', 'All Rounder', 'Wicket Keeper']

function StarRating({ stars, interactive = false, onChange }) {
  const safeStars = Math.max(0, Math.min(5, Number(stars) || 0))

  return (
    <span className={`story-stars${interactive ? ' story-stars--interactive' : ''}`} aria-label={`${safeStars} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1
        return interactive ? (
          <button
            key={value}
            type="button"
            className={value <= safeStars ? 'review-form__star review-form__star--active' : 'review-form__star'}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            aria-pressed={value <= safeStars}
            onClick={() => onChange(value)}
          >
            ★
          </button>
        ) : (
          <span key={value} aria-hidden="true">
            {value <= safeStars ? '★' : '☆'}
          </span>
        )
      })}
    </span>
  )
}

export default function PlayerStories() {
  const [reviews, setReviews] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    state: '',
    proficiency: '',
    review: '',
    stars: 5,
  })
  const viewportRef = useRef(null)
  const loadingNextPageRef = useRef(false)

  useEffect(() => {
    if (!isModalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function closeOnEscape(event) {
      if (event.key === 'Escape') closeForm()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isModalOpen])

  useEffect(() => {
    let active = true

    async function loadReviews(nextPage) {
      setLoading(true)
      setError('')

      try {
        const result = await getReviews({ page: nextPage, limit: PAGE_SIZE })
        if (!active) return

        setReviews((current) =>
          nextPage === 1 ? result.reviews ?? [] : [...current, ...(result.reviews ?? [])],
        )
        setPage(result.page ?? nextPage)
        setTotalPages(result.totalPages ?? 1)
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadReviews(page)
    return () => {
      active = false
    }
  }, [page])

  function scrollStories(direction) {
    viewportRef.current?.scrollBy({
      left: direction * Math.min(430, viewportRef.current.clientWidth * 0.78),
      behavior: 'smooth',
    })
  }

  function handleScroll() {
    const viewport = viewportRef.current
    if (!viewport || loadingNextPageRef.current || page >= totalPages) return

    const nearEnd = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 160
    if (!nearEnd || reviews.length < 5) return

    loadingNextPageRef.current = true
    setPage((current) => current + 1)
  }

  useEffect(() => {
    loadingNextPageRef.current = false
  }, [reviews.length])

  useEffect(() => {
    if (!submitted) return undefined

    const timeoutId = window.setTimeout(() => setSubmitted(false), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [submitted])

  function openForm() {
    setSubmitted(false)
    setForm({ firstName: '', state: '', proficiency: '', review: '', stars: 5 })
    setIsModalOpen(true)
  }

  function closeForm() {
    setIsModalOpen(false)
    setIsSubmitting(false)
  }

  async function submitReview(event) {
    event.preventDefault()
    setIsSubmitting(true)

    const reviewPayload = {
      name: form.firstName.trim(),
      state: form.state,
      proficiency: form.proficiency,
      review: form.review.trim(),
      stars: form.stars,
    }
    const optimisticReview = {
      ...reviewPayload,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    }

    setReviews((current) => [optimisticReview, ...current])
    setSubmitted(true)
    setIsModalOpen(false)

    try {
      await addReview(reviewPayload)
      setIsSubmitting(false)
    } catch (requestError) {
      setIsSubmitting(false)
      setError(requestError.message)
    }
  }

  const canLoadMore = page < totalPages

  return (
    <section className="section stories" id="stories" aria-labelledby="stories-heading">
      <div className="shell">
        <div className="stories__header">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Player stories</p>
              <h2 id="stories-heading">Lives Changed by JPL</h2>
            </div>
            <p className="lede">Real experiences from players who have been part of the JPL journey.</p>
          </div>
        </div>

        {loading && reviews.length === 0 ? (
          <div className="status-card" role="status">Loading player stories…</div>
        ) : error ? (
          <div className="status-card status-card--error" role="alert">
            Player stories are temporarily unavailable. Please try again later.
          </div>
        ) : reviews.length === 0 ? (
          <div className="status-card">Player stories will be published as reviews are submitted.</div>
        ) : (
          <>
            <div className="story-conveyor">
              <button
                className="story-conveyor__button"
                type="button"
                onClick={() => scrollStories(-1)}
                aria-label="Scroll reviews left"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <div className="story-viewport" ref={viewportRef} onScroll={handleScroll}>
                <div className="story-track">
                  {reviews.map((review, index) => (
                    <div className="story-card-wrap" key={`${review.name}-${index}`}>
                      <article className="story-card">
                        <div className="story-card__topline">
                          <span className="story-card__number">0{index + 1}</span>
                          <StarRating stars={review.stars} />
                        </div>
                        <blockquote>“{review.review}”</blockquote>
                        <footer>
                          <strong>{review.name}</strong>
                          <span>
                            {review.proficiency ? `${review.proficiency}` : 'Player'} ·{' '}
                            {review.state || 'Location unavailable'}
                          </span>
                        </footer>
                      </article>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="story-conveyor__button"
                type="button"
                onClick={() => scrollStories(1)}
                aria-label="Scroll reviews right"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>

            {canLoadMore && <p className="story-pagination-note">Scroll to the fifth review to load the next six stories.</p>}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
          <div className="review-modal__dialog">
            <div className="review-modal__header">
              <div>
                <p className="eyebrow">Player story</p>
                <h3 id="review-modal-title">Share your journey</h3>
              </div>
              <button className="review-modal__close" type="button" onClick={closeForm} aria-label="Close review form">
                <X aria-hidden="true" />
              </button>
            </div>
            <form className="review-form" onSubmit={submitReview}>
              <div className="review-form__row">
                <label>
                  First name
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                    required
                    autoComplete="given-name"
                  />
                </label>
                <label>
                  State
                  <select value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} required>
                    <option value="">Choose a state or union territory</option>
                    {[...states, ...unionTerritories].map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </label>
              </div>
              <label>
                Proficiency
                <select value={form.proficiency} onChange={(event) => setForm((current) => ({ ...current, proficiency: event.target.value }))} required>
                  <option value="">Choose a playing category</option>
                  {proficiencyOptions.map((proficiency) => <option key={proficiency} value={proficiency}>{proficiency}</option>)}
                </select>
              </label>
              <label>
                Your review
                <textarea
                  value={form.review}
                  onChange={(event) => setForm((current) => ({ ...current, review: event.target.value }))}
                  required
                  placeholder="Tell us about your JPL experience…"
                />
              </label>
              <div className="review-form__rating">
                <span>Your rating</span>
                <StarRating stars={form.stars} interactive onChange={(stars) => setForm((current) => ({ ...current, stars }))} />
              </div>
              <div className="review-form__actions">
                <button className="btn btn--ghost" type="button" onClick={closeForm}>Cancel</button>
                <button className="btn btn--solid" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding review…' : 'Add review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {submitted && <div className="review-confirmation" role="status">Review added</div>}

      {createPortal(
        <button className="add-review-button" type="button" onClick={openForm} aria-label="Add review">
          <img src="/reviews-white.png" alt="" aria-hidden="true" />
        </button>,
        document.body,
      )}
    </section>
  )
}
