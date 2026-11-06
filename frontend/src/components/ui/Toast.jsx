import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TOAST_TONE } from '../../config/constants';
import Button from './Button';
import ErrorMessage from './ErrorMessage';

// Variable CSS con el lugar que ocupa el aviso desde el borde de abajo de la pantalla. Con ella, la
// página reserva ese alto al final y el foco no queda debajo del aviso (ver index.css).
const TOAST_SPACE_PROPERTY = '--toast-space';

// Aviso flotante; lo maneja useToast. Una confirmación vive en una región role="status" que está
// siempre en la página: así los lectores de pantalla la anuncian al aparecer, sin mover el foco de
// donde está el usuario. Un error se muestra con ErrorMessage (role="alert"), que se anuncia apenas
// aparece, y puede traer varios mensajes.
// Como un error queda a la vista hasta que se cierra, no puede tapar nada: mientras hay un aviso,
// se informa su alto para que la página se pueda desplazar por encima de él.
export default function Toast({ toast, onClose, onPause, onResume }) {
  const { t } = useTranslation();
  const isError = toast?.tone === TOAST_TONE.ERROR;
  const regionRef = useRef(null);

  useLayoutEffect(() => {
    if (!toast) return undefined;
    const root = document.documentElement;
    // La región no se anima (el aviso sí), así que su borde de arriba es el definitivo.
    const update = () => {
      const space = window.innerHeight - regionRef.current.getBoundingClientRect().top;
      root.style.setProperty(TOAST_SPACE_PROPERTY, `${Math.max(space, 0)}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      root.style.removeProperty(TOAST_SPACE_PROPERTY);
    };
  }, [toast]);

  return (
    <div ref={regionRef} className="toast-region">
      <div
        className={toast ? `toast toast--${toast.tone}` : undefined}
        onMouseEnter={onPause}
        onMouseLeave={onResume}
        onFocus={onPause}
        onBlur={onResume}
      >
        <p className={isError ? 'visually-hidden' : 'toast__message'} role="status">
          {isError ? null : toast?.message}
        </p>
        {isError && (
          <div className="toast__message">
            <ErrorMessage messages={toast.message} />
          </div>
        )}
        {toast && (
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        )}
      </div>
    </div>
  );
}
