import { Link } from '@tanstack/react-router';
import { text } from '../texts.js';

const paths = {
  home: 'M3 11 12 4l9 7M6 10v10h12V10M10 20v-6h4v6',
  cart: 'M2 4h3l3 11h10l3-8H6M9 20h.01M18 20h.01',
  budget: 'M20 12a8 8 0 1 1-8-8m4 8a4 4 0 1 1-4-4m0 4 7-7m0 0V2m0 3h3',
  card: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 5h18M7 15h4',
  calendar: 'M4 5h16v15H4zM8 3v4m8-4v4M4 10h16m-12 5h3m3 0h2',
  wallet: 'M3 6h16v13H3zM3 6l13-3v3m3 5h2v4h-5v-4z',
  savings: 'M3 12h4l4-7 3 12 3-5h4M3 20h18',
  goal: 'M5 3h14v4c0 4-2 6-7 7-5-1-7-3-7-7zm0 2H2v2c0 3 2 4 5 4m12-6h3v2c0 3-2 4-5 4m-5 3v5m-4 2h8',
  chart: 'M4 20V4m0 16h16M8 16v-4m5 4V9m5 7V6',
  list: 'M8 5h12M8 12h12M8 19h12M4 5h.01M4 12h.01M4 19h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 6 0 0 1 16 0Z',
  plus: 'M12 4v16M4 12h16',
  more: 'M4 12h.01M12 12h.01M20 12h.01',
  pie: 'M11 3a9 9 0 1 0 10 10H11zm3 0v7h7a9 9 0 0 0-7-7Z',
  settings:
    'M10 3h4l1 3 3-1 2 3-2 2 1 3 3 1-1 4-3-1-2 2v2h-4l-1-2-3-1-2 1-2-3 2-2-1-3-2-1 1-3 3 1 3-2zm2 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  food: 'M4 3v6c0 2 2 3 3 3s3-1 3-3V3m-3 0v18m12-18c-3 2-4 5-4 9h4m0-9v18',
  transport: 'M4 16V6c0-2 2-3 8-3s8 1 8 3v10H4Zm0-6h16M7 16v4m10-4v4M7 13h.01M17 13h.01',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  leisure: 'M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM13 9v2m0 3v2',
  alert: 'M12 8v5m0 3h.01M12 3l10 17H2Z',
};

export function Icon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Brand({ to = '/', onClick }) {
  return (
    <Link className="brand" to={to} onClick={onClick}>
      <svg className="brand-mark" viewBox="0 0 42 42" aria-hidden="true">
        <path
          fill="currentColor"
          d="M40 2c-5 11-1 25-14 32C17 39 9 36 2 41c4-7 2-18 10-25C21 8 32 10 40 2Z"
        />
        <path fill="var(--brand-bars, #fffdf5)" d="M9 31h5v-6H9zm8-2h5V19h-5zm8-3h5V14h-5z" />
      </svg>
      <span>
        <strong>{text.brand}</strong>
        <small>{text.slogan}</small>
      </span>
    </Link>
  );
}
