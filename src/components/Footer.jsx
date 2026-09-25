import { league } from '../config/league'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <div className="footer__contact">
          <span>Questions about registration or trials?</span>
          <a href={`mailto:${league.contact.email}`}>{league.contact.email}</a>
          <a href={`tel:${league.contact.phone.replace(/\s/g, '')}`}>{league.contact.phone}</a>
        </div>
        <p className="footer__legal">
          {league.name} — {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
