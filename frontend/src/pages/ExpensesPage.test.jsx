import { screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import es from '../locales/es.json';
import { emptyDashboardRoutes, fetchCallsTo, jsonResponse, mockApi, TEST_TOKEN } from '../test/api';
import { renderApp } from '../test/renderApp';
import { currentPeriod } from '../utils/dates';

const CATEGORIES = [{ id: 1, name: 'Supermercado', parent_id: null, tracks_installments: null }];

function apiExpense(overrides = {}) {
  return {
    id: 1,
    amount: '13101.0',
    date: `${currentPeriod()}-05`,
    description: 'Compra semanal',
    is_fixed: false,
    purchase_channel: 'presencial',
    user: { id: 1, user: 'nico' },
    category: { id: 1, name: 'Supermercado' },
    expense_items: [],
    ...overrides,
  };
}

function renderExpenses(routes = {}) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    ...emptyDashboardRoutes(),
    'GET /categories': jsonResponse(200, CATEGORIES),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.EXPENSES) };
}

describe('Consumos', () => {
  it('muestra el listado y el formulario de gastos, sin el resumen del mes', async () => {
    renderExpenses({ 'GET /expenses': jsonResponse(200, [apiExpense()]) });

    expect(
      await screen.findByRole('heading', { level: 1, name: es.expenses.title }),
    ).toBeInTheDocument();
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('$ 13.101,00');
    expect(screen.getByRole('heading', { name: es.expenses.form.title })).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: es.dashboard.summary.title }),
    ).not.toBeInTheDocument();
  });

  it('se llega desde el menú y guarda un gasto nuevo', async () => {
    const { user, fetchMock } = renderExpenses({
      'POST /expenses': ({ body }) =>
        jsonResponse(201, apiExpense({ id: 99, amount: String(body.amount) })),
    });

    await user.click(await screen.findByRole('link', { name: es.nav.expenses }));
    await user.selectOptions(
      await screen.findByLabelText(es.expenses.fields.category),
      'Supermercado',
    );
    await user.type(screen.getByLabelText(es.expenses.fields.amount), '2500');
    await user.click(screen.getByRole('button', { name: es.expenses.form.submit }));

    expect(await screen.findByText(es.expenses.form.success)).toBeInTheDocument();
    expect(fetchCallsTo(fetchMock, 'POST /expenses')).toHaveLength(1);
  });
});
