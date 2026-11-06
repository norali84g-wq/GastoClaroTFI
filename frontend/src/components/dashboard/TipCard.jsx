import { useTranslation } from 'react-i18next';
import { tipIndex } from '../../utils/tips';
import TitleIcon from '../ui/TitleIcon';

// Un consejo de hábitos financieros que cambia cada día, con la frase de la marca al costado.
export default function TipCard() {
  const { t } = useTranslation();
  const tips = t('dashboard.tipCard.items', { returnObjects: true });
  const tip = Array.isArray(tips) ? tips[tipIndex(new Date(), tips.length)] : null;
  if (!tip) return null;

  return (
    <aside className="tip-card">
      <div className="tip-card__header">
        <TitleIcon name="leaf" tone="violet" />
        <h3>{t('dashboard.tipCard.title')}</h3>
      </div>
      <p className="tip-card__text">{tip}</p>
      <p className="tip-card__phrase">{t('dashboard.tipCard.phrase')}</p>
    </aside>
  );
}
