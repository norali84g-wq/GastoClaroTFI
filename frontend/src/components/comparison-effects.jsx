import { effectSegments, relativeChange } from '../domain/comparison.js';
import { text } from '../texts.js';
import { Chanchito } from './chanchito.jsx';
import { formatMoney } from './common.jsx';
import { Icono } from './icono.jsx';

const percent = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 });
const month = new Intl.DateTimeFormat('es-AR', { month: 'long', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function changeTone(value) {
  return Number(value) < 0 ? 'down' : Number(value) > 0 ? 'up' : 'flat';
}

export function Trend({ value, unavailable = text.noBaseAmount }) {
  if (value == null) return <span className="gc-trend gc-trend-flat">{unavailable}</span>;

  const tone = changeTone(value);
  const arrow = { up: '↑', down: '↓', flat: '→' }[tone];
  const label =
    value === 0
      ? percent.format(0)
      : text.comparisonRelative(percent.format(Math.abs(value)), value < 0);

  return (
    <span className={`gc-trend gc-trend-${tone}`}>
      <span aria-hidden="true">{arrow}</span> {label}
    </span>
  );
}

function monthLabel(period, includeYear) {
  return (includeYear ? monthYear : month).format(new Date(`${period}-01T00:00:00Z`));
}

export function ComparisonSummary({ before, after, fromPeriod, toPeriod, currentPeriod }) {
  const difference = Number(after) - Number(before);
  const change = relativeChange(before, after);
  const tone = changeTone(difference);
  const pose = { down: 'feliz', up: 'preocupado', flat: 'pensativo' }[tone];
  const includeYear = fromPeriod.slice(0, 4) !== toPeriod.slice(0, 4);
  const from = monthLabel(fromPeriod, includeYear);
  const when =
    toPeriod === currentPeriod
      ? text.thisComparisonMonth
      : text.inComparisonMonth(monthLabel(toPeriod, includeYear));
  const amount =
    change == null ? formatMoney(Math.abs(difference)) : percent.format(Math.abs(change));

  return (
    <div className={`gc-comparison-summary gc-effect-${tone}`}>
      <Chanchito pose={pose} size={88} />
      <p>
        {difference === 0
          ? text.comparisonSummaryUnchanged(when, from)
          : text.comparisonSummary(when, amount, difference < 0, from)}
      </p>
    </div>
  );
}

const effects = [
  {
    key: 'price_effect',
    label: text.priceEffect,
    hint: text.comparisonPriceHint,
    icon: 'tarjeta',
    color: 'price',
  },
  {
    key: 'quantity_effect',
    label: text.quantityEffect,
    hint: text.comparisonQuantityHint,
    icon: 'supermercado',
    color: 'quantity',
  },
  {
    key: 'other_effect',
    label: text.otherEffect,
    hint: text.comparisonOtherHint,
    icon: 'bolsa',
    color: 'other',
  },
];

const signedMoney = (value) => `${Number(value) > 0 ? '+' : ''}${formatMoney(value)}`;

function EffectBar({ comparison }) {
  const values = effects.map(({ key }) => comparison[key]);
  const segments = effectSegments(values)
    .map((segment, index) => ({ ...segment, ...effects[index], value: values[index] }))
    .filter(({ width }) => width > 0);

  return (
    <figure className="gc-effects-figure">
      <figcaption>{text.comparisonComposition}</figcaption>
      {segments.length === 0 && <p>{text.comparisonNoEffects}</p>}
      <div className="gc-effect-chart" aria-hidden="true" style={{ '--rows': segments.length }}>
        {segments.map(({ key, start, width, color, value }, index) => {
          const midpoint = start + width / 2;
          return (
            <div
              className={`gc-effect-series-${color}`}
              key={key}
              style={{
                '--start': `${start}%`,
                '--width': `${width}%`,
                '--midpoint': `${midpoint}%`,
                '--row': index,
              }}
            >
              <span className="gc-effect-value">{signedMoney(value)}</span>
              <span className="gc-effect-guide" />
              <span className="gc-effect-segment" />
            </div>
          );
        })}
        <span className="gc-effect-zero" />
      </div>
      <ul className="records gc-effect-legend">
        {effects.map(({ key, label, color }) => (
          <li className={`gc-effect-series-${color}`} key={key}>
            <span className="gc-effect-swatch" aria-hidden="true" />
            <span>
              {label} <strong>{signedMoney(comparison[key])}</strong>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function ComparisonEffects({ comparison, fromPeriod, toPeriod }) {
  const difference = Number(comparison.difference);
  const baseline = monthLabel(fromPeriod, fromPeriod.slice(0, 4) !== toPeriod.slice(0, 4));
  const hint =
    difference === 0
      ? text.comparisonEqualAmount(baseline)
      : text.comparisonAmount(formatMoney(Math.abs(difference)), difference < 0, baseline);
  const cards = [{ key: 'difference', label: text.variation, hint, icon: 'ahorro' }, ...effects];

  return (
    <div className="gc-comparison-effects">
      <div className="gc-effect-cards">
        {cards.map(({ key, label, hint: description, icon }) => (
          <article className={`gc-effect-card gc-effect-${changeTone(comparison[key])}`} key={key}>
            <Icono clave={icon} size={58} />
            <div>
              <span className="gc-effect-label">{label}</span>
              <strong>{signedMoney(comparison[key])}</strong>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
      <EffectBar comparison={comparison} />
    </div>
  );
}

export function CategoryMiniBars({ before, after, from, to }) {
  const largest = Math.max(Number(before), Number(after), 1);
  return (
    <span className="gc-category-mini">
      {[
        [from, before, 'base'],
        [to, after, 'current'],
      ].map(([period, amount, kind]) => (
        <span className="gc-mini-row" key={period}>
          <span>{period}</span>
          <span className="gc-mini-track" aria-hidden="true">
            <span
              className={`gc-mini-${kind}`}
              style={{ width: `${(Number(amount) / largest) * 100}%` }}
            />
          </span>
          <strong>{formatMoney(amount)}</strong>
        </span>
      ))}
    </span>
  );
}
