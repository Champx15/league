import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { league } from '../config/league'
import { BallMark } from './Seam'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef(null)
  const location = useLocation()

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="nav">
      <div className="shell nav__inner">
        <Link className="brand" to="/">
          <BallMark className="brand__mark" />
          <span>
            <span className="brand__name">{league.name}</span>
            <span className="brand__season">{league.season}</span>
          </span>
        </Link>

        <nav className="nav__links" aria-label="Main">
          <NavLink className="nav__link" to="/" end>
            Home
          </NavLink>
          <NavLink className="nav__link" to="/about">
            About us
          </NavLink>
        </nav>

        <div className="nav__right">
          <Link className="btn nav__cta" to="/registration">
            Register now
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="nav__toggle-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div className="shell">
          <nav className="nav__drawer" id="mobile-menu" aria-label="Main">
            <NavLink className="nav__link" to="/" end>
              Home
            </NavLink>
            <NavLink className="nav__link" to="/about">
              About us
            </NavLink>
            <Link className="btn btn--block" to="/registration">
              Register now
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
