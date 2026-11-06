import { ApiError } from '../api/client';
import i18n from '../i18n';
import es from '../locales/es.json';
import { statusMessage } from './errors';

const { t } = i18n;

describe('mensaje según el estado HTTP', () => {
  it('explica sin permiso, no existe y datos inválidos', () => {
    expect(statusMessage(new ApiError(403), t)).toBe(es.errors.forbidden);
    expect(statusMessage(new ApiError(404), t)).toBe(es.errors.notFound);
    expect(statusMessage(new ApiError(422), t)).toBe(es.errors.validation);
  });

  it('no tiene mensaje propio para otros estados', () => {
    expect(statusMessage(new ApiError(500), t)).toBeNull();
    expect(statusMessage(new Error('otro'), t)).toBeNull();
    expect(statusMessage(undefined, t)).toBeNull();
  });
});
