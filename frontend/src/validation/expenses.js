import { AMOUNT_MAX_DECIMALS, AMOUNT_MIN_EXCLUSIVE, ITEM_QUANTITY_MIN } from '../config/constants';
import { isValidISODate, todayISO } from '../utils/dates';

// Número sin separador de miles, con coma o punto para los decimales: "1500", "1500,5", "1500.50".
// Que no acepte "1.500" es a propósito: sería ambiguo entre mil quinientos y uno con cincuenta.
// Tampoco acepta negativos.
const AMOUNT_PATTERN = new RegExp(`^\\d+([.,]\\d{1,${AMOUNT_MAX_DECIMALS}})?$`);
const INTEGER_PATTERN = /^\d+$/;

// Devuelve el monto escrito como número, o NaN si no tiene un formato válido.
export function parseAmount(text) {
  const value = text.trim();
  return AMOUNT_PATTERN.test(value) ? Number(value.replace(',', '.')) : NaN;
}

function parseInteger(text) {
  const value = text.trim();
  return INTEGER_PATTERN.test(value) ? Number(value) : NaN;
}

// Clave con la que se informa el error de un campo de un ítem; la usa también el formulario.
export function itemErrorKey(index, field) {
  return `items.${index}.${field}`;
}

// Los ítems que quedan en el gasto: los que no se marcaron para quitar.
export function remainingItems(items) {
  return items.filter((item) => !item.removed);
}

// Suma de los ítems que quedan, como la calcula la API, o NaN si alguno no tiene un número válido.
export function itemsTotal(items) {
  return remainingItems(items).reduce(
    (total, item) => total + parseInteger(item.quantity) * parseAmount(item.unitPrice),
    0,
  );
}

function validateItem({ name, quantity, unitPrice }, index, t) {
  const errors = {};
  if (name.trim() === '') errors[itemErrorKey(index, 'name')] = [t('validation.required')];

  if (quantity.trim() === '') errors[itemErrorKey(index, 'quantity')] = [t('validation.required')];
  else {
    const value = parseInteger(quantity);
    if (Number.isNaN(value) || value < ITEM_QUANTITY_MIN) {
      errors[itemErrorKey(index, 'quantity')] = [
        t('validation.itemQuantity', { min: ITEM_QUANTITY_MIN }),
      ];
    }
  }

  if (unitPrice.trim() === '')
    errors[itemErrorKey(index, 'unitPrice')] = [t('validation.required')];
  else if (Number.isNaN(parseAmount(unitPrice))) {
    errors[itemErrorKey(index, 'unitPrice')] = [
      t('validation.amount', { count: AMOUNT_MAX_DECIMALS }),
    ];
  }
  return errors;
}

// Devuelve { campo: [mensajes] } solo con los campos que tienen problemas; `t` es la función de
// traducción. `today` ('YYYY-MM-DD') es el último día aceptado: un gasto no puede ser futuro.
// `items` solo viene al editar un gasto que tiene ítems: mientras quede alguno, el monto lo calcula
// la API y no se valida; cada ítem que queda se valida con la clave de itemErrorKey.
export function validateExpense({ date, categoryId, amount, items = [] }, t, today = todayISO()) {
  const errors = {};

  if (date === '') errors.date = [t('validation.required')];
  else if (!isValidISODate(date)) errors.date = [t('validation.date')];
  // Las fechas 'YYYY-MM-DD' se ordenan igual como texto que como fechas.
  else if (date > today) errors.date = [t('validation.dateFuture')];

  if (categoryId === '') errors.categoryId = [t('validation.required')];

  if (remainingItems(items).length === 0) {
    if (amount.trim() === '') errors.amount = [t('validation.required')];
    else {
      const value = parseAmount(amount);
      if (Number.isNaN(value)) {
        errors.amount = [t('validation.amount', { count: AMOUNT_MAX_DECIMALS })];
      } else if (value <= AMOUNT_MIN_EXCLUSIVE) {
        errors.amount = [t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })];
      }
    }
  }

  items.forEach((item, index) => {
    if (!item.removed) Object.assign(errors, validateItem(item, index, t));
  });
  return errors;
}

// Pasa los valores del formulario (texto) a los tipos que espera createExpense.
export function toNewExpense({ categoryId, amount, ...values }) {
  return { ...values, categoryId: Number(categoryId), amount: parseAmount(amount) };
}

// Pasa los valores del formulario de edición a los tipos que espera updateExpense: cada ítem
// modificado o, si se quitó, solo su id para borrarlo.
export function toExpenseChanges({ items = [], ...values }) {
  return {
    ...toNewExpense(values),
    items: items.map((item) =>
      item.removed
        ? { id: item.id, destroy: true }
        : {
            id: item.id,
            name: item.name,
            quantity: parseInteger(item.quantity),
            unit: item.unit,
            unitPrice: parseAmount(item.unitPrice),
          },
    ),
  };
}

// Un monto como se escribe en el formulario: con coma para los decimales, como sugiere la ayuda
// (1800.5 → "1800,5"). parseAmount lo vuelve a leer igual.
function toAmountText(amount) {
  return String(amount).replace('.', ',');
}

// Un gasto ya guardado como valores del formulario, para editarlo.
export function toExpenseFormValues(expense) {
  return {
    date: expense.date,
    categoryId: expense.category ? String(expense.category.id) : '',
    amount: toAmountText(expense.amount),
    description: expense.description,
    isFixed: expense.isFixed,
    purchaseChannel: expense.purchaseChannel ?? '',
    items: expense.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: toAmountText(item.unitPrice),
      removed: false,
    })),
  };
}
