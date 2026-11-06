import { useContext } from 'react';
import { SessionContext } from './sessionContext';

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>.');
  }
  return session;
}
