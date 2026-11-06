import { useCallback, useEffect, useState } from 'react';
import { logError } from '../utils/logger';

// Pide un dato a la API y expone sus estados: isLoading, error (el ApiError) y data.
// - load({ signal }) hace el pedido. Tiene que ser estable (de useCallback o de módulo): cada vez
//   que cambia se vuelve a pedir, y la respuesta del pedido anterior se cancela y se descarta.
// - retry() repite el último pedido.
// - setData(update) modifica el dato ya cargado, por ejemplo para agregar lo recién creado.
// El dato vive en el componente que usa el hook: al desmontarse (por ejemplo, al cerrar sesión) se
// pierde, y nada de un usuario queda a la vista del siguiente.
export function useRemoteData(load) {
  const [attempt, setAttempt] = useState(0);
  // A qué pedido corresponde el resultado: si no es el actual, todavía se está cargando.
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal }).then(
      (data) => setResult({ load, attempt, data, error: null }),
      (error) => {
        if (error?.name === 'AbortError') return;
        logError(error);
        setResult({ load, attempt, data: undefined, error });
      },
    );
    return () => controller.abort();
  }, [load, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  const setData = useCallback(
    (update) => setResult((current) => current && { ...current, data: update(current.data) }),
    [],
  );

  const isCurrent = result?.load === load && result?.attempt === attempt;
  return {
    data: isCurrent ? result.data : undefined,
    error: isCurrent ? result.error : null,
    isLoading: !isCurrent,
    retry,
    setData,
  };
}
