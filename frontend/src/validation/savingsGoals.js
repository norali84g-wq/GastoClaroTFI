import { AMOUNT_MAX_DECIMALS, AMOUNT_MIN_EXCLUSIVE } from '../config/constants';
import { isValidISODate } from '../utils/dates';
import { parseAmount } from './expenses';

// Lo que vale el monto ahorrado cuando se deja vacío (el campo es opcional).
const DEFAULT_SAVED_AMOUNT = 0;

// Devuelve { campo: [mensajes] } solo con los campos que tienen problemas; `t` es la función de
// traducción. parseAmount no acepta negativos, así que para el monto ahorrado (que puede ser 0)
// alcanza con revisar el formato.
export function validateSavingsGoal({ name, targetAmount, savedAmount, deadline }, t) {
  const errors = {};

  if (name.trim() === '') errors.name = [t('validation.required')];

  if (targetAmount.trim() === '') errors.targetAmount = [t('validation.required')];
  else {
    const value = parseAmount(targetAmount);
    if (Number.isNaN(value)) {
      errors.targetAmount = [t('validation.amount', { count: AMOUNT_MAX_DECIMALS })];
    } else if (value <= AMOUNT_MIN_EXCLUSIVE) {
      errors.targetAmount = [t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })];
    }
  }

  if (savedAmount.trim() !== '' && Number.isNaN(parseAmount(savedAmount))) {
    errors.savedAmount = [t('validation.amount', { count: AMOUNT_MAX_DECIMALS })];
  }

  if (deadline !== '' && !isValidISODate(deadline)) errors.deadline = [t('validation.date')];

  return errors;
}

// Pasa los valores del formulario (texto) a los tipos que esperan createSavingsGoal y
// updateSavingsGoal. Sin fecha límite, deadline es null.
export function toSavingsGoal({ name, targetAmount, savedAmount, deadline }) {
  return {
    name,
    targetAmount: parseAmount(targetAmount),
    savedAmount: savedAmount.trim() === '' ? DEFAULT_SAVED_AMOUNT : parseAmount(savedAmount),
    deadline: deadline === '' ? null : deadline,
  };
}
