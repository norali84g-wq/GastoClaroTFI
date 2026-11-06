import { TOKEN_STORAGE_KEY } from '../config/constants';

// Único archivo del proyecto que accede a localStorage (lo controla ESLint).

export function saveToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
