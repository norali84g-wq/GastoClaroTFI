import { PASSWORD_MIN_LENGTH } from '../config/constants';
import i18n from '../i18n';
import es from '../locales/es.json';
import { validateLogin, validateRegister } from './auth';

const { t } = i18n;
const VALID = {
  user: 'nico',
  email: 'nico@example.com',
  password: 'a'.repeat(PASSWORD_MIN_LENGTH),
  passwordConfirmation: 'a'.repeat(PASSWORD_MIN_LENGTH),
};

describe('validación de login', () => {
  it('pide usuario y contraseña; un usuario de solo espacios cuenta como vacío', () => {
    expect(validateLogin({ user: '   ', password: '' }, t)).toEqual({
      user: [es.validation.required],
      password: [es.validation.required],
    });
    expect(validateLogin({ user: 'nico', password: 'x' }, t)).toEqual({});
  });
});

describe('validación de registro', () => {
  it('un registro completo no tiene errores', () => {
    expect(validateRegister(VALID, t)).toEqual({});
  });

  it('pide todos los campos', () => {
    expect(
      validateRegister({ user: '', email: ' ', password: '', passwordConfirmation: '' }, t),
    ).toEqual({
      user: [es.validation.required],
      email: [es.validation.required],
      password: [es.validation.required],
      passwordConfirmation: [es.validation.required],
    });
  });

  it('rechaza un email sin formato válido', () => {
    for (const email of ['nico', 'nico@', 'nico@example', '@example.com', 'ni co@example.com']) {
      expect(validateRegister({ ...VALID, email }, t)).toEqual({ email: [es.validation.email] });
    }
    expect(validateRegister({ ...VALID, email: ' nico@example.com ' }, t)).toEqual({});
  });

  it(`pide al menos ${PASSWORD_MIN_LENGTH} caracteres de contraseña`, () => {
    const short = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    expect(validateRegister({ ...VALID, password: short, passwordConfirmation: short }, t)).toEqual(
      { password: [t('validation.passwordMinLength', { count: PASSWORD_MIN_LENGTH })] },
    );
  });

  it('pide que la confirmación coincida', () => {
    expect(validateRegister({ ...VALID, passwordConfirmation: 'otra cosa' }, t)).toEqual({
      passwordConfirmation: [es.validation.passwordMismatch],
    });
  });
});
