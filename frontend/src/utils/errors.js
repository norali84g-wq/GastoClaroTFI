import { HTTP_STATUS } from '../config/constants';

// Qué decirle al usuario según el estado HTTP cuando la API no mandó un mensaje propio. El 401 no
// está: cuando la sesión se cae, SessionProvider lleva al login con su propio aviso.
const STATUS_MESSAGE_KEYS = {
  [HTTP_STATUS.FORBIDDEN]: 'errors.forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'errors.notFound',
  [HTTP_STATUS.UNPROCESSABLE_CONTENT]: 'errors.validation',
};

// Mensaje para el estado de un error, o null si ese estado no tiene uno propio. `t` es la función
// de traducción.
export function statusMessage(error, t) {
  const key = STATUS_MESSAGE_KEYS[error?.status];
  return key ? t(key) : null;
}

// Mensajes para un pedido que falló fuera de un formulario (una carga, un borrado). Sin conexión, el
// mensaje genérico de red; ante cualquier otro problema, el de `messageKey` y, si el estado HTTP lo
// explica (sin permiso, no existe), también ese motivo.
export function requestErrorMessages(error, messageKey, t) {
  if (error.isNetworkError) return t('errors.network');
  return [t(messageKey), statusMessage(error, t)];
}
