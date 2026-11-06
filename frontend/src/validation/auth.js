import { PASSWORD_MIN_LENGTH } from '../config/constants';

// Lo que se puede validar sin el servidor. Cada función devuelve { campo: [mensajes] } solo con
// los campos que tienen problemas; `t` es la función de traducción.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return value.trim() === '';
}

export function validateLogin({ user, password }, t) {
  const errors = {};
  if (isBlank(user)) errors.user = [t('validation.required')];
  if (password === '') errors.password = [t('validation.required')];
  return errors;
}

export function validateRegister({ user, email, password, passwordConfirmation }, t) {
  const errors = {};
  if (isBlank(user)) errors.user = [t('validation.required')];

  if (isBlank(email)) errors.email = [t('validation.required')];
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = [t('validation.email')];

  if (password === '') errors.password = [t('validation.required')];
  else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = [t('validation.passwordMinLength', { count: PASSWORD_MIN_LENGTH })];
  }

  if (passwordConfirmation === '') errors.passwordConfirmation = [t('validation.required')];
  else if (passwordConfirmation !== password) {
    errors.passwordConfirmation = [t('validation.passwordMismatch')];
  }
  return errors;
}
