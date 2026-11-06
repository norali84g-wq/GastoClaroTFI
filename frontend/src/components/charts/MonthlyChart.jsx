import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { CHART_SERIES_COLORS } from '../../config/constants';
import { formatAmount, formatCompactAmount, formatMonthShort } from '../../utils/format';

const WIDTH = 600;
const HEIGHT = 230;
const MARGIN = { top: 12, right: 8, bottom: 30, left: 64 };
const BAR_WIDTH = 20;
const BAR_GAP = 4;
const SERIES = ['income', 'consumption', 'savings'];

// Barras agrupadas por mes: ingresos, consumo y ahorro. Los valores negativos se dibujan en cero (la
// tabla de al lado tiene los importes exactos). La leyenda dice qué es cada color.
export default function MonthlyChart({ months }) {
  const { t } = useTranslation();
  const gradientId = useId();
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const max = Math.max(1, ...months.flatMap((m) => SERIES.map((key) => m[key])));
  const groupWidth = plotWidth / months.length;
  // Las barras se achican si hay muchos meses (un año entero), para que no se pisen.
  const barWidth = Math.min(
    BAR_WIDTH,
    Math.max(4, (groupWidth * 0.8 - 2 * BAR_GAP) / SERIES.length),
  );
  const clusterWidth = SERIES.length * barWidth + (SERIES.length - 1) * BAR_GAP;
  const ticks = [0, 0.5, 1];
  const description = months
    .map(
      (m) =>
        `${formatMonthShort(m.month)}: ${formatAmount(m.income)}, ${formatAmount(m.consumption)}, ${formatAmount(m.savings)}`,
    )
    .join('; ');

  return (
    <figure className="monthly-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${t('dashboard.chart.label')}. ${description}`}
      >
        <defs>
          {SERIES.map((key) => (
            <linearGradient key={key} id={`${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={CHART_SERIES_COLORS[key]} stopOpacity="1" />
              <stop offset="1" stopColor={CHART_SERIES_COLORS[key]} stopOpacity="0.55" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((tick) => {
          const y = MARGIN.top + plotHeight * (1 - tick);
          return (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={y}
                y2={y}
                className="monthly-chart__grid"
              />
              <text x={MARGIN.left - 8} y={y + 4} textAnchor="end" className="monthly-chart__tick">
                {formatCompactAmount(max * tick)}
              </text>
            </g>
          );
        })}
        {months.map((month, index) => {
          const start = MARGIN.left + index * groupWidth + (groupWidth - clusterWidth) / 2;
          return (
            <g key={month.month}>
              {SERIES.map((key, i) => {
                const height = (Math.max(month[key], 0) / max) * plotHeight;
                return (
                  <rect
                    key={key}
                    x={start + i * (barWidth + BAR_GAP)}
                    y={MARGIN.top + plotHeight - height}
                    width={barWidth}
                    height={height}
                    rx="6"
                    fill={`url(#${gradientId}-${key})`}
                    className="chart-bar"
                  >
                    <title>{`${t(`dashboard.summary.${key}`)}: ${formatAmount(month[key])}`}</title>
                  </rect>
                );
              })}
              <text
                x={start + clusterWidth / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="monthly-chart__tick"
              >
                {formatMonthShort(month.month)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <ul className="chart-legend">
          {SERIES.map((key) => (
            <li key={key}>
              <span
                className="chart-legend__swatch"
                style={{ background: CHART_SERIES_COLORS[key] }}
                aria-hidden="true"
              />
              {t(`dashboard.summary.${key}`)}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
