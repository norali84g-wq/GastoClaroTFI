import { useId } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/constants';
import { formatAmount } from '../../utils/format';
import TitleIcon from '../ui/TitleIcon';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// La meta de ahorro más reciente con su avance en un anillo. El porcentaje lo calcula la API.
export default function SavingsRing({ goal }) {
  const { t } = useTranslation();
  const titleId = useId();
  const gradientId = useId();
  if (!goal) return null;
  const percentage = Math.min(Math.max(goal.progressPercentage, 0), 100);
  const missing = Math.max(goal.targetAmount - goal.savedAmount, 0);

  return (
    <section className="panel savings-ring" aria-labelledby={titleId}>
      <h3 id={titleId} className="panel-title">
        <TitleIcon name="target" tone="blue" />
        {t('dashboard.ring.title')}
      </h3>
      <div className="savings-ring__body">
        <svg
          viewBox="0 0 120 120"
          className="savings-ring__chart"
          role="img"
          aria-label={t('dashboard.goals.progress', { percentage: `${goal.progressPercentage} %` })}
        >
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            className="savings-ring__track"
            strokeWidth="13"
          />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2fae7a" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={`url(#${gradientId})`}
            className="savings-ring__value"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="68" textAnchor="middle" className="savings-ring__text">
            {goal.progressPercentage}%
          </text>
        </svg>
        <div className="savings-ring__info">
          <p className="savings-ring__goal">{t('dashboard.ring.goal', { name: goal.name })}</p>
          <p className="savings-ring__amount">{formatAmount(goal.targetAmount)}</p>
          <p className="muted">
            {missing > 0
              ? t('dashboard.goals.missing', { amount: formatAmount(missing) })
              : t('dashboard.goals.completed')}
          </p>
          <Link className="button button--secondary" to={ROUTES.SAVINGS_GOALS}>
            {t('dashboard.ring.see')}
          </Link>
        </div>
      </div>
    </section>
  );
}
