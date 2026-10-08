export default function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  return (
    <header className={`section-heading section-heading--${align}`}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {description && <p className="lede">{description}</p>}
    </header>
  )
}
