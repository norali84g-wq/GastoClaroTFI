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
