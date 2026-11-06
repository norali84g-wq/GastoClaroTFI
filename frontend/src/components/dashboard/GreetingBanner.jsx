import { useTranslation } from 'react-i18next';
import { useSession } from '../../hooks/useSession';
import { currentPeriod } from '../../utils/dates';
import { formatPeriod } from '../../utils/format';

function displayName(user) {
  const name = user?.user ?? '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Saludo de Inicio con el mes en curso y el lema de la marca.
export default function GreetingBanner() {
  const { t } = useTranslation();
  const { user } = useSession();

  return (
    <div className="greeting">
      <div>
        <p className="greeting__hello">{t('dashboard.greeting', { name: displayName(user) })}</p>
        <p className="greeting__sub">{t('dashboard.greetingSubtitle')}</p>
      </div>
      <p className="greeting__month">{formatPeriod(currentPeriod())}</p>
    </div>
  );
}
