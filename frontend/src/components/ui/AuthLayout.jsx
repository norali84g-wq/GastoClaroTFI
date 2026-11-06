import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { LOGIN_HERO_IMAGE } from '../../config/constants';
import AuthIllustration from './AuthIllustration';

// Pantallas sin sesión (ingreso y registro): a la izquierda la marca con su lema y una ilustración;
// a la derecha, el contenido (la tarjeta del formulario).
export default function AuthLayout({ children }) {
  const { t } = useTranslation();
  // Si la foto no está o no carga, queda la ilustración de abajo.
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <div className="auth-layout">
      <aside className="auth-hero">
        <AuthIllustration />
        {!photoFailed && (
          <img
            className="auth-hero__photo"
            src={LOGIN_HERO_IMAGE}
            alt=""
            onError={() => setPhotoFailed(true)}
          />
        )}
        <div className="auth-hero__text">
          <p className="auth-hero__tagline">{t('brand.tagline')}</p>
          <p className="auth-hero__motto">{t('brand.motto')}</p>
        </div>
      </aside>
      <div className="auth-layout__content">{children}</div>
    </div>
  );
}
