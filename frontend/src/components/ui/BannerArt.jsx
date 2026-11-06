// Paisaje de montañas para el cierre de Inicio: cielo cálido, cumbres con nieve, bruma y pinos.
// Es decorativo y se arma con formas y degradados suaves (SVG).
export default function BannerArt({ className = 'banner-art' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 160"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="banner-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcd9e8" />
          <stop offset="0.6" stopColor="#f7e4c8" />
          <stop offset="1" stopColor="#fbe9d0" />
        </linearGradient>
        <linearGradient id="banner-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d9bb0" />
          <stop offset="1" stopColor="#a9bfb8" />
        </linearGradient>
        <linearGradient id="banner-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f7f6c" />
          <stop offset="1" stopColor="#2f6350" />
        </linearGradient>
        <linearGradient id="banner-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="banner-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3cf" />
          <stop offset="1" stopColor="#fff3cf" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="160" fill="url(#banner-sky)" />
      <circle cx="610" cy="52" r="70" fill="url(#banner-sun)" />
      <path
        d="M0 120 90 58l40 34 60-62 70 70 50-36 80 56 90-50 70 44 80-60 70 46v60H0Z"
        fill="url(#banner-far)"
      />
      <path
        d="m190 30 14 18-12-4-10 8-8-10Zm-60 62 12-12 10 8-10 4Zm380-24 10-12 14 14-12-4Zm-240 44 14-14 12 12-14-4Z"
        fill="#ffffff"
        opacity="0.9"
      />
      <path
        d="M0 132c80-30 160-26 230-6s150 18 250-8 220-18 320 12v30H0Z"
        fill="url(#banner-mid)"
      />
      <rect y="90" width="800" height="70" fill="url(#banner-mist)" />
      <path d="M0 150c120-14 240-10 360-2s300 4 440-8v20H0Z" fill="#1f5b4a" />
      <g fill="#174738">
        <path d="m36 150 10-34 10 34Zm18 0 8-26 8 26Zm640 0 10-36 10 36Zm22 0 8-28 8 28Z" />
      </g>
    </svg>
  );
}
