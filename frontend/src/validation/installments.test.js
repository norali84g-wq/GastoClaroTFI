import { AMOUNT_MIN_EXCLUSIVE, INSTALLMENTS_MAX, INSTALLMENTS_MIN } from '../config/constants';
import i18n from '../i18n';
import es from '../locales/es.json';
import { toInstallmentPurchase, validateInstallmentPurchase } from './installments';

const { t } = i18n;
const VALID = {
  description: 'Heladera',
  categoryId: '4',
  totalAmount: '1200,50',
  installmentsCount: '12',
  firstPeriod: '2026-11',
};
const COUNT_ERROR = [
  t('validation.installmentsCount', { min: INSTALLMENTS_MIN, max: INSTALLMENTS_MAX }),
];

describe('validación de compras en cuotas', () => {
  it('una compra completa no tiene errores', () => {
    expect(validateInstallmentPurchase(VALID, t)).toEqual({});
  });

  it('pide todos los campos', () => {
    expect(
      validateInstallmentPurchase(
        {
          description: ' ',
          categoryId: '',
          totalAmount: '',
          installmentsCount: '',
          firstPeriod: '',
        },
        t,
      ),
    ).toEqual({
      description: [es.validation.required],
      categoryId: [es.validation.required],
      totalAmount: [es.validation.required],
      installmentsCount: [es.validation.required],
      firstPeriod: [es.validation.required],
    });
  });

  it('acepta de INSTALLMENTS_MIN a INSTALLMENTS_MAX cuotas, solo enteras', () => {
    const count = (installmentsCount) =>
      validateInstallmentPurchase({ ...VALID, installmentsCount }, t).installmentsCount;

    expect(count(String(INSTALLMENTS_MIN))).toBeUndefined();
    expect(count(String(INSTALLMENTS_MAX))).toBeUndefined();
    expect(count(String(INSTALLMENTS_MIN - 1))).toEqual(COUNT_ERROR);
    expect(count(String(INSTALLMENTS_MAX + 1))).toEqual(COUNT_ERROR);
    expect(count('2,5')).toEqual(COUNT_ERROR);
    expect(count('doce')).toEqual(COUNT_ERROR);
  });

  it('rechaza un total de cero y un mes que no existe', () => {
    expect(
      validateInstallmentPurchase({ ...VALID, totalAmount: '0', firstPeriod: '2026-13' }, t),
    ).toEqual({
      totalAmount: [t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })],
      firstPeriod: [es.validation.period],
    });
  });

  it('pasa los valores del formulario a los tipos de la API', () => {
    expect(toInstallmentPurchase(VALID)).toEqual({
      description: 'Heladera',
      categoryId: 4,
      totalAmount: 1200.5,
      installmentsCount: 12,
      firstPeriod: '2026-11',
    });
  });
});
