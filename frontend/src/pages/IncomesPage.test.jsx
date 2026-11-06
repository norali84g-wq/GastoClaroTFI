import { screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { AMOUNT_MIN_EXCLUSIVE, ROUTES } from '../config/constants';
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
import { todayISO } from '../utils/dates';
import { formatDate } from '../utils/format';
import { logError } from '../utils/logger';

function apiIncome(overrides = {}) {
  return {
    id: 1,
    amount: '450000.0',
    date: '2026-11-02',
    user: { id: 1, user: 'nico' },
    ...overrides,
  };
}

// Lo que respondería la API al crear el ingreso que se le manda.
function createdIncome({ body }) {
  return jsonResponse(201, apiIncome({ id: 99, amount: String(body.amount), date: body.date }));
}

function renderIncomes(routes = {}) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, TEST_USER),
    'GET /incomes': jsonResponse(200, []),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.INCOMES) };
}

function submitButton() {
  return screen.getByRole('button', { name: es.incomes.form.submit });
}

// El aviso de confirmación (toast) que aparece después de guardar.
function findConfirmation() {
  return screen.findByText(es.incomes.form.success, { selector: '.toast__message' });
}

describe('Listado de ingresos', () => {
  it('muestra los ingresos con la fecha y el monto formateados', async () => {
    // La respuesta queda pendiente hasta comprobar que se ve la carga.
    const held = heldResponse();
    renderIncomes({ 'GET /incomes': held.handler });

    expect(await screen.findByText(es.incomes.list.loading)).toBeInTheDocument();
    held.respond(
      jsonResponse(200, [
        apiIncome({ id: 2, amount: '150.5', date: '2026-11-03' }),
        apiIncome({ id: 1 }),
      ]),
    );

    const table = await screen.findByRole('table', { name: es.incomes.list.caption });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual([es.incomes.fields.date, es.incomes.fields.amount, es.incomes.list.actions]);

    const [, first, second] = within(table).getAllByRole('row');
    expect(first).toHaveTextContent('03/11/2026');
    expect(first).toHaveTextContent('$ 150,50');
    expect(second).toHaveTextContent('02/11/2026');
    expect(second).toHaveTextContent('$ 450.000,00');
  });

  it('si no hay ingresos, muestra el estado vacío', async () => {
    renderIncomes();

    expect(
      await screen.findByRole('heading', { name: es.incomes.list.emptyTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(es.incomes.list.emptyDescription)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('Nuevo ingreso', () => {
  it('un alta correcta confirma y, al cerrar el aviso, suma el ingreso al listado', async () => {
    const { user, fetchMock } = renderIncomes({ 'POST /incomes': createdIncome });
    await screen.findByRole('heading', { name: es.incomes.list.emptyTitle });

    await user.type(screen.getByLabelText(es.incomes.fields.amount), '1500,50');
    await user.click(submitButton());

    // La confirmación se anuncia y el foco vuelve a la fecha para cargar otro ingreso. Mientras el
    // aviso está a la vista, el ingreso todavía no aparece.
    const confirmation = await findConfirmation();
    expect(confirmation).toHaveAttribute('role', 'status');
    expect(screen.getByLabelText(es.incomes.fields.date)).toHaveFocus();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: es.common.close }));

    const row = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(row).toHaveTextContent('$ 1.500,50');
    expect(row).toHaveTextContent(formatDate(todayISO()));

    const [call] = fetchCallsTo(fetchMock, 'POST /incomes');
    expect(call.body).toEqual({ amount: 1500.5, date: todayISO() });
    expect(fetchCallsTo(fetchMock, 'GET /incomes')).toHaveLength(1);
    expect(screen.getByLabelText(es.incomes.fields.amount)).toHaveValue('');
  });

  it('muestra el error de la API en el campo del monto', async () => {
    const message = 'debe ser mayor a 0';
    const { user } = renderIncomes({
      'POST /incomes': jsonResponse(422, apiErrors(['amount', message])),
    });
    await screen.findByRole('heading', { name: es.incomes.list.emptyTitle });

    await user.type(screen.getByLabelText(es.incomes.fields.amount), '1500');
    await user.click(submitButton());

    const amount = screen.getByLabelText(es.incomes.fields.amount);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(amount).toHaveAccessibleDescription(expect.stringContaining(message));
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(amount).toHaveFocus();
  });

  it('valida antes de enviar: con monto 0 no hace ningún pedido', async () => {
    const { user, fetchMock } = renderIncomes();
    await screen.findByRole('heading', { name: es.incomes.list.emptyTitle });

    await user.type(screen.getByLabelText(es.incomes.fields.amount), '0');
    await user.click(submitButton());

    expect(screen.getByLabelText(es.incomes.fields.amount)).toHaveAccessibleDescription(
      expect.stringContaining(i18n.t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })),
    );
    expect(fetchCallsTo(fetchMock, 'POST /incomes')).toHaveLength(0);
  });
});

// Lo que respondería la API al editar el ingreso 1 con el monto y la fecha que se le mandan.
function updatedIncome({ body }) {
  return jsonResponse(200, apiIncome({ amount: String(body.amount), date: body.date }));
}

function findTable() {
  return screen.findByRole('table', { name: es.incomes.list.caption });
}

// El aviso (toast) que aparece después de editar o borrar.
function findNotice(message) {
  return screen.findByText(message, { selector: '.toast__message' });
}

// Los botones de la fila del ingreso. Su nombre es, por ejemplo, "Editar el ingreso de $ 450.000,00
// del 02/11/2026".
function editButton() {
  return screen.getByRole('button', { name: /^Editar el ingreso/ });
}

function deleteButton() {
  return screen.getByRole('button', { name: /^Borrar el ingreso/ });
}

describe('Editar un ingreso', () => {
  it('al editar, el formulario se carga con el ingreso y el cambio se ve enseguida', async () => {
    const { user, fetchMock } = renderIncomes({
      'GET /incomes': jsonResponse(200, [apiIncome()]),
      'PATCH /incomes/1': updatedIncome,
    });
    await findTable();

    await user.click(editButton());

    expect(screen.getByRole('heading', { name: es.incomes.form.editTitle })).toBeVisible();
    expect(screen.getByLabelText(es.incomes.fields.date)).toHaveValue('2026-11-02');
    const amount = screen.getByLabelText(es.incomes.fields.amount);
    expect(amount).toHaveValue('450000');

    await user.clear(amount);
    await user.type(amount, '500000');
    await user.click(screen.getByRole('button', { name: es.incomes.form.update }));

    await findNotice(es.incomes.form.updated);
    expect(within(screen.getByRole('table')).getAllByRole('row')[1]).toHaveTextContent(
      '$ 500.000,00',
    );
    const [call] = fetchCallsTo(fetchMock, 'PATCH /incomes/1');
    expect(call.body).toEqual({ amount: 500000, date: '2026-11-02' });
    expect(screen.getByRole('heading', { name: es.incomes.form.title })).toBeVisible();
  });

  it('cancelar la edición vuelve al formulario de alta sin guardar nada', async () => {
    const { user, fetchMock } = renderIncomes({
      'GET /incomes': jsonResponse(200, [apiIncome()]),
    });
    await findTable();

    await user.click(editButton());
    await user.click(screen.getByRole('button', { name: es.common.cancel }));

    expect(screen.getByRole('heading', { name: es.incomes.form.title })).toBeVisible();
    expect(screen.getByLabelText(es.incomes.fields.amount)).toHaveValue('');
    expect(fetchCallsTo(fetchMock, 'PATCH /incomes/1')).toHaveLength(0);
  });

  it('muestra el error de la API en el campo del monto y deja el ingreso como estaba', async () => {
    const message = 'debe ser mayor a 0';
    const { user } = renderIncomes({
      'GET /incomes': jsonResponse(200, [apiIncome()]),
      'PATCH /incomes/1': jsonResponse(422, apiErrors(['amount', message])),
    });
    await findTable();

    await user.click(editButton());
    const amount = screen.getByLabelText(es.incomes.fields.amount);
    await user.clear(amount);
    await user.type(amount, '1');
    await user.click(screen.getByRole('button', { name: es.incomes.form.update }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('table')).toHaveTextContent('$ 450.000,00');
  });
});

describe('Borrar un ingreso', () => {
  it('pide confirmación: cancelar no borra y confirmar sí', async () => {
    const { user, fetchMock } = renderIncomes({
      'GET /incomes': jsonResponse(200, [apiIncome()]),
      'DELETE /incomes/1': jsonResponse(204),
    });
    await findTable();

    await user.click(deleteButton());
    expect(screen.getByText(/^¿Borrar el ingreso/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: es.common.cancel }));
    expect(fetchCallsTo(fetchMock, 'DELETE /incomes/1')).toHaveLength(0);
    expect(screen.getByRole('table')).toHaveTextContent('$ 450.000,00');

    await user.click(deleteButton());
    await user.click(screen.getByRole('button', { name: es.incomes.list.deleteConfirm }));

    await findNotice(es.incomes.list.deleted);
    expect(fetchCallsTo(fetchMock, 'DELETE /incomes/1')).toHaveLength(1);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: es.incomes.list.emptyTitle }),
    ).toBeInTheDocument();
  });

  it('si el borrado falla, avisa, lo registra y el ingreso queda en el listado', async () => {
    const { user } = renderIncomes({
      'GET /incomes': jsonResponse(200, [apiIncome()]),
      'DELETE /incomes/1': jsonResponse(404, apiErrors()),
    });
    await findTable();

    await user.click(deleteButton());
    await user.click(screen.getByRole('button', { name: es.incomes.list.deleteConfirm }));

    expect(await screen.findByRole('alert')).toHaveTextContent(es.incomes.list.deleteError);
    expect(logError).toHaveBeenCalled();
    expect(screen.getByRole('table')).toHaveTextContent('$ 450.000,00');
  });
});
