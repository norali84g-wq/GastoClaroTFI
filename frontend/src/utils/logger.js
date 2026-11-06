// Registra un error en la consola. Todo error que se le avisa al usuario pasa también por acá. Los
// de la API se registran con su estado y los errores que trajo, para poder reconstruir qué pasó.
export function logError(error) {
  if (error?.name === 'ApiError') {
    console.error(`[GastoClaro] API ${error.status}`, error.errors, error);
  } else {
    console.error('[GastoClaro]', error);
  }
}
