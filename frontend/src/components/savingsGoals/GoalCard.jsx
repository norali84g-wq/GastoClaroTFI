import { useTranslation } from 'react-i18next';
import { formatAmount } from '../../utils/format';
import { goalScene } from '../../utils/goals';
import { GOAL_PHOTOS } from '../../config/constants';
import GoalPhoto from '../ui/GoalPhoto';

// Tarjeta de una meta: ilustración, nombre, avance (que calcula la API) y montos.
export default function GoalCard({ goal }) {
  const { t } = useTranslation();
  const missing = Math.max(goal.targetAmount - goal.savedAmount, 0);

  return (
    <li className="goal-card">
      <GoalPhoto scene={goalScene(goal)} src={GOAL_PHOTOS[goalScene(goal)]} />
      <div className="goal-card__body">
        <h3>{goal.name}</h3>
        <p className="goal-card__percentage">
          {t('dashboard.goals.progress', { percentage: `${goal.progressPercentage} %` })}
        </p>
        <div className="goal-card__track" aria-hidden="true">
          <div
            className="goal-card__fill"
            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
          />
        </div>
        <p className="goal-card__amounts">
          <span>
            {t('dashboard.goals.saved')}: <strong>{formatAmount(goal.savedAmount)}</strong>
          </span>
          <span className="muted">
            {t('dashboard.goals.target')}: {formatAmount(goal.targetAmount)}
          </span>
        </p>
        <p className="muted goal-card__missing">
          {missing > 0
            ? t('dashboard.goals.missing', { amount: formatAmount(missing) })
            : t('dashboard.goals.completed')}
        </p>
      </div>
    </li>
  );
}
