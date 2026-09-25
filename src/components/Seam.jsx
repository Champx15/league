// Small ball mark used as the league logo.
export function BallMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="#8C2115" />
      <path d="M11 2.6C8.2 6.6 6.8 11.1 6.8 16S8.2 25.4 11 29.4" stroke="#EFEDE7" strokeWidth="1.6" fill="none" />
      <path d="M21 2.6c2.8 4 4.2 8.5 4.2 13.4S23.8 25.4 21 29.4" stroke="#EFEDE7" strokeWidth="1.6" fill="none" />
    </svg>
  )
}

// Oversized, low-contrast seam arc behind the hero.
export function SeamArc({ className }) {
  return (
    <svg className={className} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
      <circle cx="300" cy="300" r="250" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M186 78c-46 64-70 140-70 222s24 158 70 222" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M200 96c-42 60-64 130-64 204s22 144 64 204"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 12"
        strokeLinecap="round"
      />
      <path d="M414 78c46 64 70 140 70 222s-24 158-70 222" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M400 96c42 60 64 130 64 204s-22 144-64 204"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 12"
        strokeLinecap="round"
      />
    </svg>
  )
}
