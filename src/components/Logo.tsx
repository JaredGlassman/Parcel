type Props = { className?: string; showWordmark?: boolean };

export default function Logo({ className = "h-7 w-7", showWordmark = false }: Props) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 64 64"
        className={className}
        aria-hidden
      >
        <defs>
          <linearGradient id="parcel-logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3a5dff" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <path
          d="M16 22 L32 14 L48 22 L48 42 L32 50 L16 42 Z"
          fill="none"
          stroke="url(#parcel-logo-g)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M16 22 L32 30 L48 22"
          fill="none"
          stroke="url(#parcel-logo-g)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M32 30 L32 50" stroke="url(#parcel-logo-g)" strokeWidth="3.5" />
      </svg>
      {showWordmark && (
        <span className="text-base font-semibold tracking-tight text-ink-900">
          Parcel
        </span>
      )}
    </span>
  );
}
