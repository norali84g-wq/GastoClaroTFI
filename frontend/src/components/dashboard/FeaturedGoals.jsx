import { useId } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/constants';
import GoalCard from '../savingsGoals/GoalCard';

const FEATURED_COUNT = 3;

// Las metas más recientes, con su foto y su avance. Es un adorno del Inicio: si las metas no cargan,
// no se muestra nada (en Metas de ahorro está el aviso de error completo).
export default function FeaturedGoals({ goals }) {
  const { t } = useTranslation();
  const titleId = useId();

  if (!goals || goals.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className="featured-goals">
      <div className="featured-goals__header">
        <h2 id={titleId}>{t('dashboard.goals.title')}</h2>
        <Link to={ROUTES.SAVINGS_GOALS}>{t('dashboard.goals.seeAll')}</Link>
      </div>
      <ul className="goal-cards">
        {goals.slice(0, FEATURED_COUNT).map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </ul>
    </section>
  );
}
