// Íconos redondos y de color para los títulos de las tarjetas de Inicio.
const ICONS = {
  bars: 'M5 20V10M12 20V4M19 20v-8',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  pie: 'M12 3v9h9A9 9 0 1 1 12 3zM15 3.5A9 9 0 0 1 20.5 9H15z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5v1',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3Z',
  leaf: 'M5 19C5 10 11 5 20 4c0 9-5 15-14 15zM5 19c3-5 6-8 11-11',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  warning: 'M12 4 2.5 20h19zM12 10v4M12 17h.01',
  alert: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v6M12 16.5h.01',
  goals: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
};

export default function TitleIcon({ name, tone = 'green' }) {
  return (
    <span className={`title-icon title-icon--${tone}`} aria-hidden="true">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        <path d={ICONS[name]} />
      </svg>
    </span>
  );
}
