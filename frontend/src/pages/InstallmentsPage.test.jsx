import { screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { INSTALLMENTS_MAX, INSTALLMENTS_MIN, ROUTES } from '../config/constants';
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
  { id: 4, name: 'Electrodomésticos', parent_id: null, tracks_installments: true },
  { id: 1, name: 'Supermercado', parent_id: null, tracks_installments: null },
];

function apiPurchase(overrides = {}) {
  return {
    id: 1,
    description: 'Heladera',
    total_amount: '1200.0',
    installments_count: 12,
    first_period: '2026-11',
    category_id: 4,
    vendor_id: null,
    installment_amount: '100.0',
    remaining_installments: 11,
    ...overrides,
  };
}

// Lo que respondería la API al crear la compra que se le manda: la cuota la calcula ella.
function createdPurchase({ body }) {
  return jsonResponse(
    201,
    apiPurchase({
      id: 99,
      description: body.description,
      total_amount: String(body.total_amount),
      installments_count: body.installments_count,
      first_period: body.first_period,
      category_id: body.category_id,
      installment_amount: String(body.total_amount / body.installments_count),
      remaining_installments: body.installments_count,
    }),
  );
}

function renderInstallments(routes = {}) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, TEST_USER),
    'GET /categories': jsonResponse(200, CATEGORIES),
    'GET /installment_purchases': jsonResponse(200, []),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.INSTALLMENTS) };
}

function field(name) {
  return screen.getByLabelText(es.installments.fields[name]);
}

async function fillPurchase(
  user,
  { description = 'Televisor', category = 'Electrodomésticos', total = '900', count = '3' } = {},
) {
  await user.selectOptions(await screen.findByLabelText(es.installments.fields.category), category);
  await user.type(field('description'), description);
  await user.type(field('totalAmount'), total);
  await user.type(field('installmentsCount'), count);
}

function submitButton() {
  return screen.getByRole('button', { name: es.installments.form.submit });
}

async function findTable() {
  return screen.findByRole('table', { name: es.installments.list.caption });
}

// Las filas de datos del listado, sin la de encabezados.
async function findRows() {
  return within(await findTable())
    .getAllByRole('row')
    .slice(1);
}

function editButton(description) {
  return screen.getByRole('button', {
    name: i18n.t('installments.list.editLabel', { description }),
  });
}

function deleteButton(description) {
  return screen.getByRole('button', {
    name: i18n.t('installments.list.deleteLabel', { description }),
  });
}

describe('Listado de compras en cuotas', () => {
  it('muestra cada compra con el valor de la cuota y cuántas faltan', async () => {
    // La respuesta queda pendiente hasta comprobar que se ve la carga.
    const held = heldResponse();
    renderInstallments({ 'GET /installment_purchases': held.handler });

    expect(await screen.findByText(es.installments.list.loading)).toBeInTheDocument();
    held.respond(
      jsonResponse(200, [
        apiPurchase(),
        apiPurchase({ id: 2, description: 'Bicicleta', category_id: 999 }),
      ]),
    );

    const table = await findTable();
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual([
      es.installments.fields.description,
      es.installments.fields.category,
      es.installments.fields.firstPeriod,
      es.installments.fields.totalAmount,
      es.installments.fields.installmentAmount,
      es.installments.fields.remainingInstallments,
      es.installments.list.actions,
    ]);

    const [heladera, bicicleta] = await findRows();
    expect(heladera).toHaveTextContent('Heladera');
    expect(heladera).toHaveTextContent('Electrodomésticos');
    expect(heladera).toHaveTextContent(formatShortPeriod('2026-11'));
    expect(heladera).toHaveTextContent('$ 1.200,00');
    expect(heladera).toHaveTextContent('$ 100,00');
    expect(heladera).toHaveTextContent(
      i18n.t('installments.list.remaining', { remaining: 11, count: 12 }),
    );
    // Una categoría que ya no está en la lista no rompe la fila.
    expect(bicicleta).toHaveTextContent(es.installments.list.unknownCategory);
    expect(screen.getByText(es.installments.list.note)).toBeInTheDocument();
  });

  it('si no hay compras, muestra el estado vacío e invita a cargar una', async () => {
    const { user } = renderInstallments();

    expect(
      await screen.findByRole('heading', { name: es.installments.list.emptyTitle }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: es.installments.list.emptyAction }));
    expect(field('description')).toHaveFocus();
  });

  it('si falla la carga, muestra el error y permite reintentar', async () => {
    const { user } = renderInstallments({
      'GET /installment_purchases': [
        new TypeError('Failed to fetch'),
        jsonResponse(200, [apiPurchase()]),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(es.errors.network);
    await user.click(screen.getByRole('button', { name: es.common.retry }));

    expect(await screen.findByText('Heladera')).toBeInTheDocument();
    expect(screen.queryByText(es.errors.network)).not.toBeInTheDocument();
  });

  it('se llega desde la navegación', async () => {
    saveToken(TEST_TOKEN);
    mockApi({
      'GET /me': jsonResponse(200, TEST_USER),
      'GET /dashboard': jsonResponse(500),
      'GET /expenses': jsonResponse(200, []),
      'GET /categories': jsonResponse(200, CATEGORIES),
      'GET /installment_purchases': jsonResponse(200, []),
    });
    const { user } = renderApp(ROUTES.DASHBOARD);

    await user.click(await screen.findByRole('link', { name: es.nav.installments }));

    expect(
      await screen.findByRole('heading', { level: 1, name: es.installments.title }),
    ).toBeInTheDocument();
  });
});

describe('Tarjetas', () => {
  it('solo ofrece las categorías marcadas como tarjeta para cargar una compra', async () => {
    renderInstallments({
      'GET /categories': jsonResponse(200, [
        ...CATEGORIES,
        { id: 7, name: 'Visa', parent_id: null, tracks_installments: true },
      ]),
    });

    const select = await screen.findByLabelText(es.installments.fields.category);
    const options = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(options).toEqual([
      es.installments.form.categoryPlaceholder,
      'Electrodomésticos',
      'Visa',
    ]);
  });

  it('si no hay ninguna tarjeta, lo explica y no deja guardar', async () => {
    renderInstallments({
      'GET /categories': jsonResponse(200, [
        { id: 1, name: 'Supermercado', parent_id: null, tracks_installments: null },
      ]),
    });

    const select = await screen.findByLabelText(es.installments.fields.category);

    expect(select).toHaveAccessibleDescription(es.installments.form.noCategories);
    expect(screen.getByRole('button', { name: es.installments.form.submit })).toBeDisabled();
  });
});

describe('Resumen por tarjeta', () => {
  it('suma lo que se paga por mes en cada categoría, sin contar las compras ya terminadas', async () => {
    renderInstallments({
      'GET /installment_purchases': jsonResponse(200, [
        apiPurchase(),
        apiPurchase({ id: 2, description: 'Televisor', installment_amount: '50.0' }),
        apiPurchase({
          id: 3,
          description: 'Bicicleta',
          category_id: 1,
          installment_amount: '999.0',
          remaining_installments: 0,
        }),
      ]),
    });

    const summary = await screen.findByRole('table', { name: es.installments.summary.title });
    const [, row] = within(summary).getAllByRole('row');
    expect(row).toHaveTextContent('Electrodomésticos');
    expect(row).toHaveTextContent('2');
    expect(row).toHaveTextContent('$ 150,00');
    // La compra ya terminada no suma ni crea su fila.
    expect(within(summary).getAllByRole('row')).toHaveLength(2);
  });
});

describe('Nueva compra en cuotas', () => {
  it('valida antes de enviar, con el límite de cuotas de la configuración', async () => {
    const { user, fetchMock } = renderInstallments();
    await fillPurchase(user, { description: '  ', count: String(INSTALLMENTS_MAX + 1) });
    await user.click(submitButton());

    const limit = i18n.t('validation.installmentsCount', {
      min: INSTALLMENTS_MIN,
      max: INSTALLMENTS_MAX,
    });
    expect(field('installmentsCount')).toHaveAccessibleDescription(expect.stringContaining(limit));
    expect(field('description')).toHaveAccessibleDescription(es.validation.required);
    expect(field('description')).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'POST /installment_purchases')).toHaveLength(0);
  });

  it('un alta correcta confirma, suma la compra arriba del listado y no toca el panel', async () => {
    const { user, fetchMock } = renderInstallments({
      'GET /installment_purchases': jsonResponse(200, [apiPurchase()]),
      'POST /installment_purchases': createdPurchase,
    });
    await findTable();

    await fillPurchase(user, { description: '  Televisor  ', total: '900,50' });
    await user.click(submitButton());

    expect(await screen.findByText(es.installments.form.created)).toBeInTheDocument();
    const [created, previous] = await findRows();
    expect(created).toHaveTextContent('Televisor');
    expect(created).toHaveTextContent('$ 900,50');
    expect(created).toHaveTextContent(
      i18n.t('installments.list.remaining', { remaining: 3, count: 3 }),
    );
    expect(previous).toHaveTextContent('Heladera');

    const [call] = fetchCallsTo(fetchMock, 'POST /installment_purchases');
    expect(call.body).toEqual({
      description: 'Televisor',
      total_amount: 900.5,
      installments_count: 3,
      first_period: currentPeriod(),
      category_id: 4,
    });
    // El formulario queda listo para otra compra, sin volver a pedir el listado ni el resumen.
    expect(field('description')).toHaveValue('');
    expect(field('description')).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'GET /installment_purchases')).toHaveLength(1);
    expect(fetchCallsTo(fetchMock, 'GET /dashboard')).toHaveLength(0);
  });

  it('muestra los errores 422 de la API en sus campos y los generales en un aviso', async () => {
    const { user } = renderInstallments({
      'POST /installment_purchases': jsonResponse(
        422,
        apiErrors(
          ['category_id', 'debe existir'],
          ['first_period', 'debe tener formato AAAA-MM'],
          ['base', 'No se pudo guardar la compra'],
        ),
      ),
    });

    await fillPurchase(user);
    await user.click(submitButton());

    const general = await screen.findByText('No se pudo guardar la compra');
    expect(general.closest('[role="alert"]')).toBeInTheDocument();
    expect(field('category')).toHaveAccessibleDescription('debe existir');
    expect(field('category')).toHaveAttribute('aria-invalid', 'true');
    expect(field('firstPeriod')).toHaveAccessibleDescription('debe tener formato AAAA-MM');
    // El foco va al primer campo con problema, en el orden del formulario.
    expect(field('category')).toHaveFocus();
    expect(logError).toHaveBeenCalledWith(expect.objectContaining({ status: 422 }));
  });
});

describe('Editar una compra en cuotas', () => {
  it('carga la compra en el formulario, guarda los cambios y devuelve el foco a la fila', async () => {
    const { user, fetchMock } = renderInstallments({
      'GET /installment_purchases': jsonResponse(200, [apiPurchase()]),
      'PATCH /installment_purchases/1': ({ body }) =>
        jsonResponse(
          200,
          apiPurchase({
            installments_count: body.installments_count,
            installment_amount: '200.0',
            remaining_installments: 5,
          }),
        ),
    });
    await findTable();

    await user.click(editButton('Heladera'));

    expect(
      screen.getByRole('heading', { name: es.installments.form.editTitle }),
    ).toBeInTheDocument();
    expect(field('description')).toHaveFocus();
    expect(field('description')).toHaveValue('Heladera');
    expect(field('category')).toHaveValue('4');
    expect(field('totalAmount')).toHaveValue('1200');
    expect(field('firstPeriod')).toHaveValue('2026-11');

    await user.clear(field('installmentsCount'));
    await user.type(field('installmentsCount'), '6');
    await user.click(screen.getByRole('button', { name: es.installments.form.update }));

    expect(await screen.findByText(es.installments.form.updated)).toBeInTheDocument();
    const [row] = await findRows();
    expect(row).toHaveTextContent('$ 200,00');
    expect(row).toHaveTextContent(
      i18n.t('installments.list.remaining', { remaining: 5, count: 6 }),
    );
    expect(editButton('Heladera')).toHaveFocus();
    expect(screen.getByRole('heading', { name: es.installments.form.title })).toBeInTheDocument();

    const [call] = fetchCallsTo(fetchMock, 'PATCH /installment_purchases/1');
    expect(call.body).toEqual({
      description: 'Heladera',
      total_amount: 1200,
      installments_count: 6,
      first_period: '2026-11',
      category_id: 4,
    });
  });

  it('muestra el error 422 de la API sin cambiar el listado', async () => {
    const { user } = renderInstallments({
      'GET /installment_purchases': jsonResponse(200, [apiPurchase()]),
      'PATCH /installment_purchases/1': jsonResponse(
        422,
        apiErrors(['installments_count', 'debe ser menor o igual a 48']),
      ),
    });
    await findTable();

    await user.click(editButton('Heladera'));
    await user.click(screen.getByRole('button', { name: es.installments.form.update }));

    expect(await screen.findByText('debe ser menor o igual a 48')).toBeInTheDocument();
    expect(field('installmentsCount')).toHaveAccessibleDescription(
      expect.stringContaining('debe ser menor o igual a 48'),
    );
    expect(field('installmentsCount')).toHaveFocus();
    const [row] = await findRows();
    expect(row).toHaveTextContent(
      i18n.t('installments.list.remaining', { remaining: 11, count: 12 }),
    );
  });

  it('al cancelar vuelve al alta sin pedir nada', async () => {
    const { user, fetchMock } = renderInstallments({
      'GET /installment_purchases': jsonResponse(200, [apiPurchase()]),
    });
    await findTable();

    await user.click(editButton('Heladera'));
    await user.click(screen.getByRole('button', { name: es.common.cancel }));

    expect(screen.getByRole('heading', { name: es.installments.form.title })).toBeInTheDocument();
    expect(field('description')).toHaveValue('');
    expect(editButton('Heladera')).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'PATCH /installment_purchases/1')).toHaveLength(0);
  });
});

describe('Borrar una compra en cuotas', () => {
  it('pide confirmación antes de borrar', async () => {
    const { user, fetchMock } = renderInstallments({
      'GET /installment_purchases': jsonResponse(200, [
        apiPurchase(),
        apiPurchase({ id: 2, description: 'Bicicleta' }),
      ]),
      'DELETE /installment_purchases/1': jsonResponse(204),
    });
    await findTable();
    const question = i18n.t('installments.list.deleteQuestion', { description: 'Heladera' });

    // Cancelar, con el botón o con Escape, no borra nada y devuelve el foco al botón.
    await user.click(deleteButton('Heladera'));
    expect(screen.getByRole('group', { name: question })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.common.cancel })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: es.common.cancel }));
    expect(deleteButton('Heladera')).toHaveFocus();

    await user.click(deleteButton('Heladera'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: question })).not.toBeInTheDocument();
    expect(fetchCallsTo(fetchMock, 'DELETE /installment_purchases/1')).toHaveLength(0);

    await user.click(deleteButton('Heladera'));
    await user.click(screen.getByRole('button', { name: es.installments.list.deleteConfirm }));

    expect(await screen.findByText(es.installments.list.deleted)).toBeInTheDocument();
    const rows = await findRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Bicicleta');
    expect(screen.getByRole('heading', { name: es.installments.list.title })).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'DELETE /installment_purchases/1')).toHaveLength(1);
    expect(fetchCallsTo(fetchMock, 'GET /dashboard')).toHaveLength(0);
  });

  it('si la API no puede borrarla, avisa el motivo y la compra queda en el listado', async () => {
    const { user } = renderInstallments({
      'GET /installment_purchases': jsonResponse(200, [apiPurchase()]),
      'DELETE /installment_purchases/1': jsonResponse(404),
    });
    await findTable();

    await user.click(deleteButton('Heladera'));
    await user.click(screen.getByRole('button', { name: es.installments.list.deleteConfirm }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(es.installments.list.deleteError);
    expect(alert).toHaveTextContent(es.errors.notFound);
    expect(logError).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    expect(await findRows()).toHaveLength(1);
    expect(deleteButton('Heladera')).toHaveFocus();
  });
});
