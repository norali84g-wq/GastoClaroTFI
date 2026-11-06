import { AMOUNT_MAX_DECIMALS, AMOUNT_MIN_EXCLUSIVE, ITEM_QUANTITY_MIN } from '../config/constants';
import i18n from '../i18n';
import es from '../locales/es.json';
import { itemErrorKey, parseAmount, toExpenseChanges, validateExpense } from './expenses';

const { t } = i18n;
const TODAY = '2026-09-20';
const VALID = { date: '2026-09-12', categoryId: '1', amount: '1500,50' };

describe('validación de gastos', () => {
  it('acepta coma o punto para los decimales, pero no separador de miles', () => {
    expect(parseAmount('1500')).toBe(1500);
    expect(parseAmount(' 1500,5 ')).toBe(1500.5);
    expect(parseAmount('1500.50')).toBe(1500.5);
    expect(parseAmount('1.500')).toBeNaN();
    expect(parseAmount('1.500,50')).toBeNaN();
    expect(parseAmount('-5')).toBeNaN();
    expect(parseAmount('abc')).toBeNaN();
  });

  it('un gasto completo no tiene errores', () => {
    expect(validateExpense(VALID, t, TODAY)).toEqual({});
  });

  it('pide fecha, categoría y monto', () => {
    expect(validateExpense({ date: '', categoryId: '', amount: '  ' }, t, TODAY)).toEqual({
      date: [es.validation.required],
      categoryId: [es.validation.required],
      amount: [es.validation.required],
    });
  });

  it('rechaza un monto de cero y una fecha que no existe', () => {
    expect(validateExpense({ ...VALID, date: '2026-02-30', amount: '0,00' }, t, TODAY)).toEqual({
      date: [es.validation.date],
      amount: [t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })],
    });
  });

  it('acepta la fecha de hoy pero no una futura', () => {
    expect(validateExpense({ ...VALID, date: TODAY }, t, TODAY)).toEqual({});
    expect(validateExpense({ ...VALID, date: '2026-09-21' }, t, TODAY)).toEqual({
      date: [es.validation.dateFuture],
    });
    expect(validateExpense({ ...VALID, date: '2027-01-01' }, t, TODAY)).toEqual({
      date: [es.validation.dateFuture],
    });
  });
});

describe('validación de los ítems al editar', () => {
  const ITEM = {
    id: 1,
    name: 'Leche',
    quantity: '2',
    unit: 'unidad',
    unitPrice: '1800,50',
    removed: false,
  };

  it('mientras quede algún ítem, el monto no se valida: lo calcula la API', () => {
    expect(validateExpense({ ...VALID, amount: '', items: [ITEM] }, t, TODAY)).toEqual({});
  });

  it('valida cada ítem que queda con su propia clave, y no los que se quitan', () => {
    const items = [
      { ...ITEM, name: ' ', quantity: '1,5', unitPrice: '1.800' },
      { ...ITEM, id: 2, name: '', removed: true },
    ];

    expect(validateExpense({ ...VALID, items }, t, TODAY)).toEqual({
      [itemErrorKey(0, 'name')]: [es.validation.required],
      [itemErrorKey(0, 'quantity')]: [t('validation.itemQuantity', { min: ITEM_QUANTITY_MIN })],
      [itemErrorKey(0, 'unitPrice')]: [t('validation.amount', { count: AMOUNT_MAX_DECIMALS })],
    });
  });

  it('si se quitan todos los ítems, vuelve a pedir el monto', () => {
    const items = [{ ...ITEM, removed: true }];

    expect(validateExpense({ ...VALID, amount: '', items }, t, TODAY)).toEqual({
      amount: [es.validation.required],
    });
  });

  it('pasa los ítems a los tipos de la API: modificados con sus datos, quitados solo con el id', () => {
    const changes = toExpenseChanges({
      ...VALID,
      description: '',
      isFixed: false,
      purchaseChannel: '',
      items: [ITEM, { ...ITEM, id: 2, removed: true }],
    });

    expect(changes.items).toEqual([
      { id: 1, name: 'Leche', quantity: 2, unit: 'unidad', unitPrice: 1800.5 },
      { id: 2, destroy: true },
    ]);
    expect(changes.categoryId).toBe(1);
  });
});
