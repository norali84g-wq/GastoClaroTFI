import { screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { AMOUNT_MIN_EXCLUSIVE, ROUTES } from '../config/constants';
import i18n from '../i18n';
import es from '../locales/es.json';
import { apiErrors, fetchCallsTo, jsonResponse, mockApi, TEST_TOKEN, TEST_USER } from '../test/api';
import { renderApp } from '../test/renderApp';
import { formatAmount, formatPercentage } from '../utils/format';
import { logError } from '../utils/logger';

function apiGoal(overrides = {}) {
  return {
    id: 1,
    name: 'Viaje',
    target_amount: '1000.0',
    saved_amount: '250.0',
    deadline: null,
    progress_percentage: 25,
    ...overrides,
  };
}

// Lo que respondería la API al crear la meta que se le manda.
function createdGoal({ body }) {
  return jsonResponse(
    201,
    apiGoal({
      id: 99,
      name: body.name,
      target_amount: String(body.target_amount),
      saved_amount: String(body.saved_amount),
      deadline: body.deadline,
      progress_percentage: 0,
    }),
  );
}

// Lo que respondería la API al editar la meta 1 con 500 ahorrados de 1000.
function updatedGoal({ body }) {
  return jsonResponse(
    200,
    apiGoal({ saved_amount: String(body.saved_amount), progress_percentage: 50 }),
  );
}

function renderGoals(routes = {}) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, TEST_USER),
    'GET /savings_goals': jsonResponse(200, []),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.SAVINGS_GOALS) };
}

function findTable() {
  return screen.findByRole('table', { name: es.savingsGoals.list.caption });
}

function findEmptyState() {
  return screen.findByRole('heading', { name: es.savingsGoals.list.emptyTitle });
}

// El aviso (toast) que aparece después de guardar, editar o borrar.
function findConfirmation(message) {
  return screen.findByText(message, { selector: '.toast__message' });
}

function button(name) {
  return screen.getByRole('button', { name });
}

describe('Listado de metas', () => {
  it('muestra cada meta con su fecha, lo ahorrado y el avance que calcula la API', async () => {
    renderGoals({
      'GET /savings_goals': jsonResponse(200, [
        apiGoal({
          id: 2,
          name: 'Notebook',
          target_amount: '800.0',
          saved_amount: '0.0',
          deadline: '2027-03-01',
          progress_percentage: 0,
        }),
        apiGoal(),
      ]),
    });

    const table = await findTable();
    // Lo ahorrado y el objetivo van en columnas separadas, para que los montos largos entren.
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual([
      es.savingsGoals.fields.name,
      es.savingsGoals.fields.deadline,
      es.savingsGoals.fields.savedAmount,
      es.savingsGoals.fields.targetAmount,
      es.savingsGoals.fields.progress,
      es.savingsGoals.fields.actions,
    ]);
    const [, notebook, trip] = within(table).getAllByRole('row');
    const cells = (row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent);
    expect(cells(notebook).slice(0, 5)).toEqual([
      'Notebook',
      '01/03/2027',
      formatAmount(0),
      formatAmount(800),
      formatPercentage(0),
    ]);
    expect(cells(trip).slice(0, 5)).toEqual([
      'Viaje',
      es.savingsGoals.list.noDeadline,
      formatAmount(250),
      formatAmount(1000),
      formatPercentage(0.25),
    ]);
  });

  it('si no hay metas, muestra el estado vacío', async () => {
    renderGoals();

    expect(await findEmptyState()).toBeInTheDocument();
    expect(screen.getByText(es.savingsGoals.list.emptyDescription)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('Nueva meta y edición', () => {
  it('un alta correcta confirma y, al cerrar el aviso, suma la meta al listado', async () => {
    const { user, fetchMock } = renderGoals({ 'POST /savings_goals': createdGoal });
    await findEmptyState();

    await user.type(screen.getByLabelText(es.savingsGoals.fields.name), 'Notebook');
    await user.type(screen.getByLabelText(es.savingsGoals.fields.targetAmount), '800');
    await user.click(button(es.savingsGoals.form.create));

    // Mientras el aviso está a la vista, la meta todavía no aparece.
    await findConfirmation(es.savingsGoals.messages.created);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(button(es.common.close));

    expect(within(await findTable()).getAllByRole('row')[1]).toHaveTextContent('Notebook');
    const [call] = fetchCallsTo(fetchMock, 'POST /savings_goals');
    expect(call.body).toEqual({
      name: 'Notebook',
      target_amount: 800,
      saved_amount: 0,
      deadline: null,
    });
    expect(screen.getByLabelText(es.savingsGoals.fields.name)).toHaveValue('');
  });

  it('al editar, el formulario se carga con la meta y el cambio se ve enseguida', async () => {
    const { user, fetchMock } = renderGoals({
      'GET /savings_goals': jsonResponse(200, [apiGoal()]),
      'PATCH /savings_goals/1': updatedGoal,
    });
    await findTable();

    await user.click(button(i18n.t('savingsGoals.list.editLabel', { name: 'Viaje' })));

    expect(screen.getByRole('heading', { name: es.savingsGoals.form.editTitle })).toBeVisible();
    const saved = screen.getByLabelText(es.savingsGoals.fields.savedAmount);
    expect(screen.getByLabelText(es.savingsGoals.fields.name)).toHaveValue('Viaje');
    expect(saved).toHaveValue('250');

    await user.clear(saved);
    await user.type(saved, '500');
    await user.click(button(es.savingsGoals.form.save));

    await findConfirmation(es.savingsGoals.messages.updated);
    const row = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(row).toHaveTextContent('$ 500,00');
    expect(row).toHaveTextContent('$ 1.000,00');
    expect(row).toHaveTextContent(formatPercentage(0.5));

    const [call] = fetchCallsTo(fetchMock, 'PATCH /savings_goals/1');
    expect(call.body).toEqual({
      name: 'Viaje',
      target_amount: 1000,
      saved_amount: 500,
      deadline: null,
    });
    expect(screen.getByRole('heading', { name: es.savingsGoals.form.createTitle })).toBeVisible();
  });

  it('cancelar la edición vuelve al formulario de alta sin guardar nada', async () => {
    const { user, fetchMock } = renderGoals({
      'GET /savings_goals': jsonResponse(200, [apiGoal()]),
    });
    await findTable();

    await user.click(button(i18n.t('savingsGoals.list.editLabel', { name: 'Viaje' })));
    await user.click(button(es.savingsGoals.form.cancel));

    expect(screen.getByRole('heading', { name: es.savingsGoals.form.createTitle })).toBeVisible();
    expect(screen.getByLabelText(es.savingsGoals.fields.name)).toHaveValue('');
    expect(fetchCallsTo(fetchMock, 'PATCH /savings_goals/1')).toHaveLength(0);
  });
});

describe('Borrar una meta', () => {
  const deleteLabel = () => i18n.t('savingsGoals.list.deleteLabel', { name: 'Viaje' });

  it('pide confirmación: cancelar no borra y confirmar sí', async () => {
    const { user, fetchMock } = renderGoals({
      'GET /savings_goals': jsonResponse(200, [apiGoal()]),
      'DELETE /savings_goals/1': jsonResponse(204),
    });
    await findTable();

    // La pregunta arranca con el foco en Cancelar; cancelar lo devuelve a Borrar.
    await user.click(button(deleteLabel()));
    expect(
      screen.getByRole('group', {
        name: i18n.t('savingsGoals.list.confirmDelete', { name: 'Viaje' }),
      }),
    ).toBeInTheDocument();
    expect(button(es.common.cancel)).toHaveFocus();
    await user.click(button(es.common.cancel));
    expect(button(deleteLabel())).toHaveFocus();
    expect(fetchCallsTo(fetchMock, 'DELETE /savings_goals/1')).toHaveLength(0);
    expect(screen.getByRole('table')).toHaveTextContent('Viaje');

    await user.click(button(deleteLabel()));
    await user.click(button(es.savingsGoals.list.confirmYes));

    await findConfirmation(es.savingsGoals.messages.deleted);
    expect(fetchCallsTo(fetchMock, 'DELETE /savings_goals/1')).toHaveLength(1);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(await findEmptyState()).toBeInTheDocument();
    // La fila ya no está: el foco pasa al título del listado en lugar de perderse.
    expect(screen.getByRole('heading', { name: es.savingsGoals.list.title })).toHaveFocus();
  });

  it('si el borrado falla, avisa, lo registra y la meta queda en el listado', async () => {
    const { user } = renderGoals({
      'GET /savings_goals': jsonResponse(200, [apiGoal()]),
      'DELETE /savings_goals/1': jsonResponse(404, apiErrors()),
    });
    await findTable();

    await user.click(button(deleteLabel()));
    await user.click(button(es.savingsGoals.list.confirmYes));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      es.savingsGoals.messages.deleteError,
    );
    expect(logError).toHaveBeenCalled();
    expect(screen.getByRole('table')).toHaveTextContent('Viaje');
    expect(button(deleteLabel())).toHaveFocus();
  });
});

describe('Errores al guardar', () => {
  it('muestra el error de la API en el campo del monto objetivo', async () => {
    const message = 'debe ser mayor a 0';
    const { user } = renderGoals({
      'POST /savings_goals': jsonResponse(422, apiErrors(['target_amount', message])),
    });
    await findEmptyState();

    await user.type(screen.getByLabelText(es.savingsGoals.fields.name), 'Notebook');
    await user.type(screen.getByLabelText(es.savingsGoals.fields.targetAmount), '800');
    await user.click(button(es.savingsGoals.form.create));

    const target = screen.getByLabelText(es.savingsGoals.fields.targetAmount);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(target).toHaveAccessibleDescription(expect.stringContaining(message));
    expect(target).toHaveAttribute('aria-invalid', 'true');
    expect(target).toHaveFocus();
  });

  it('valida antes de enviar: sin nombre y con objetivo 0 no hace ningún pedido', async () => {
    const { user, fetchMock } = renderGoals();
    await findEmptyState();

    await user.type(screen.getByLabelText(es.savingsGoals.fields.targetAmount), '0');
    await user.click(button(es.savingsGoals.form.create));

    const name = screen.getByLabelText(es.savingsGoals.fields.name);
    expect(name).toHaveAccessibleDescription(es.validation.required);
    expect(name).toHaveFocus();
    expect(screen.getByLabelText(es.savingsGoals.fields.targetAmount)).toHaveAccessibleDescription(
      expect.stringContaining(i18n.t('validation.amountPositive', { min: AMOUNT_MIN_EXCLUSIVE })),
    );
    expect(fetchCallsTo(fetchMock, 'POST /savings_goals')).toHaveLength(0);
  });
});
