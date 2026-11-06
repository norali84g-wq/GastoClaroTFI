import { useTranslation } from 'react-i18next';
import { pickAdvice } from '../../utils/advice';
import TitleIcon from '../ui/TitleIcon';

const TONE_ICON = { success: 'check', warning: 'warning', alert: 'alert', info: 'bulb' };

export default function AdviceCard({ summary, goals }) {
  const { t } = useTranslation();
  const { tone, text } = pickAdvice(summary, goals, t);

  return (
    <aside className={`advice-card advice-card--${tone}`}>
      <TitleIcon name={TONE_ICON[tone]} tone={tone} />
      <div className="advice-card__body">
        <p className="advice-card__badge">{t(`dashboard.advice.badge.${tone}`)}</p>
        <h3>{t('dashboard.advice.title')}</h3>
        <p>{text}</p>
      </div>
      <svg className="advice-card__leaves" viewBox="0 0 80 90" aria-hidden="true" focusable="false">
        <path d="M40 90C40 60 40 40 44 12" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M42 62C22 62 10 50 8 32c22-2 36 8 34 30Z" fill="currentColor" opacity="0.55" />
        <path d="M43 40c0-20 12-32 32-32 2 22-10 34-32 32Z" fill="currentColor" opacity="0.8" />
      </svg>
    </aside>
  );
}
