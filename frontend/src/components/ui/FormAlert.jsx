import { useTranslation } from 'react-i18next';
import Button from './Button';
import ErrorMessage from './ErrorMessage';

// Aviso general arriba de un formulario. Puede recibir el foco después de un error (tabIndex -1)
// y, si se pasa onRetry, ofrece reintentar. `tone` solo cambia el aspecto: 'error' o 'warning'.
export default function FormAlert({ ref, messages, onRetry, tone = 'error' }) {
  const { t } = useTranslation();
  const list = [].concat(messages ?? []).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <div ref={ref} className={`form-alert form-alert--${tone}`} tabIndex={-1}>
      <ErrorMessage messages={list} />
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
