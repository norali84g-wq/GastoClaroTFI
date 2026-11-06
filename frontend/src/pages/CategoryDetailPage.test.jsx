import { fireEvent, screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { categoryDetailPath } from '../config/constants';
import es from '../locales/es.json';
import { fetchCallsTo, jsonResponse, mockApi, TEST_TOKEN, TEST_USER } from '../test/api';
import { renderApp } from '../test/renderApp';
import { formatAmount } from '../utils/format';

// formatAmount separa el signo con un espacio de no corte; los matchers comparan con espacios comunes.
const money = (amount) => formatAmount(amount).replace(/\s/g, ' ');

function apiComparison(overrides = {}) {
  return {
    category: { id: 1, name: 'Supermercado' },
    period: '2026-09',
    planned_total: '250.0',
    real_total: '290.0',
    subcategories: [],
    items: [
      {
        name: 'Arroz',
        planned_quantity: '2.0',
        planned_unit_price: '100.0',
        planned_total: '200.0',
        real_quantity: 3,
        real_unit_price: '90.0',
        real_total: '270.0',
        status: 'bought',
      },
      {
        name: 'Chicle',
        planned_quantity: '0.0',
        planned_unit_price: '0.0',
        planned_total: '0.0',
        real_quantity: 1,
        real_unit_price: '20.0',
        real_total: '20.0',
        status: 'unplanned',
      },
      {
        name: 'Leche',
        planned_quantity: '1.0',
        planned_unit_price: '50.0',
        planned_total: '50.0',
        real_quantity: 0,
        real_unit_price: '0.0',
        real_total: '0.0',
        status: 'not_bought',
      },
    ],
    ...overrides,
  };
}

function renderDetail(routes = {}) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, TEST_USER),
    'GET /categories/1/comparison': jsonResponse(200, apiComparison()),
    ...routes,
  });
  return { fetchMock, ...renderApp(categoryDetailPath(1)) };
}

describe('Detalle de categoría', () => {
  it('compara lo estimado con lo real por producto y dice el estado de cada uno', async () => {
    renderDetail();

    expect(
      await screen.findByRole('heading', { name: 'Supermercado', level: 1 }),
    ).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: es.categoryDetail.products.caption });
    const [, arroz, chicle, leche] = within(table).getAllByRole('row');
    expect(arroz).toHaveTextContent('Arroz');
    expect(arroz).toHaveTextContent(money(200));
    expect(arroz).toHaveTextContent(money(270));
    expect(arroz).toHaveTextContent(es.categoryDetail.products.statuses.bought);
    expect(chicle).toHaveTextContent(es.categoryDetail.products.statuses.unplanned);
    expect(leche).toHaveTextContent(es.categoryDetail.products.statuses.not_bought);
    expect(screen.getByText(money(250))).toBeInTheDocument();
    expect(screen.getByText(money(290))).toBeInTheDocument();
  });

  it('con subcategorías muestra una fila por cada una', async () => {
    renderDetail({
      'GET /categories/1/comparison': jsonResponse(
        200,
        apiComparison({
          planned_total: '100.0',
          real_total: '190.0',
          items: [],
          subcategories: [
            {
              category: { id: 6, name: 'Verduras' },
              planned: '100.0',
              real: '150.0',
              over_budget: true,
            },
            {
              category: { id: 7, name: 'Carnes' },
              planned: '0.0',
              real: '40.0',
              over_budget: false,
            },
          ],
        }),
      ),
    });

    const table = await screen.findByRole('table', {
      name: es.categoryDetail.subcategories.caption,
    });
    const [, verduras, carnes] = within(table).getAllByRole('row');
    expect(verduras).toHaveTextContent('Verduras');
    expect(verduras).toHaveTextContent(money(150));
    expect(carnes).toHaveTextContent('Carnes');
  });

  it('si no hay nada en el mes, muestra el estado vacío', async () => {
    renderDetail({
      'GET /categories/1/comparison': jsonResponse(
        200,
        apiComparison({ planned_total: '0.0', real_total: '0.0', items: [] }),
      ),
    });

    expect(await screen.findByText(/No hay gastos ni gastos fijos en/)).toBeInTheDocument();
  });

  it('al cambiar el mes pide ese mes', async () => {
    const { fetchMock } = renderDetail();
    await screen.findByRole('table', { name: es.categoryDetail.products.caption });

    fireEvent.change(screen.getByLabelText(es.categoryDetail.filter), {
      target: { value: '2026-08' },
    });

    await screen.findByRole('table', { name: es.categoryDetail.products.caption });
    const calls = fetchCallsTo(fetchMock, 'GET /categories/1/comparison');
    expect(calls.at(-1).url).toMatch(/period=2026-08$/);
  });

  it('si falla la carga, muestra el error y permite reintentar', async () => {
    const { user } = renderDetail({
      'GET /categories/1/comparison': [
        new TypeError('Failed to fetch'),
        jsonResponse(200, apiComparison()),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(es.errors.network);
    await user.click(screen.getByRole('button', { name: es.common.retry }));

    expect(
      await screen.findByRole('table', { name: es.categoryDetail.products.caption }),
    ).toBeInTheDocument();
  });
});
