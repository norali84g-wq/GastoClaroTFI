import { vi } from 'vitest';
import { API_BASE_URL } from '../config/constants';
import { currentPeriod } from '../utils/dates';

export const TEST_TOKEN = 'token-de-prueba';

// El usuario con la forma que devuelven GET /me, login y register.
export const TEST_USER = { id: 1, user: 'nico', email: 'nico@example.com', admin: false };

export function jsonResponse(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function apiErrors(...errors) {
  return { errors: errors.map(([field, message]) => ({ field, message })) };
}

// Respuesta simulada que queda pendiente hasta que el test llama a `respond`. La promesa se crea
// antes de que la app pida nada: así `respond` existe siempre, sin depender de si la app ya hizo el
// pedido cuando el test la libera. `build(valor, pedido)` arma la respuesta (por defecto, el valor).
export function heldResponse(build = (value) => value) {
  let respond;
  const pending = new Promise((resolve) => (respond = resolve));
  return { handler: (call) => pending.then((value) => build(value, call)), respond };
}

// Reemplaza fetch por un mock que responde en orden. Un Error en la lista simula la red caída.
export function mockFetch(...responses) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockImplementationOnce(() =>
      response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
    );
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// Lo que responde GET /dashboard para un mes sin movimientos, con la forma de la API.
export function apiDashboard(overrides = {}) {
  return {
    period: currentPeriod(),
    income: '0.0',
    consumption: '0.0',
    savings: '0.0',
    savings_goal_percentage: 0,
    incomes: [],
    consumption_by_category: [],
    monthly_savings: [],
    ...overrides,
  };
}

// Respuestas para que el dashboard cargue sin datos, para usar con mockApi. Incluye GET /me, que
// valida el token guardado al arrancar.
export function emptyDashboardRoutes() {
  return {
    'GET /me': jsonResponse(200, TEST_USER),
    'GET /dashboard': jsonResponse(200, apiDashboard()),
    'GET /categories': jsonResponse(200, []),
    'GET /expenses': jsonResponse(200, []),
    'GET /savings_goals': jsonResponse(200, []),
  };
}

function parseCall(url, options) {
  return {
    url,
    method: options.method,
    headers: options.headers,
    body: options.body === undefined ? undefined : JSON.parse(options.body),
  };
}

// Devuelve { url, method, headers, body } del pedido número `index`.
export function fetchCall(fetchMock, index = 0) {
  const [url, options] = fetchMock.mock.calls[index];
  return parseCall(url, options);
}

// Todos los pedidos a "MÉTODO /ruta" (sin la query), en orden, con la forma de fetchCall.
export function fetchCallsTo(fetchMock, route) {
  return fetchMock.mock.calls
    .map(([url, options]) => parseCall(url, options))
    .filter((call) => routeOf(call) === route);
}

function routeOf({ url, method }) {
  const path = url.slice(API_BASE_URL.length).split('?')[0];
  return `${method} ${path}`;
}

// Reemplaza fetch por un mock que responde según el pedido. Las claves son "MÉTODO /ruta" (sin la
// query) y cada valor puede ser:
// - una respuesta (se puede usar más de una vez),
// - un Error, que simula la red caída,
// - una función que recibe el pedido ({ url, method, headers, body }) y devuelve una respuesta,
// - una lista de lo anterior, que se usa en orden; la última se repite.
// Un pedido sin respuesta simulada se avisa por consola y se comporta como la red caída.
export function mockApi(routes) {
  const queues = new Map(Object.entries(routes).map(([route, value]) => [route, [].concat(value)]));

  const fetchMock = vi.fn(async (url, options) => {
    const call = parseCall(url, options);
    const route = routeOf(call);
    const queue = queues.get(route);
    if (!queue) {
      console.error(`Pedido no simulado: ${route}`);
      throw new TypeError('Failed to fetch');
    }

    const next = queue.length > 1 ? queue.shift() : queue[0];
    if (next instanceof Error) throw next;
    return typeof next === 'function' ? next(call) : next.clone();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
