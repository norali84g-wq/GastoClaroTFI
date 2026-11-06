import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { clearToken } from '../api/tokenStorage';
import { logError } from '../utils/logger';
import '../i18n';

// Los errores registrados no se imprimen: las pruebas verifican con logError que se registraron.
vi.mock('../utils/logger');

afterEach(() => {
  clearToken();
  vi.unstubAllGlobals();
  vi.mocked(logError).mockClear();
});
