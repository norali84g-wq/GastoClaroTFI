import { fetchCall, jsonResponse, mockFetch } from '../test/api';
import { getSavings } from './savings';

describe('ahorro mes a mes', () => {
  it('convierte los montos a número y pasa los campos a camelCase', async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, {
        savings_goal_percentage: 10,
        months: [
          {
            month: '2026-09',
            income: '450000.0',
            consumption: '38101.0',
            savings: '411899.0',
            accumulated: '411899.0',
          },
        ],
      }),
    );

    expect(await getSavings()).toEqual({
      savingsGoalPercentage: 10,
      months: [
        {
          month: '2026-09',
          income: 450000,
          consumption: 38101,
          savings: 411899,
          accumulated: 411899,
        },
      ],
    });
    expect(fetchCall(fetchMock).url).toMatch(/\/savings$/);
  });
});
