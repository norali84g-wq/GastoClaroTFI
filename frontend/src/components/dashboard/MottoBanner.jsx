import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BANNER_PHOTO } from '../../config/constants';
import BannerArt from '../ui/BannerArt';

// Cierre de Inicio: un paisaje con el lema de la marca. Si la foto no está, se ve la ilustración.
export default function MottoBanner() {
  const { t } = useTranslation();
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <aside className="motto-banner">
      {photoFailed ? (
        <BannerArt />
      ) : (
        <img
          className="banner-photo"
          src={BANNER_PHOTO}
          alt=""
          loading="lazy"
          onError={() => setPhotoFailed(true)}
        />
      )}
      <p className="motto-banner__text">
        <span>{t('brand.mottoQuote')}</span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </p>
    </aside>
  );
}
