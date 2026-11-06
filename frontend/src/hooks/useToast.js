import { useCallback, useEffect, useRef, useState } from 'react';
import { TOAST_DURATION_MS, TOAST_TONE } from '../config/constants';

// Aviso flotante que se muestra con el componente Toast.
// - show(message, { tone }) lo muestra y devuelve una promesa que se resuelve cuando el aviso
//   termina. Si ya había otro, ese termina primero. `message` puede ser un texto o una lista.
//   Una confirmación (tone SUCCESS, por defecto) se cierra sola a los TOAST_DURATION_MS; un error
//   (tone ERROR) queda hasta que se cierra a mano o lo reemplaza otro aviso, para que nadie se lo
//   pierda.
// - pause() y resume() frenan la cuenta y la vuelven a arrancar, para que el aviso no desaparezca
//   mientras el puntero o el foco están sobre él.
// Si el componente se desmonta (por ejemplo, al cerrar sesión), el aviso no termina y lo que
// esperaba su cierre no se ejecuta.
export function useToast() {
  const [toast, setToast] = useState(null);
  // El aviso en pantalla: { timer, resolve, autoClose }.
  const pendingRef = useRef(null);

  const close = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    setToast(null);
    pending.resolve();
  }, []);

  const show = useCallback(
    (message, { tone = TOAST_TONE.SUCCESS } = {}) => {
      close();
      const autoClose = tone !== TOAST_TONE.ERROR;
      return new Promise((resolve) => {
        pendingRef.current = {
          resolve,
          autoClose,
          timer: autoClose ? setTimeout(close, TOAST_DURATION_MS) : undefined,
        };
        setToast({ message, tone });
      });
    },
    [close],
  );

  const pause = useCallback(() => clearTimeout(pendingRef.current?.timer), []);

  const resume = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending?.autoClose) return;
    clearTimeout(pending.timer);
    pending.timer = setTimeout(close, TOAST_DURATION_MS);
  }, [close]);

  // Al desmontarse, la cuenta se frena para siempre.
  useEffect(() => pause, [pause]);

  return { toast, show, close, pause, resume };
}
