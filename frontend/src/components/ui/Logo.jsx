import { useTranslation } from 'react-i18next';

// Hoja que nace de un gráfico de barras: crecimiento + organización. SVG simple y liviano.
export function LogoSymbol({ size = 36, tone = 'dark' }) {
  const leaf = tone === 'light' ? '#dcebe2' : '#3f7d68';
  const bars = tone === 'light' ? '#ffffff' : '#174738';
  return (
    <svg
      className="brand__symbol"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M44 4C22 4 4 14 4 30c0 8 6 14 14 14 18 0 26-18 26-40Z" fill={leaf} />
      <rect x="12" y="26" width="6" height="12" rx="2" fill={bars} />
      <rect x="21" y="19" width="6" height="19" rx="2" fill={bars} />
      <rect x="30" y="11" width="6" height="27" rx="2" fill={bars} />
    </svg>
  );
}

export default function Logo({ tone = 'dark', size = 36 }) {
  const { t } = useTranslation();
  return (
    <span className="app-header__brand">
      <LogoSymbol size={size} tone={tone} />
      <span className="brand__name">{t('app.name')}</span>
    </span>
  );
}
