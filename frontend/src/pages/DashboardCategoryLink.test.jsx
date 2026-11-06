import { screen } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import es from '../locales/es.json';
import { apiDashboard, emptyDashboardRoutes, jsonResponse, mockApi, TEST_TOKEN } from '../test/api';
import { renderApp } from '../test/renderApp';

describe('Inicio: detalle de una categoría', () => {
  it('el nombre de cada categoría lleva a su detalle', async () => {
    saveToken(TEST_TOKEN);
    mockApi({
      ...emptyDashboardRoutes(),
      'GET /dashboard': jsonResponse(
        200,
        apiDashboard({
          income: '1000.0',
          consumption: '300.0',
          savings: '700.0',
          consumption_by_category: [
            { category_id: 7, category: 'Supermercado', total: '300.0', planned: '0.0' },
          ],
        }),
      ),
      'GET /categories/7/comparison': jsonResponse(200, {
        category: { id: 7, name: 'Supermercado' },
        period: '2026-11',
        planned_total: '0.0',
        real_total: '300.0',
        subcategories: [],
        items: [],
      }),
    });

    const { user } = renderApp(ROUTES.DASHBOARD);
    await user.click(await screen.findByRole('link', { name: 'Supermercado' }));

    expect(
      await screen.findByRole('heading', { name: 'Supermercado', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: es.categoryDetail.back })).toBeInTheDocument();
  });
});
