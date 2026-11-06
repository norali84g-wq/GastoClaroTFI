import {
  AMOUNT_MAX_DECIMALS,
  AMOUNT_MIN_EXCLUSIVE,
  INSTALLMENTS_MAX,
  INSTALLMENTS_MIN,
} from '../config/constants';
import { isValidPeriod } from '../utils/dates';
import { parseAmount } from './expenses';

const INTEGER_PATTERN = /^\d+$/;

// Devuelve la cantidad de cuotas escrita como número entero, o NaN si no es un entero.
export function parseInstallmentsCount(text) {
  const value = text.trim();
  return INTEGER_PATTERN.test(value) ? Number(value) : NaN;
}

// Devuelve { campo: [mensajes] } solo con los campos que tienen problemas; `t` es la función de
// traducción. Las reglas son las del back-end: el total mayor a AMOUNT_MIN_EXCLUSIVE y entre
// INSTALLMENTS_MIN e INSTALLMENTS_MAX cuotas.
export function validateInstallmentPurchase(
  { description, categoryId, totalAmount, installmentsCount, firstPeriod },
  t,
) {
  const errors = {};

  if (description.trim() === '') errors.description = [t('validation.required')];

  if (categoryId === '') errors.categoryId = [t('validation.required')];

  if (totalAmount.trim() === '') errors.totalAmount = [t('validation.required')];
  else {
    const value = parseAmount(totalAmount);
    if (Number.isNaN(value)) {
      errors.totalAmount = [t('validation.amount', { count: AMOUNT_MAX_DECIMALS })];
    } else if (value <= AMOUNT_MIN_EXCLUSIVE) {
      errors.totalAmount = [t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })];
    }
  }

  if (installmentsCount.trim() === '') errors.installmentsCount = [t('validation.required')];
  else {
    const value = parseInstallmentsCount(installmentsCount);
    if (Number.isNaN(value) || value < INSTALLMENTS_MIN || value > INSTALLMENTS_MAX) {
      errors.installmentsCount = [
        t('validation.installmentsCount', { min: INSTALLMENTS_MIN, max: INSTALLMENTS_MAX }),
      ];
    }
  }

  if (firstPeriod === '') errors.firstPeriod = [t('validation.required')];
  else if (!isValidPeriod(firstPeriod)) errors.firstPeriod = [t('validation.period')];

  return errors;
}

// Pasa los valores del formulario (texto) a los tipos que espera la API de compras en cuotas.
export function toInstallmentPurchase({ categoryId, totalAmount, installmentsCount, ...values }) {
  return {
    ...values,
    categoryId: Number(categoryId),
    totalAmount: parseAmount(totalAmount),
    installmentsCount: parseInstallmentsCount(installmentsCount),
  };
}

// Lo inverso: una compra ya guardada como valores del formulario, para editarla.
export function toInstallmentFormValues({
  description,
  categoryId,
  totalAmount,
  installmentsCount,
  firstPeriod,
}) {
  return {
    description,
    categoryId: String(categoryId),
    totalAmount: String(totalAmount),
    installmentsCount: String(installmentsCount),
    firstPeriod,
  };
}
