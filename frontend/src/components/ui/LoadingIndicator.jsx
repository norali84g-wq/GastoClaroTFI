import { useTranslation } from 'react-i18next';

export default function LoadingIndicator({ label }) {
  const { t } = useTranslation();

  return (
    <div className="loading-indicator" role="status">
      <span className="loading-indicator__spinner" aria-hidden="true" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}
