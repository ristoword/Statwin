export function BrandMark({ size = 36, id = 'sw' }: { size?: number; id?: string }) {
  const gold = `${id}-gold`;
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gold} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff4c8" />
          <stop offset="0.42" stopColor="#e8c872" />
          <stop offset="1" stopColor="#8a6914" />
        </linearGradient>
      </defs>
      <path
        d="M24 3.2L42 10.4V24.6C42 34.2 34.8 42.4 24 45.2C13.2 42.4 6 34.2 6 24.6V10.4L24 3.2Z"
        fill={`url(#${gold})`}
      />
      <path
        d="M24 7.1L38.2 12.6V24.5C38.2 32.2 32.3 38.8 24 41.2C15.7 38.8 9.8 32.2 9.8 24.5V12.6L24 7.1Z"
        fill="#16120a"
      />
      <path
        d="M16.2 19.2C16.8 15.8 20.2 13.8 24.4 13.8C29.1 13.8 32.2 16.1 32.2 19.6C32.2 22.5 30.4 24.1 26.6 25.2L23.4 26.1C21.4 26.7 20.6 27.4 20.6 28.6C20.6 30.1 22 31.1 24.3 31.1C26.8 31.1 28.2 30 28.6 28.2H31.8C31.3 31.8 28.2 34.1 24.3 34.1C19.6 34.1 16.6 31.7 16.6 28.2C16.6 25.2 18.4 23.6 22.1 22.5L25.4 21.6C27.3 21 28.1 20.3 28.1 19.3C28.1 17.9 26.8 16.9 24.5 16.9C22.3 16.9 20.8 17.9 20.4 19.2H16.2Z"
        fill={`url(#${gold})`}
      />
    </svg>
  );
}
