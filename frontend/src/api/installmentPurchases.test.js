import { fetchCall, jsonResponse, mockFetch } from '../test/api';
import {
  createInstallmentPurchase,
  deleteInstallmentPurchase,
  listInstallmentPurchases,
  updateInstallmentPurchase,
} from './installmentPurchases';

const API_PURCHASE = {
  id: 1,
  description: 'Heladera',
  total_amount: '1200.0',
  installments_count: 12,
  first_period: '2026-11',
  category_id: 4,
  vendor_id: 7,
  installment_amount: '100.0',
  remaining_installments: 11,
};

const PURCHASE = {
  id: 1,
  description: 'Heladera',
  totalAmount: 1200,
  installmentsCount: 12,
  firstPeriod: '2026-11',
  categoryId: 4,
  installmentAmount: 100,
  remainingInstallments: 11,
};

const NEW_PURCHASE = {
  description: '  Heladera  ',
  totalAmount: 1200,
  installmentsCount: 12,
  firstPeriod: '2026-11',
  categoryId: 4,
};

const API_BODY = {
  description: 'Heladera',
  total_amount: 1200,
  installments_count: 12,
  first_period: '2026-11',
  category_id: 4,
};

describe('compras en cuotas', () => {
  it('convierte los montos a número y deja afuera lo que el TP2 no usa', async () => {
    mockFetch(jsonResponse(200, [API_PURCHASE]));

    expect(await listInstallmentPurchases()).toEqual([PURCHASE]);
  });

  it('crea y edita con los campos del contrato', async () => {
    const fetchMock = mockFetch(jsonResponse(201, API_PURCHASE), jsonResponse(200, API_PURCHASE));

    expect(await createInstallmentPurchase(NEW_PURCHASE)).toEqual(PURCHASE);
    expect(await updateInstallmentPurchase(1, NEW_PURCHASE)).toEqual(PURCHASE);

    const create = fetchCall(fetchMock, 0);
    expect(create.method).toBe('POST');
    expect(create.url).toMatch(/\/installment_purchases$/);
    expect(create.body).toEqual(API_BODY);
    const update = fetchCall(fetchMock, 1);
    expect(update.method).toBe('PATCH');
    expect(update.url).toMatch(/\/installment_purchases\/1$/);
    expect(update.body).toEqual(API_BODY);
  });

  it('borra por id', async () => {
    const fetchMock = mockFetch(jsonResponse(204));

    await expect(deleteInstallmentPurchase(1)).resolves.toBeUndefined();
    expect(fetchCall(fetchMock).method).toBe('DELETE');
    expect(fetchCall(fetchMock).url).toMatch(/\/installment_purchases\/1$/);
  });
});
