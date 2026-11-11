import { createContext, useSyncExternalStore } from 'react';
import { createClient } from '../api/client.js';
import { createResources } from '../api/resources.js';

export const AccountContext = createContext(null);

const storageKey = 'gastoclaro.session';
const listeners = new Set();

function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey));
    return value?.token && Date.parse(value.expires_at) > Date.now() ? value : null;
  } catch {
    return null;
  }
}

let session = readSession();

function setSession(value) {
  session = value;
  try {
    if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
    else sessionStorage.removeItem(storageKey);
  } catch {
    // In this browser the session lasts only until the page is reloaded.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const request = createClient({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => session?.token,
  onUnauthorized: (token) => {
    if (session?.token === token) setSession(null);
  },
});

export const api = createResources(request);

export function useSession() {
  return useSyncExternalStore(subscribe, () => session);
}

export async function authenticate(mode, credentials) {
  const result = await api[mode](credentials);
  setSession(result);
}

export function expireSession() {
  setSession(null);
}

export async function logout() {
  try {
    await api.logout();
  } finally {
    setSession(null);
  }
}
