// Ilustración de la pantalla de ingreso: una planta que crece de un frasco de monedas, sobre
// colinas verdes. Es decorativa (aria-hidden) y se arma con formas simples.
export default function AuthIllustration() {
  return (
    <svg
      className="auth-hero__art"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="318" cy="70" r="34" fill="#f3d79a" opacity="0.9" />
      <path d="M0 210C70 170 130 190 200 175s140-30 200 10v125H0Z" fill="#3f7d68" />
      <path d="M0 240C80 215 150 235 230 220s120-10 170 5v75H0Z" fill="#2d6a56" />
      <path d="M0 268C100 250 190 270 400 252v48H0Z" fill="#174738" />
      <g transform="translate(150 120)">
        <path
          d="M15 22h70v10c0 8 15 12 15 26v66c0 16-12 24-30 24H30c-18 0-30-8-30-24V58c0-14 15-18 15-26Z"
          fill="#ffffff"
          opacity="0.3"
        />
        <path
          d="M15 22h70v10c0 8 15 12 15 26v66c0 16-12 24-30 24H30c-18 0-30-8-30-24V58c0-14 15-18 15-26Z"
          fill="none"
          stroke="#e6f0ea"
          strokeWidth="3"
        />
        <rect x="10" y="12" width="80" height="11" rx="5" fill="#e6f0ea" />
        <ellipse cx="50" cy="140" rx="36" ry="8" fill="#d99a32" />
        <ellipse cx="50" cy="130" rx="36" ry="8" fill="#e8b04f" />
        <ellipse cx="42" cy="120" rx="28" ry="7" fill="#d99a32" />
        <ellipse cx="58" cy="111" rx="26" ry="7" fill="#e8b04f" />
        <path
          d="M50 110C50 84 50 60 50 34"
          fill="none"
          stroke="#a9d3b8"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M50 64C26 66 12 52 10 32c24-2 40 8 40 32Z" fill="#7bbf94" />
        <path d="M50 48c0-22 14-34 38-34 2 24-12 36-38 34Z" fill="#a9d3b8" />
      </g>
    </svg>
  );
}
