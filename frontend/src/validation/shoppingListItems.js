import { AMOUNT_MAX_DECIMALS, AMOUNT_MIN_EXCLUSIVE } from '../config/constants';
import { isValidPeriod } from '../utils/dates';
import { parseAmount } from './expenses';

// Devuelve { campo: [mensajes] } solo con los campos que tienen problemas; `t` es la función de
// traducción. Las reglas son las del back-end: la cantidad, si se carga, mayor a
// AMOUNT_MIN_EXCLUSIVE, y el precio unitario estimado de 0 en adelante.
export function validateShoppingListItem(
  { name, categoryId, period, quantity, estimatedUnitPrice },
  t,
) {
  const errors = {};

  if (name.trim() === '') errors.name = [t('validation.required')];

  if (categoryId === '') errors.categoryId = [t('validation.required')];

  if (period === '') errors.period = [t('validation.required')];
  else if (!isValidPeriod(period)) errors.period = [t('validation.period')];

  if (quantity.trim() !== '') {
    const value = parseAmount(quantity);
    if (Number.isNaN(value)) {
      errors.quantity = [t('validation.amount', { count: AMOUNT_MAX_DECIMALS })];
    } else if (value <= AMOUNT_MIN_EXCLUSIVE) {
      errors.quantity = [t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })];
    }
  }

  if (estimatedUnitPrice.trim() === '') errors.estimatedUnitPrice = [t('validation.required')];
  else if (Number.isNaN(parseAmount(estimatedUnitPrice))) {
    errors.estimatedUnitPrice = [t('validation.amount', { count: AMOUNT_MAX_DECIMALS })];
  }

  return errors;
}

// Pasa los valores del formulario (texto) a los tipos que espera la API. Sin cantidad, es null.
export function toShoppingListItem({ categoryId, quantity, estimatedUnitPrice, ...values }) {
  return {
    ...values,
    categoryId: Number(categoryId),
    quantity: quantity.trim() === '' ? null : parseAmount(quantity),
    estimatedUnitPrice: parseAmount(estimatedUnitPrice),
  };
}

// Lo inverso: un ítem ya guardado como valores del formulario, para editarlo.
export function toShoppingListFormValues({
  name,
  categoryId,
  period,
  quantity,
  estimatedUnitPrice,
}) {
  return {
    name,
    categoryId: String(categoryId),
    period,
    quantity: quantity === null ? '' : String(quantity),
    estimatedUnitPrice: String(estimatedUnitPrice),
  };
}
