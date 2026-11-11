import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createClient } from '../src/api/client.js';
import { createResources } from '../src/api/resources.js';

function setup(assertRequest, payload, status = 200) {
  const revoked = [];
  const fetcher = async (url, options) => {
    assertRequest(new URL(url).pathname, options, new URL(url).searchParams);
    return Response.json(payload, { status });
  };
  const api = createResources(
    createClient({
      baseUrl: 'https://example.test/api/v1/',
      getToken: () => 'example-token',
      onUnauthorized: (token) => revoked.push(token),
      fetcher,
    }),
  );
  return { api, revoked };
}

test('login sends username and password without the prior token', async () => {
  const credentials = { user: 'demo', password: 'example-password' };
  const session = { token: 'new-token', user: { user: 'demo' } };
  const { api } = setup((path, request) => {
    assert.equal(path, '/api/v1/login');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(request.body), credentials);
  }, session);
  assert.deepEqual(await api.login(credentials), session);
});

test('create expense sends category and amount with the session token', async () => {
  const expense = { date: '2026-11-10', amount: 1500, category_id: 2 };
  const { api } = setup(
    (path, request) => {
      assert.equal(path, '/api/v1/expenses');
      assert.equal(request.method, 'POST');
      assert.equal(request.headers.Authorization, 'Bearer example-token');
      assert.equal(request.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(request.body), expense);
    },
    { id: 3, amount: '1500.0' },
    201,
  );
  assert.equal((await api.createExpense(expense)).id, 3);
});

test('mark installment as paid patches the correct nested resource', async () => {
  const { api } = setup(
    (path, request) => {
      assert.equal(path, '/api/v1/installment_purchases/8/installments/12');
      assert.equal(request.method, 'PATCH');
      assert.equal(request.headers.Authorization, 'Bearer example-token');
      assert.deepEqual(JSON.parse(request.body), { paid: true });
    },
    { id: 12, paid: true },
  );
  assert.equal((await api.markInstallmentAsPaid(8, 12)).paid, true);
});

test('protected 401 invalidates the token and exposes the API error', async () => {
  const { api, revoked } = setup(
    () => {},
    { errors: [{ field: 'base', message: 'Sesión vencida' }] },
    401,
  );
  await assert.rejects(api.me(), { status: 401, message: 'Sesión vencida' });
  assert.deepEqual(revoked, ['example-token']);
});

test('budget listing and alerts use the selected month', async () => {
  const { api } = setup((path, request, query) => {
    assert.match(path, /^\/api\/v1\/budget(s|_alerts)$/);
    assert.equal(query.get('period'), '2026-11');
    assert.equal(request.headers.Authorization, 'Bearer example-token');
  }, []);
  assert.deepEqual(await api.budgets('2026-11'), []);
  assert.deepEqual(await api.budgetAlerts('2026-11'), []);
});

test('updating an expense can remove its optional payment method', async () => {
  const { api } = setup(
    (path, request) => {
      assert.equal(path, '/api/v1/expenses/7');
      assert.equal(request.method, 'PATCH');
      assert.deepEqual(JSON.parse(request.body), { payment_method_id: null });
    },
    { id: 7, payment_method_id: null },
  );
  assert.equal((await api.updateExpense(7, { payment_method_id: null })).payment_method_id, null);
});

test('registration sends only the four contract fields and keeps field errors', async () => {
  const credentials = {
    user: 'demo',
    email: 'demo@example.test',
    password: 'example-password',
    password_confirmation: 'example-password',
  };
  const issues = [{ field: 'email', message: 'ya está en uso' }];
  const { api, revoked } = setup(
    (path, request) => {
      assert.equal(path, '/api/v1/register');
      assert.equal(request.method, 'POST');
      assert.equal(request.headers.Authorization, undefined);
      assert.equal(request.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(request.body), credentials);
    },
    { errors: issues },
    422,
  );
  await assert.rejects(api.register(credentials), { status: 422, issues });
  assert.deepEqual(revoked, []);
});

test('monthly installments uses the dashboard period and the session token', async () => {
  const payload = { period: '2026-11', installments: [], total: '0.0' };
  const controller = new AbortController();
  const { api } = setup((path, request, query) => {
    assert.equal(path, '/api/v1/installment_purchases/monthly_total');
    assert.equal(query.get('period'), '2026-11');
    assert.equal(request.headers.Authorization, 'Bearer example-token');
    assert.equal(request.signal, controller.signal);
  }, payload);
  assert.deepEqual(await api.installmentMonthlyTotal(payload.period, controller.signal), payload);
});

test('income listing gets all records without sending a month filter', async () => {
  const { api } = setup((path, request, query) => {
    assert.equal(path, '/api/v1/incomes');
    assert.equal(request.method, 'GET');
    assert.equal(query.size, 0);
  }, []);
  assert.deepEqual(await api.incomes(), []);
});

test('income writes use the contract paths and only the date and amount', async () => {
  const dateAndAmount = { date: '2026-11-09', amount: 500.25 };
  for (const method of ['POST', 'PATCH']) {
    const { api } = setup(
      (path, request) => {
        assert.equal(path, method === 'POST' ? '/api/v1/incomes' : '/api/v1/incomes/7');
        assert.equal(request.method, method);
        assert.equal(request.headers['Content-Type'], 'application/json');
        assert.deepEqual(JSON.parse(request.body), dateAndAmount);
      },
      { id: 7 },
    );
    const result =
      method === 'POST'
        ? await api.createIncome(dateAndAmount)
        : await api.updateIncome(7, dateAndAmount);
    assert.equal(result.id, 7);
  }
  const api = createResources(
    createClient({
      baseUrl: 'https://example.test/api/v1',
      getToken: () => 'token',
      fetcher: async (url, options) => {
        assert.equal(new URL(url).pathname, '/api/v1/incomes/7');
        assert.equal(options.method, 'DELETE');
        assert.equal(options.body, undefined);
        return new Response(null, { status: 204 });
      },
    }),
  );
  assert.equal(await api.removeIncome(7), undefined);
});
