export function Logo({ size = 32 }: { size?: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Helix logo"
    >
      <defs>
        <linearGradient id="hx" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path
        d="M14 8 C 36 22, 28 42, 50 56 M 50 8 C 28 22, 36 42, 14 56"
        stroke="url(#hx)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[12, 22, 32, 42, 52].map((y) => (
        <line
          key={y}
          x1={18 + (y % 16)}
          y1={y}
          x2={46 - (y % 16)}
          y2={y}
          stroke="#a78bfa"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.7}
        />
      ))}
    </svg>
  );
}
