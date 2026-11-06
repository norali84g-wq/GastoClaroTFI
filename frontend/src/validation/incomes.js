import { AMOUNT_MAX_DECIMALS, AMOUNT_MIN_EXCLUSIVE } from '../config/constants';
import { isValidISODate } from '../utils/dates';
import { parseAmount } from './expenses';

// Devuelve { campo: [mensajes] } solo con los campos que tienen problemas; `t` es la función de
// traducción. A diferencia de un gasto, la fecha de un ingreso puede ser futura: la API solo pide
// que sea una fecha válida.
export function validateIncome({ date, amount }, t) {
  const errors = {};

  if (date === '') errors.date = [t('validation.required')];
  else if (!isValidISODate(date)) errors.date = [t('validation.date')];

  if (amount.trim() === '') errors.amount = [t('validation.required')];
  else {
    const value = parseAmount(amount);
    if (Number.isNaN(value)) {
      errors.amount = [t('validation.amount', { count: AMOUNT_MAX_DECIMALS })];
    } else if (value <= AMOUNT_MIN_EXCLUSIVE) {
      errors.amount = [t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })];
    }
  }
  return errors;
}

// Pasa los valores del formulario (texto) a los tipos que espera createIncome.
export function toNewIncome({ amount, date }) {
  return { amount: parseAmount(amount), date };
}

// Pasa un ingreso (con los tipos de la app) a los valores de texto del formulario, para editarlo.
export function toIncomeFormValues({ amount, date }) {
  return { amount: String(amount), date };
}
