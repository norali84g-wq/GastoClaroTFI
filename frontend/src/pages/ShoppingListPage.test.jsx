import { fireEvent, screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import i18n from '../i18n';
import es from '../locales/es.json';
import {
  apiErrors,
  fetchCallsTo,
  heldResponse,
  jsonResponse,
  mockApi,
  TEST_TOKEN,
  TEST_USER,
} from '../test/api';
import { renderApp } from '../test/renderApp';
import { currentPeriod } from '../utils/dates';
import { formatShortPeriod } from '../utils/format';
import { logError } from '../utils/logger';

const CATEGORIES = [
  { id: 1, name: 'Comida', parent_id: null, tracks_installments: null },
  { id: 2, name: 'Servicios', parent_id: null, tracks_installments: null },
];

function apiItem(overrides = {}) {
  return {
    id: 1,
    name: 'Arroz',
    period: '2026-11',
    quantity: '2.0',
    estimated_unit_price: '1500.0',
    subtotal: '3000.0',
    category: { id: 1, name: 'Comida' },
    ...overrides,
  };
}

// Lo que respondería la API al crear el ítem que se le manda: el subtotal lo calcula ella.
function createdItem({ body }) {
  return jsonResponse(
    201,
    apiItem({
      id: 99,
      name: body.name,
      period: body.period,
      quantity: body.quantity === null ? null : String(body.quantity),
      estimated_unit_price: String(body.estimated_unit_price),
      subtotal: String((body.quantity ?? 0) * body.estimated_unit_price),
      category: CATEGORIES.find(({ id }) => id === body.category_id),
    }),
  );
}

function renderShoppingList(routes = {}) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, TEST_USER),
    'GET /categories': jsonResponse(200, CATEGORIES),
    'GET /shopping_list_items': jsonResponse(200, []),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.SHOPPING_LIST) };
}

function field(name) {
  return screen.getByLabelText(es.shoppingList.fields[name]);
}

async function fillItem(
  user,
  { name = 'Fideos', category = 'Comida', quantity = '3', price = '800' } = {},
) {
  await user.selectOptions(await screen.findByLabelText(es.shoppingList.fields.category), category);
  await user.type(field('name'), name);
  if (quantity) await user.type(field('quantity'), quantity);
  if (price) await user.type(field('estimatedUnitPrice'), price);
}

function submitButton() {
  return screen.getByRole('button', { name: es.shoppingList.form.submit });
}

async function findTable() {
  return screen.findByRole('table', { name: es.shoppingList.list.caption });
}

// Las filas de datos del listado, sin la de encabezados.
async function findRows() {
  return within(await findTable())
    .getAllByRole('row')
    .slice(1);
}

function editButton(name) {
  return screen.getByRole('button', { name: i18n.t('shoppingList.list.editLabel', { name }) });
}

function deleteButton(name) {
  return screen.getByRole('button', { name: i18n.t('shoppingList.list.deleteLabel', { name }) });
}

describe('Listado de gastos fijos', () => {
  it('muestra cada ítem con su categoría, el precio y el subtotal que calcula la API', async () => {
    // La respuesta queda pendiente hasta comprobar que se ve la carga.
    const held = heldResponse();
    renderShoppingList({ 'GET /shopping_list_items': held.handler });

    expect(await screen.findByText(es.shoppingList.list.loading)).toBeInTheDocument();
    held.respond(
      jsonResponse(200, [
        apiItem(),
        apiItem({
          id: 2,
          name: 'Luz',
          quantity: null,
          estimated_unit_price: '9000.0',
          subtotal: '0.0',
        }),
      ]),
    );

    const table = await findTable();
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual([
      es.shoppingList.fields.period,
      es.shoppingList.fields.name,
      es.shoppingList.fields.category,
      es.shoppingList.fields.quantity,
      es.shoppingList.fields.estimatedUnitPrice,
      es.shoppingList.fields.subtotal,
      es.shoppingList.list.actions,
    ]);

    const [arroz, luz] = await findRows();
    expect(arroz).toHaveTextContent(formatShortPeriod('2026-11'));
    expect(arroz).toHaveTextContent('Arroz');
    expect(arroz).toHaveTextContent('Comida');
    expect(arroz).toHaveTextContent('$ 1.500,00');
    expect(arroz).toHaveTextContent('$ 3.000,00');
    // Sin cantidad, la fila lo aclara.
    expect(luz).toHaveTextContent(es.shoppingList.list.noQuantity);
    expect(screen.getByText(es.shoppingList.list.note)).toBeInTheDocument();
  });

  it('si no hay ítems, muestra el estado vacío e invita a cargar uno', async () => {
    const { user } = renderShoppingList();

    expect(
      await screen.findByRole('heading', { name: es.shoppingList.list.emptyTitle }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: es.shoppingList.list.emptyAction }));
    expect(field('name')).toHaveFocus();
  });

  it('si falla la carga, muestra el error y permite reintentar', async () => {
    const { user } = renderShoppingList({
      'GET /shopping_list_items': [
        new TypeError('Failed to fetch'),
        jsonResponse(200, [apiItem()]),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(es.errors.network);
    await user.click(screen.getByRole('button', { name: es.common.retry }));

    expect(await screen.findByText('Arroz')).toBeInTheDocument();
    expect(screen.queryByText(es.errors.network)).not.toBeInTheDocument();
  });

  it('se llega desde la navegación', async () => {
    saveToken(TEST_TOKEN);
    mockApi({
      'GET /me': jsonResponse(200, TEST_USER),
      'GET /dashboard': jsonResponse(500),
      'GET /expenses': jsonResponse(200, []),
      'GET /categories': jsonResponse(200, CATEGORIES),
      'GET /shopping_list_items': jsonResponse(200, []),
    });
    const { user } = renderApp(ROUTES.DASHBOARD);

    await user.click(await screen.findByRole('link', { name: es.nav.shoppingList }));

    expect(
      await screen.findByRole('heading', { level: 1, name: es.shoppingList.title }),
    ).toBeInTheDocument();
  });
});

describe('Nuevo gasto fijo', () => {
  it('valida antes de enviar y no hace ningún pedido', async () => {
    const { user, fetchMock } = renderShoppingList();
    await fillItem(user, { name: '  ', quantity: '0', price: '' });
    await user.click(submitButton());

    expect(field('name')).toHaveAccessibleDescription(es.validation.required);
    expect(field('estimatedUnitPrice')).toHaveAccessibleDescription(
      expect.stringContaining(es.validation.required),
    );
    expect(field('quantity')).toHaveAccessibleDescription(
      expect.stringContaining(i18n.t('validation.amountPositive', { min: 0 })),
    );
    expect(field('name')).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'POST /shopping_list_items')).toHaveLength(0);
  });

  it('un alta correcta confirma, suma el ítem al listado y no toca el panel', async () => {
    const { user, fetchMock } = renderShoppingList({
      'GET /shopping_list_items': jsonResponse(200, [apiItem()]),
      'POST /shopping_list_items': createdItem,
    });
    await findTable();

    await fillItem(user, { name: '  Fideos  ', quantity: '3', price: '800,50' });
    await user.click(submitButton());

    expect(await screen.findByText(es.shoppingList.form.created)).toBeInTheDocument();
    const rows = await findRows();
    expect(rows).toHaveLength(2);
    // Mismo mes: van por nombre.
    expect(rows[0]).toHaveTextContent('Arroz');
    expect(rows[1]).toHaveTextContent('Fideos');
    expect(rows[1]).toHaveTextContent('$ 2.401,50');

    const [call] = fetchCallsTo(fetchMock, 'POST /shopping_list_items');
    expect(call.body).toEqual({
      name: 'Fideos',
      period: currentPeriod(),
      quantity: 3,
      estimated_unit_price: 800.5,
      category_id: 1,
    });
    // El formulario queda listo para otro, sin volver a pedir el listado ni el resumen.
    expect(field('name')).toHaveValue('');
    expect(field('name')).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'GET /shopping_list_items')).toHaveLength(1);
    expect(fetchCallsTo(fetchMock, 'GET /dashboard')).toHaveLength(0);
  });

  it('sin cantidad, manda quantity en null', async () => {
    const { user, fetchMock } = renderShoppingList({ 'POST /shopping_list_items': createdItem });
    await fillItem(user, { name: 'Luz', category: 'Servicios', quantity: '', price: '9000' });
    await user.click(submitButton());

    await screen.findByText(es.shoppingList.form.created);
    const [call] = fetchCallsTo(fetchMock, 'POST /shopping_list_items');
    expect(call.body.quantity).toBeNull();
    expect(call.body.category_id).toBe(2);
  });

  it('muestra los errores 422 de la API en sus campos y los generales en un aviso', async () => {
    const { user } = renderShoppingList({
      'POST /shopping_list_items': jsonResponse(
        422,
        apiErrors(
          ['category_id', 'debe existir'],
          ['period', 'debe tener formato AAAA-MM'],
          ['base', 'No se pudo guardar el gasto'],
        ),
      ),
    });

    await fillItem(user);
    await user.click(submitButton());

    const general = await screen.findByText('No se pudo guardar el gasto');
    expect(general.closest('[role="alert"]')).toBeInTheDocument();
    expect(field('category')).toHaveAccessibleDescription('debe existir');
    expect(field('category')).toHaveAttribute('aria-invalid', 'true');
    expect(field('period')).toHaveAccessibleDescription('debe tener formato AAAA-MM');
    expect(field('category')).toHaveFocus();
    expect(logError).toHaveBeenCalledWith(expect.objectContaining({ status: 422 }));
  });
});

describe('Editar un gasto fijo', () => {
  it('carga el ítem en el formulario, guarda los cambios y devuelve el foco a la fila', async () => {
    const { user, fetchMock } = renderShoppingList({
      'GET /shopping_list_items': jsonResponse(200, [apiItem()]),
      'PATCH /shopping_list_items/1': ({ body }) =>
        jsonResponse(
          200,
          apiItem({
            quantity: String(body.quantity),
            subtotal: String(body.quantity * body.estimated_unit_price),
          }),
        ),
    });
    await findTable();

    await user.click(editButton('Arroz'));

    expect(
      screen.getByRole('heading', { name: es.shoppingList.form.editTitle }),
    ).toBeInTheDocument();
    expect(field('name')).toHaveFocus();
    expect(field('name')).toHaveValue('Arroz');
    expect(field('category')).toHaveValue('1');
    expect(field('period')).toHaveValue('2026-11');
    expect(field('quantity')).toHaveValue('2');
    expect(field('estimatedUnitPrice')).toHaveValue('1500');

    await user.clear(field('quantity'));
    await user.type(field('quantity'), '5');
    await user.click(screen.getByRole('button', { name: es.shoppingList.form.update }));

    expect(await screen.findByText(es.shoppingList.form.updated)).toBeInTheDocument();
    const [row] = await findRows();
    expect(row).toHaveTextContent('$ 7.500,00');
    expect(editButton('Arroz')).toHaveFocus();
    expect(screen.getByRole('heading', { name: es.shoppingList.form.title })).toBeInTheDocument();

    const [call] = fetchCallsTo(fetchMock, 'PATCH /shopping_list_items/1');
    expect(call.body).toEqual({
      name: 'Arroz',
      period: '2026-11',
      quantity: 5,
      estimated_unit_price: 1500,
      category_id: 1,
    });
  });

  it('al cancelar vuelve al alta sin pedir nada', async () => {
    const { user, fetchMock } = renderShoppingList({
      'GET /shopping_list_items': jsonResponse(200, [apiItem()]),
    });
    await findTable();

    await user.click(editButton('Arroz'));
    await user.click(screen.getByRole('button', { name: es.common.cancel }));

    expect(screen.getByRole('heading', { name: es.shoppingList.form.title })).toBeInTheDocument();
    expect(field('name')).toHaveValue('');
    expect(editButton('Arroz')).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'PATCH /shopping_list_items/1')).toHaveLength(0);
  });
});

describe('Borrar un gasto fijo', () => {
  it('pide confirmación antes de borrar', async () => {
    const { user, fetchMock } = renderShoppingList({
      'GET /shopping_list_items': jsonResponse(200, [
        apiItem(),
        apiItem({ id: 2, name: 'Fideos' }),
      ]),
      'DELETE /shopping_list_items/1': jsonResponse(204),
    });
    await findTable();
    const question = i18n.t('shoppingList.list.deleteQuestion', { name: 'Arroz' });

    // Cancelar no borra nada y devuelve el foco al botón.
    await user.click(deleteButton('Arroz'));
    expect(screen.getByRole('group', { name: question })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: es.common.cancel }));
    expect(deleteButton('Arroz')).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'DELETE /shopping_list_items/1')).toHaveLength(0);

    await user.click(deleteButton('Arroz'));
    await user.click(screen.getByRole('button', { name: es.shoppingList.list.deleteConfirm }));

    expect(await screen.findByText(es.shoppingList.list.deleted)).toBeInTheDocument();
    const rows = await findRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Fideos');
    expect(screen.getByRole('heading', { name: es.shoppingList.list.title })).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'DELETE /shopping_list_items/1')).toHaveLength(1);
  });

  it('si la API no puede borrarlo, avisa el motivo y el ítem queda en el listado', async () => {
    const { user } = renderShoppingList({
      'GET /shopping_list_items': jsonResponse(200, [apiItem()]),
      'DELETE /shopping_list_items/1': jsonResponse(404),
    });
    await findTable();

    await user.click(deleteButton('Arroz'));
    await user.click(screen.getByRole('button', { name: es.shoppingList.list.deleteConfirm }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(es.shoppingList.list.deleteError);
    expect(alert).toHaveTextContent(es.errors.notFound);
    expect(logError).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    expect(await findRows()).toHaveLength(1);
    expect(deleteButton('Arroz')).toHaveFocus();
  });
});

describe('Filtro por mes de los gastos fijos', () => {
  it('muestra todos los meses y, al elegir uno, solo ese', async () => {
    renderShoppingList({
      'GET /shopping_list_items': jsonResponse(200, [
        apiItem({ id: 1, name: 'Arroz', period: '2026-10' }),
        apiItem({ id: 2, name: 'Fideos', period: '2026-11' }),
      ]),
    });

    const table = await findTable();
    expect(within(table).getByText('Arroz')).toBeInTheDocument();
    expect(within(table).getByText('Fideos')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(es.shoppingList.filter.label), {
      target: { value: '2026-11' },
    });

    expect(within(await findTable()).queryByText('Arroz')).not.toBeInTheDocument();
    expect(within(await findTable()).getByText('Fideos')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(es.shoppingList.filter.label), {
      target: { value: '2026-12' },
    });

    expect(await screen.findByText(/No hay gastos fijos en/)).toBeInTheDocument();
  });
});
