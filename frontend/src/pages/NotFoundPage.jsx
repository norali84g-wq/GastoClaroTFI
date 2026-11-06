import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/constants';
import PageHeader from '../components/ui/PageHeader';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="page page--narrow">
      <PageHeader eyebrow={t('app.name')} title={t('notFound.title')} />
      <p>{t('notFound.description')}</p>
      <Link className="button button--primary" to={ROUTES.HOME}>
        {t('notFound.goHome')}
      </Link>
    </section>
  );
}
