import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { clearToken, getToken, saveToken } from '../api/tokenStorage';
import { VALIDATE_SESSION_ON_START } from '../config/constants';
import { logError } from '../utils/logger';
import { SessionContext } from './sessionContext';

const STATUS = {
  CHECKING: 'checking',
  AUTHENTICATED: 'authenticated',
  ANONYMOUS: 'anonymous',
};

function initialStatus() {
  if (!getToken()) return STATUS.ANONYMOUS;
  return VALIDATE_SESSION_ON_START ? STATUS.CHECKING : STATUS.AUTHENTICATED;
}

export default function SessionProvider({ children }) {
  const [status, setStatus] = useState(initialStatus);
  const [user, setUser] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const startSession = useCallback(({ token, user: sessionUser }) => {
    saveToken(token);
    setUser(sessionUser);
    setStatus(STATUS.AUTHENTICATED);
    setSessionExpired(false);
  }, []);

  const endSession = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus(STATUS.ANONYMOUS);
  }, []);

  // Único lugar donde se maneja un 401: si un pedido hecho con el token vigente vuelve 401, la
  // sesión se cayó. ProtectedRoute lleva al login, que muestra el aviso de sesión vencida.
  useEffect(
    () =>
      setUnauthorizedHandler(() => {
        endSession();
        setSessionExpired(true);
      }),
    [endSession],
  );

  // Al arrancar, valida el token guardado. Un 401 ya lo resolvió el handler de arriba; ante otro
  // error (red caída, 500) la sesión sigue abierta y el próximo 401 la cerrará.
  useEffect(() => {
    if (!VALIDATE_SESSION_ON_START || !getToken()) return undefined;

    const controller = new AbortController();
    authApi
      .me({ signal: controller.signal })
      .then((currentUser) => {
        setUser(currentUser);
        setStatus(STATUS.AUTHENTICATED);
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        logError(error);
        if (error?.isUnauthorized) return;
        setStatus(STATUS.AUTHENTICATED);
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await authApi.login(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (data) => startSession(await authApi.register(data)),
    [startSession],
  );

  // La sesión local se borra antes de avisar al servidor: si el usuario quiso salir, sale, aunque
  // el pedido falle o tarde. Como el token ya no está guardado, un 401 de este pedido no se
  // interpreta como sesión vencida.
  const logout = useCallback(async () => {
    const token = getToken();
    endSession();
    setSessionExpired(false);
    if (!token) return;
    try {
      await authApi.logout(token);
    } catch (error) {
      // Solo se registra: la sesión local ya está cerrada y el usuario no tiene nada que hacer.
      logError(error);
    }
  }, [endSession]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: status === STATUS.AUTHENTICATED,
      isLoading: status === STATUS.CHECKING,
      sessionExpired,
      login,
      register,
      logout,
    }),
    [user, status, sessionExpired, login, register, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
