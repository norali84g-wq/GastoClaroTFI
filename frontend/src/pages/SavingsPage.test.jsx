import { screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import i18n from '../i18n';
import es from '../locales/es.json';
import { heldResponse, jsonResponse, mockApi, TEST_TOKEN, TEST_USER } from '../test/api';
import { renderApp } from '../test/renderApp';
import { formatPercentage } from '../utils/format';

function apiMonth(month, income, consumption, accumulated) {
  const savings = income - consumption;
  return {
    month,
    income: String(income),
    consumption: String(consumption),
    savings: String(savings),
    accumulated: String(accumulated),
  };
}

function renderSavings(routes = {}) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, TEST_USER),
    'GET /savings': jsonResponse(200, { savings_goal_percentage: 0, months: [] }),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.SAVINGS) };
}

describe('Ahorro', () => {
  it('muestra la meta y el detalle de cada año, del más reciente al más antiguo, con sus totales', async () => {
    // La respuesta queda pendiente hasta comprobar que se ve la carga.
    const held = heldResponse();
    renderSavings({ 'GET /savings': held.handler });

    expect(await screen.findByText(es.savings.loading)).toBeInTheDocument();
    held.respond(
      jsonResponse(200, {
        savings_goal_percentage: 10,
        months: [
          apiMonth('2025-12', 1000, 400, 600),
          apiMonth('2026-01', 2000, 500, 2100),
          apiMonth('2026-02', 3000, 4000, 1100),
        ],
      }),
    );

    expect(
      await screen.findByText(
        i18n.t('savings.goalPercentage', { percentage: formatPercentage(0.1) }),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: es.savings.goalsLink })).toBeInTheDocument();

    const tables = await screen.findAllByRole('table');
    expect(tables).toHaveLength(2);
    // Primero 2026: dos meses y el total del año.
    const [, enero, febrero, total2026] = within(tables[0]).getAllByRole('row');
    expect(enero).toHaveTextContent('$ 2.000,00');
    expect(enero).toHaveTextContent('$ 2.100,00');
    expect(febrero).toHaveTextContent('-$ 1.000,00');
    expect(total2026).toHaveTextContent(i18n.t('savings.total', { year: 2026 }));
    expect(total2026).toHaveTextContent('$ 5.000,00');
    expect(total2026).toHaveTextContent('$ 4.500,00');
    expect(total2026).toHaveTextContent('$ 500,00');
    // Después 2025.
    expect(within(tables[1]).getAllByRole('row')[2]).toHaveTextContent(
      i18n.t('savings.total', { year: 2025 }),
    );
  });

  it('si todavía no hay movimientos, lo dice', async () => {
    renderSavings();

    expect(await screen.findByRole('heading', { name: es.savings.emptyTitle })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('si falla la carga, muestra el error y permite reintentar', async () => {
    const { user } = renderSavings({
      'GET /savings': [
        new TypeError('Failed to fetch'),
        jsonResponse(200, { savings_goal_percentage: 0, months: [apiMonth('2026-02', 10, 5, 5)] }),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(es.errors.network);
    await user.click(screen.getByRole('button', { name: es.common.retry }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('se llega desde la navegación', async () => {
    saveToken(TEST_TOKEN);
    mockApi({
      'GET /me': jsonResponse(200, TEST_USER),
      'GET /dashboard': jsonResponse(500),
      'GET /expenses': jsonResponse(200, []),
      'GET /categories': jsonResponse(200, []),
      'GET /savings': jsonResponse(200, { savings_goal_percentage: 0, months: [] }),
    });
    const { user } = renderApp(ROUTES.DASHBOARD);

    await user.click(await screen.findByRole('link', { name: es.nav.savings }));

    expect(
      await screen.findByRole('heading', { level: 1, name: es.savings.title }),
    ).toBeInTheDocument();
  });
});
