// Ilustración de una meta: montaña, mar o casa. Son escenas simples y livianas (SVG), decorativas.
const SCENES = {
  mountain: (
    <>
      <rect width="200" height="110" fill="#cfe3d8" />
      <circle cx="158" cy="30" r="14" fill="#f3d79a" />
      <path d="M0 110 62 34l32 40 24-26 82 62Z" fill="#789889" />
      <path d="M62 34l-14 17 14-5 12 8Z" fill="#ffffff" opacity="0.85" />
      <path d="M0 110l50-30 40 30 40-22 70 22Z" fill="#3f7d68" />
      <path d="M0 110h200v10H0Z" fill="#1f5b4a" />
    </>
  ),
  sea: (
    <>
      <rect width="200" height="110" fill="#f6e7c4" />
      <circle cx="150" cy="34" r="16" fill="#e8b04f" />
      <path d="M0 66c25-8 50 8 75 0s50 8 75 0 35 4 50 0v54H0Z" fill="#7bbf94" />
      <path d="M0 82c25-8 50 8 75 0s50 8 75 0 35 4 50 0v38H0Z" fill="#3f7d68" />
      <path d="M0 100c30-6 60 6 90 0s70 6 110 0v20H0Z" fill="#e8d3a1" />
      <path d="M44 100c2-26 4-44 6-60" fill="none" stroke="#174738" strokeWidth="3" />
      <path
        d="M50 40c-14-2-24 6-28 16 12-8 20-10 28-16ZM50 40c12-6 22-4 30 4-10-4-20-4-30-4Z"
        fill="#2d6a56"
      />
    </>
  ),
  house: (
    <>
      <rect width="200" height="110" fill="#e6f0ea" />
      <path d="M0 96c40-10 80 4 120-4s60 0 80-2v30H0Z" fill="#a9d3b8" />
      <rect x="62" y="56" width="76" height="52" fill="#fbf3dd" />
      <path d="M54 58 100 22l46 36Z" fill="#b86b2b" />
      <rect x="90" y="76" width="20" height="32" rx="2" fill="#1f5b4a" />
      <rect x="70" y="68" width="14" height="14" rx="2" fill="#a9d3b8" />
      <rect x="116" y="68" width="14" height="14" rx="2" fill="#a9d3b8" />
      <circle cx="30" cy="84" r="14" fill="#3f7d68" />
      <rect x="28" y="92" width="4" height="16" fill="#174738" />
    </>
  ),
  car: (
    <>
      <rect width="200" height="110" fill="#e6f0ea" />
      <circle cx="160" cy="28" r="13" fill="#f3d79a" />
      <path d="M0 92c40-8 80 2 120-4s60-2 80-2v30H0Z" fill="#a9d3b8" />
      <rect x="0" y="92" width="200" height="18" fill="#3b4a45" />
      <path d="M0 101h200" stroke="#f6e7c4" strokeWidth="2" strokeDasharray="14 10" />
      <path
        d="M40 82v-12c0-4 3-7 7-8l16-3 14-14c3-3 6-4 10-4h30c5 0 9 2 12 6l12 15 8 2c4 1 6 4 6 8v10Z"
        fill="#c4572b"
      />
      <path d="M78 46h30l-2 20H70Zm38 0h14l12 16h-26Z" fill="#dff0ea" />
      <circle cx="70" cy="86" r="11" fill="#1f2f2a" />
      <circle cx="70" cy="86" r="5" fill="#cfd8d3" />
      <circle cx="140" cy="86" r="11" fill="#1f2f2a" />
      <circle cx="140" cy="86" r="5" fill="#cfd8d3" />
    </>
  ),
  laptop: (
    <>
      <rect width="200" height="110" fill="#e4ecf7" />
      <circle cx="30" cy="26" r="12" fill="#f3d79a" />
      <rect x="52" y="22" width="96" height="62" rx="5" fill="#2d3b4a" />
      <rect x="58" y="28" width="84" height="50" rx="2" fill="#dff0ff" />
      <path d="M66 66l16-14 12 10 18-22 22 26Z" fill="#7bbf94" />
      <circle cx="122" cy="40" r="5" fill="#e8b04f" />
      <path d="M36 84h128l10 10c1 2 0 4-3 4H29c-3 0-4-2-3-4Z" fill="#aeb9c4" />
      <rect x="86" y="88" width="28" height="4" rx="2" fill="#8a96a1" />
    </>
  ),
  phone: (
    <>
      <rect width="200" height="110" fill="#efe6f7" />
      <circle cx="160" cy="26" r="12" fill="#f3d79a" />
      <rect x="74" y="8" width="52" height="96" rx="9" fill="#2d3b4a" />
      <rect x="79" y="16" width="42" height="80" rx="4" fill="#fdf6e6" />
      <rect x="86" y="24" width="28" height="18" rx="3" fill="#7bbf94" />
      <rect x="86" y="48" width="28" height="6" rx="3" fill="#c9d8d0" />
      <rect x="86" y="60" width="20" height="6" rx="3" fill="#c9d8d0" />
      <circle cx="100" cy="82" r="5" fill="#e8b04f" />
    </>
  ),
  bike: (
    <>
      <rect width="200" height="110" fill="#e6f0ea" />
      <circle cx="30" cy="28" r="12" fill="#f3d79a" />
      <rect x="0" y="92" width="200" height="18" fill="#a9d3b8" />
      <circle cx="62" cy="76" r="22" fill="none" stroke="#1f2f2a" strokeWidth="4" />
      <circle cx="140" cy="76" r="22" fill="none" stroke="#1f2f2a" strokeWidth="4" />
      <path
        d="M62 76 88 44h28l24 32M88 44l16 32H62M116 44l-4-12h12"
        fill="none"
        stroke="#c4572b"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  study: (
    <>
      <rect width="200" height="110" fill="#e4ecf7" />
      <path d="M100 18 28 48l72 30 72-30Z" fill="#2d3b4a" />
      <path d="M58 62v22c0 8 20 16 42 16s42-8 42-16V62l-42 18Z" fill="#3f5568" />
      <path d="M172 48v32" stroke="#e8b04f" strokeWidth="4" />
      <circle cx="172" cy="84" r="6" fill="#e8b04f" />
      <path
        d="M100 18l72 30-72 30L28 48Z"
        fill="none"
        stroke="#e4ecf7"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </>
  ),
  shield: (
    <>
      <rect width="200" height="110" fill="#e6f0ea" />
      <circle cx="40" cy="26" r="12" fill="#f3d79a" />
      <path d="M100 10 148 26v34c0 22-20 38-48 46-28-8-48-24-48-46V26Z" fill="#3f7d68" />
      <path d="M100 18 140 31v29c0 18-16 31-40 38-24-7-40-20-40-38V31Z" fill="#7bbf94" />
      <path
        d="M80 58l14 14 28-30"
        fill="none"
        stroke="#fdf6e6"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  gift: (
    <>
      <rect width="200" height="110" fill="#f7e8ee" />
      <circle cx="162" cy="26" r="12" fill="#f3d79a" />
      <rect x="62" y="50" width="76" height="52" rx="4" fill="#c4572b" />
      <rect x="56" y="38" width="88" height="18" rx="4" fill="#d96f3e" />
      <rect x="94" y="38" width="12" height="64" fill="#f3d79a" />
      <path
        d="M100 38c-10-20-34-18-30-6 4 8 20 6 30 6ZM100 38c10-20 34-18 30-6-4 8-20 6-30 6Z"
        fill="none"
        stroke="#f3d79a"
        strokeWidth="5"
      />
    </>
  ),
};

export default function GoalArt({ scene, className = 'goal-art' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 110"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {SCENES[scene] ?? SCENES.mountain}
    </svg>
  );
}
