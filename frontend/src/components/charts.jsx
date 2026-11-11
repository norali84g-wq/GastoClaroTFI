import { CategoriaIcono } from './categoria-icono.jsx';
import { formatMoney } from './common.jsx';
import { Status } from './chanchito.jsx';
import { text } from '../texts.js';

const categoryColors = ['#296434', '#668b29', '#b98016', '#b2563b', '#4d7779', '#87785c'];

export function CategoryBreakdown({ categories, total }) {
  const visible = categories.filter((item) => Number(item.total) > 0);
  if (!visible.length || !total) return <Status message={text.noCategoryStatistics} />;
  const percent = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
  let offset = 0;
  const slices = visible.map((item, index) => {
    const percentage = (Number(item.total) / total) * 100;
    const slice = {
      ...item,
      percentage,
      offset,
      color: categoryColors[index % categoryColors.length],
    };
    offset += percentage;
    return slice;
  });

  return (
    <div className="gc-category">
      <div className="gc-donut">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {slices.map(({ category_id, percentage, offset: start, color }) => (
            <circle
              key={category_id}
              cx="50"
              cy="50"
              r="40"
              pathLength="100"
              fill="none"
              stroke={color}
              strokeWidth="16"
              strokeDasharray={`${percentage} 100`}
              strokeDashoffset={-start}
              transform="rotate(-90 50 50)"
            />
          ))}
        </svg>
        <strong className="gc-donut-total">{formatMoney(total)}</strong>
      </div>
      <ul className="gc-category-legend">
        {slices.map(
          ({ category_id, category, percentage, reportedPercentage, color, total: amount }) => (
            <li key={category_id}>
              <CategoriaIcono nombre={category} id={category_id} color={color} />
              <span>
                {category}
                <small>{formatMoney(amount)}</small>
              </span>
              <strong>{percent.format(reportedPercentage ?? percentage)}%</strong>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

const historySeries = [
  { field: 'income', label: text.dashboardIncome, tone: 'income' },
  { field: 'consumption', label: text.dashboardConsumption, tone: 'consumption' },
  { field: 'savings', label: text.dashboardSavings, tone: 'savings' },
];

const chartMonth = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' });

export function MonthlyHistory({ months, title = text.moneyHistory }) {
  const values = months.flatMap((month) => historySeries.map(({ field }) => Number(month[field])));
  if (!values.some((value) => value !== 0)) {
    return (
      <section className="panel dashboard-card">
        <h2>{title}</h2>
        <Status message={text.noHistory} />
      </section>
    );
  }

  const min = Math.min(0, ...values);
  const range = Math.max(0, ...values) - min || 1;
  const monthLabel = (month) => chartMonth.format(new Date(`${month}-01T00:00:00Z`));

  return (
    <section className="panel dashboard-card gc-history">
      <h2>{title}</h2>
      <ul className="gc-chart-legend">
        {historySeries.map(({ field, label, tone }) => (
          <li className={tone} key={field}>
            {label}
          </li>
        ))}
      </ul>
      <svg viewBox="0 0 360 132" aria-hidden="true">
        <path className="gc-chart-axis" d="M12 12v104h336" />
        <line
          className="gc-chart-axis"
          x1="12"
          x2="348"
          y1={116 + (min / range) * 104}
          y2={116 + (min / range) * 104}
        />
        {historySeries.map(({ field, tone }) => {
          const points = months.map((month, index) => {
            const x = months.length === 1 ? 180 : 12 + (index / (months.length - 1)) * 336;
            const y = 116 - ((Number(month[field]) - min) / range) * 104;
            return [x, y];
          });
          return (
            <g className={tone} key={field}>
              <polyline points={points.map((point) => point.join(',')).join(' ')} />
              {points.map(([x, y], index) => (
                <circle key={months[index].month} cx={x} cy={y} r="3" />
              ))}
            </g>
          );
        })}
      </svg>
      <ul className="gc-chart-months" aria-hidden="true">
        {months.map(({ month }) => (
          <li key={month}>{monthLabel(month)}</li>
        ))}
      </ul>
      <details>
        <summary>{text.historyDetails}</summary>
        <div className="gc-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{text.period}</th>
                {historySeries.map(({ field, label }) => (
                  <th scope="col" key={field}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.month}>
                  <th scope="row">{monthLabel(month.month)}</th>
                  {historySeries.map(({ field }) => (
                    <td key={field}>{formatMoney(month[field])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function ComparisonBars({ categories, from, to }) {
  if (!categories.length) return null;
  const largest = Math.max(
    1,
    ...categories.flatMap((item) => [Number(item.from_total), Number(item.to_total)]),
  );
  return (
    <section className="panel gc-comparison-chart">
      <h2>{text.consumptionByCategory}</h2>
      <ul className="gc-chart-legend">
        <li className="comparison-base">{from}</li>
        <li className="comparison-current">{to}</li>
      </ul>
      <ul className="records">
        {categories.map((item) => (
          <li key={item.category.id}>
            <div className="gc-category-heading">
              <CategoriaIcono nombre={item.category.name} id={item.category.id} />
              <strong>{item.category.name}</strong>
            </div>
            <svg viewBox="0 0 320 24" aria-hidden="true">
              <rect
                className="comparison-base"
                y="1"
                height="9"
                rx="3"
                width={(Number(item.from_total) / largest) * 320}
              />
              <rect
                className="comparison-current"
                y="14"
                height="9"
                rx="3"
                width={(Number(item.to_total) / largest) * 320}
              />
            </svg>
            <small>
              {from} · {formatMoney(item.from_total)} / {to} · {formatMoney(item.to_total)}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
