import { screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import es from '../locales/es.json';
import { fetchCallsTo, jsonResponse, mockApi, TEST_TOKEN, TEST_USER } from '../test/api';
import { renderApp } from '../test/renderApp';
import { formatAmount } from '../utils/format';

// formatAmount separa el signo con un espacio de no corte; los matchers comparan con espacios comunes.
const money = (amount) => formatAmount(amount).replace(/\s/g, ' ');

const YEAR = new Date().getFullYear();

function apiStatistics(overrides = {}) {
  return {
    year: YEAR,
    month: null,
    available_years: [YEAR, YEAR - 1],
    months: [
      {
        month: `${YEAR}-01`,
        income: '1000.0',
        consumption: '300.0',
        savings: '700.0',
        unplanned: '0.0',
      },
      {
        month: `${YEAR}-02`,
        income: '1000.0',
        consumption: '600.0',
        savings: '400.0',
        unplanned: '70.0',
      },
    ],
    by_category: [
      {
        category: { id: 5, name: 'Comida' },
        total: '200.0',
        percentage: 66.7,
        subcategories: [
          {
            category: { id: 6, name: 'Verduras' },
            real: '150.0',
            planned: '100.0',
            over_budget: true,
            percentage: 50.0,
          },
        ],
      },
    ],
    unplanned: {
      total: '70.0',
      by_vendor: [
        { vendor: 'Coto', total: '60.0' },
        { vendor: null, total: '10.0' },
      ],
      items: [
        {
          name: 'Cafe',
          quantity: 2,
          unit_price: '30.0',
          subtotal: '60.0',
          date: `${YEAR}-02-05`,
          category_id: 4,
          vendor: 'Coto',
        },
      ],
    },
    ...overrides,
  };
}

function renderStatistics(routes = {}) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, TEST_USER),
    'GET /statistics': jsonResponse(200, apiStatistics()),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.STATISTICS) };
}

describe('Estadísticas', () => {
  it('se llega desde el menú y muestra rankings, consumo por categoría y gasto hormiga', async () => {
    renderStatistics();

    expect(
      await screen.findByRole('heading', { name: es.statistics.title, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: es.nav.statistics })).toBeInTheDocument();

    const consumo = await screen.findByRole('region', { name: es.statistics.rankings.consumption });
    const [mayor, menor] = within(consumo).getAllByRole('listitem');
    expect(mayor).toHaveTextContent(money(600));
    expect(menor).toHaveTextContent(money(300));

    const categorias = screen.getByRole('region', { name: es.statistics.byCategory.title });
    expect(within(categorias).getByText('Comida')).toBeInTheDocument();
    expect(within(categorias).getByText('Verduras')).toBeInTheDocument();
    expect(within(categorias).getByText(es.statistics.byCategory.overBudget)).toBeInTheDocument();

    const hormiga = screen.getByRole('region', { name: es.statistics.unplanned.title });
    expect(within(hormiga).getAllByText('Coto').length).toBeGreaterThan(0);
    expect(within(hormiga).getAllByText(es.statistics.unplanned.noVendor).length).toBeGreaterThan(
      0,
    );
    expect(within(hormiga).getByText(money(70))).toBeInTheDocument();
  });

  it('al cambiar el año o el mes vuelve a pedir las estadísticas', async () => {
    const { fetchMock, user } = renderStatistics();
    await screen.findByRole('region', { name: es.statistics.byCategory.title });

    await user.selectOptions(screen.getByLabelText(es.statistics.year), String(YEAR - 1));
    await user.selectOptions(screen.getByLabelText(es.statistics.month), '2');

    await screen.findByRole('region', { name: es.statistics.byCategory.title });
    const urls = fetchCallsTo(fetchMock, 'GET /statistics').map((call) => call.url);
    expect(urls.at(-1)).toMatch(new RegExp(`year=${YEAR - 1}&month=2$`));
  });

  it('si no hay gasto hormiga ni consumo, lo dice', async () => {
    renderStatistics({
      'GET /statistics': jsonResponse(
        200,
        apiStatistics({
          months: [],
          by_category: [],
          unplanned: { total: '0.0', by_vendor: [], items: [] },
        }),
      ),
    });

    expect(await screen.findByText(es.statistics.byCategory.empty)).toBeInTheDocument();
    expect(screen.getByText(es.statistics.unplanned.empty)).toBeInTheDocument();
  });

  it('si falla la carga, muestra el error y permite reintentar', async () => {
    const { user } = renderStatistics({
      'GET /statistics': [new TypeError('Failed to fetch'), jsonResponse(200, apiStatistics())],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(es.errors.network);
    await user.click(screen.getByRole('button', { name: es.common.retry }));

    expect(
      await screen.findByRole('region', { name: es.statistics.byCategory.title }),
    ).toBeInTheDocument();
  });
});
