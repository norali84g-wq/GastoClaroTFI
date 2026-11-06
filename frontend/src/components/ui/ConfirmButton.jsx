import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

// Botón para una acción que no se deshace, como borrar. El primer clic no la hace: en su lugar
// aparece la pregunta `question` con el botón `confirmLabel` y Cancelar. El foco va a Cancelar, así
// apretar Enter dos veces no hace nada irreversible; Escape también cancela. Al cancelar, el foco
// vuelve al botón. onConfirm() puede devolver una promesa: mientras tanto, confirmar queda ocupado.
// Si al terminar el botón sigue en pantalla (por ejemplo, porque la acción falló), vuelve a verse
// el botón con el foco. El resto de las props (aria-label, por ejemplo) van al botón.
export default function ConfirmButton({ children, question, confirmLabel, onConfirm, ...props }) {
  const { t } = useTranslation();
  const questionId = useId();
  const [isAsking, setIsAsking] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const triggerRef = useRef(null);
  const cancelRef = useRef(null);
  const wasAskingRef = useRef(false);

  useEffect(() => {
    if (isAsking) cancelRef.current?.focus();
    else if (wasAskingRef.current) triggerRef.current?.focus();
    wasAskingRef.current = isAsking;
  }, [isAsking]);

  async function confirm() {
    setIsWorking(true);
    try {
      await onConfirm();
    } finally {
      setIsWorking(false);
      setIsAsking(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && !isWorking) setIsAsking(false);
  }

  if (!isAsking) {
    return (
      <Button ref={triggerRef} variant="secondary" onClick={() => setIsAsking(true)} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <div role="group" aria-labelledby={questionId} className="confirm-action">
      <p id={questionId}>{question}</p>
      <div className="confirm-action__buttons">
        <Button isLoading={isWorking} onClick={confirm} onKeyDown={handleKeyDown}>
          {confirmLabel}
        </Button>
        <Button
          ref={cancelRef}
          variant="secondary"
          disabled={isWorking}
          onClick={() => setIsAsking(false)}
          onKeyDown={handleKeyDown}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
