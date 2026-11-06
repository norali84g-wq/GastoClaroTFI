import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from '../../config/constants';
import { formatAmount, formatCompactAmount, formatPercentage } from '../../utils/format';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_SLICES = 5;

// Agrupa lo que sobra de las primeras categorías en "otras", para que el gráfico no se llene.
function toSlices(categories, others) {
  const sorted = categories.filter(({ total }) => total > 0).toSorted((a, b) => b.total - a.total);
  const main = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES).reduce((sum, { total }) => sum + total, 0);
  const slices = main.map(({ category, total }) => ({ name: category, total }));
  if (rest > 0) slices.push({ name: others, total: rest });
  return slices;
}

// Gráfico de dona del consumo por categoría. Cada porción también se dice con texto en la lista de
// al lado (nombre, porcentaje e importe): el color solo no alcanza.
export default function CategoryDonut({ categories, total }) {
  const { t } = useTranslation();
  const slices = toSlices(categories, t('dashboard.donut.others'));
  // Las porciones se reparten sobre lo que muestran (la suma de las categorías), así la dona siempre
  // cierra el círculo; en el centro va el consumo del mes.
  const sliced = slices.reduce((sum, { total: amount }) => sum + amount, 0);
  if (slices.length === 0 || sliced <= 0) return null;

  const arcs = slices.map((slice, index) => {
    // Cada porción arranca donde terminan las anteriores.
    const before = slices.slice(0, index).reduce((sum, { total: amount }) => sum + amount, 0);
    return {
      ...slice,
      length: (slice.total / sliced) * CIRCUMFERENCE,
      offset: (before / sliced) * CIRCUMFERENCE,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });
  const summary = arcs
    .map(({ name, total: amount }) => `${name} ${formatPercentage(amount / sliced)}`)
    .join(', ');

  return (
    <div className="donut">
      <svg
        className="donut__chart"
        viewBox="0 0 120 120"
        role="img"
        aria-label={t('dashboard.donut.label', { items: summary })}
      >
        {arcs.map(({ name, length, offset: start, color }) => (
          <circle
            key={name}
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeDasharray={`${Math.max(length - 1.5, 0)} ${CIRCUMFERENCE}`}
            strokeDashoffset={-start}
            transform="rotate(-90 60 60)"
          />
        ))}
        <text x="60" y="56" textAnchor="middle" className="donut__center-label">
          {t('dashboard.donut.center')}
        </text>
        <text x="60" y="72" textAnchor="middle" className="donut__center-value">
          {formatCompactAmount(total)}
        </text>
      </svg>
      <ul className="donut__legend">
        {arcs.map(({ name, total: amount, color }) => (
          <li key={name}>
            <span className="donut__swatch" style={{ background: color }} aria-hidden="true" />
            <span className="donut__name">{name}</span>
            <strong>{formatPercentage(amount / sliced)}</strong>
            <span className="muted donut__amount">{formatAmount(amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
