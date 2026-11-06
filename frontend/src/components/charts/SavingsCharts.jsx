import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { CHART_SERIES_COLORS } from '../../config/constants';
import { formatAmount, formatCompactAmount, formatMonthShort } from '../../utils/format';

const WIDTH = 600;
const HEIGHT = 200;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 64 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const MAX_MONTHS = 12;

function Axes({ months, max }) {
  return (
    <>
      {[0, 0.5, 1].map((tick) => {
        const y = MARGIN.top + PLOT_HEIGHT * (1 - tick);
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
      {months.map((month, index) => (
        <text
          key={month.month}
          x={MARGIN.left + (index + 0.5) * (PLOT_WIDTH / months.length)}
          y={HEIGHT - 8}
          textAnchor="middle"
          className="monthly-chart__tick"
        >
          {formatMonthShort(month.month)}
        </text>
      ))}
    </>
  );
}

function describe(months, key) {
  return months.map((m) => `${formatMonthShort(m.month)}: ${formatAmount(m[key])}`).join('; ');
}

// Ahorro de cada mes (últimos 12), en barras. El valor negativo se dibuja en cero.
export function MonthlySavingsBars({ months }) {
  const { t } = useTranslation();
  const gradientId = useId();
  const shown = months.slice(-MAX_MONTHS);
  const max = Math.max(1, ...shown.map((m) => m.savings));
  const slot = PLOT_WIDTH / shown.length;
  const width = Math.min(slot * 0.6, 28);

  return (
    <figure className="monthly-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${t('savings.charts.monthly')}. ${describe(shown, 'savings')}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={CHART_SERIES_COLORS.savings} />
            <stop offset="1" stopColor={CHART_SERIES_COLORS.savings} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <Axes months={shown} max={max} />
        {shown.map((month, index) => {
          const height = (Math.max(month.savings, 0) / max) * PLOT_HEIGHT;
          return (
            <rect
              key={month.month}
              x={MARGIN.left + index * slot + (slot - width) / 2}
              y={MARGIN.top + PLOT_HEIGHT - height}
              width={width}
              height={height}
              rx="7"
              fill={`url(#${gradientId})`}
              className="chart-bar"
            >
              <title>{`${formatMonthShort(month.month)}: ${formatAmount(month.savings)}`}</title>
            </rect>
          );
        })}
      </svg>
    </figure>
  );
}

// Ahorro acumulado mes a mes (últimos 12), en línea con área.
export function AccumulatedLine({ months }) {
  const { t } = useTranslation();
  const gradientId = useId();
  const shown = months.slice(-MAX_MONTHS);
  const max = Math.max(1, ...shown.map((m) => m.accumulated));
  const slot = PLOT_WIDTH / shown.length;
  const points = shown.map((month, index) => ({
    x: MARGIN.left + (index + 0.5) * slot,
    y: MARGIN.top + PLOT_HEIGHT - (Math.max(month.accumulated, 0) / max) * PLOT_HEIGHT,
  }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const baseline = MARGIN.top + PLOT_HEIGHT;
  const area = `${points[0].x},${baseline} ${line} ${points.at(-1).x},${baseline}`;

  return (
    <figure className="monthly-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${t('savings.charts.accumulated')}. ${describe(shown, 'accumulated')}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={CHART_SERIES_COLORS.savings} stopOpacity="0.45" />
            <stop offset="1" stopColor={CHART_SERIES_COLORS.savings} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <Axes months={shown} max={max} />
        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={CHART_SERIES_COLORS.savings}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map(({ x, y }) => (
          <circle key={x} cx={x} cy={y} r="4" fill={CHART_SERIES_COLORS.savings} />
        ))}
      </svg>
    </figure>
  );
}
