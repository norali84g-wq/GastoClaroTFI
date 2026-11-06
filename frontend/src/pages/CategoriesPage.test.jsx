import { screen, within } from '@testing-library/react';
import { saveToken } from '../api/tokenStorage';
import { ROUTES } from '../config/constants';
import i18n from '../i18n';
import es from '../locales/es.json';
import { apiErrors, fetchCallsTo, jsonResponse, mockApi, TEST_TOKEN, TEST_USER } from '../test/api';
import { renderApp } from '../test/renderApp';

const ADMIN = { ...TEST_USER, admin: true };

function apiCategory(overrides = {}) {
  return { id: 1, name: 'Tarjetas', parent_id: null, tracks_installments: null, ...overrides };
}

function renderCategories(routes = {}, user = ADMIN) {
  saveToken(TEST_TOKEN);
  const fetchMock = mockApi({
    'GET /me': jsonResponse(200, user),
    'GET /categories': jsonResponse(200, []),
    ...routes,
  });
  return { fetchMock, ...renderApp(ROUTES.CATEGORIES) };
}

function field(name) {
  return screen.getByLabelText(es.categories.fields[name]);
}

async function findRows() {
  const table = await screen.findByRole('table', { name: es.categories.list.caption });
  return within(table).getAllByRole('row').slice(1);
}

function deleteButton(name) {
  return screen.getByRole('button', { name: i18n.t('categories.list.deleteLabel', { name }) });
}

function editButton(name) {
  return screen.getByRole('button', { name: i18n.t('categories.list.editLabel', { name }) });
}

describe('Categorías', () => {
  it('un usuario común no ve el menú ni puede administrarlas', async () => {
    renderCategories({}, TEST_USER);

    expect(await screen.findByText(es.categories.adminOnly)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: es.nav.categories })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('el administrador ve el menú y el listado con la categoría principal de cada una', async () => {
    renderCategories({
      'GET /categories': jsonResponse(200, [
        apiCategory(),
        apiCategory({ id: 2, name: 'Visa', parent_id: 1 }),
      ]),
    });

    expect(await screen.findByRole('link', { name: es.nav.categories })).toBeInTheDocument();
    const [tarjetas, visa] = await findRows();
    expect(tarjetas).toHaveTextContent('Tarjetas');
    expect(tarjetas).toHaveTextContent(es.categories.list.noParent);
    expect(visa).toHaveTextContent('Visa');
    expect(visa).toHaveTextContent('Tarjetas');
  });

  it('si no hay categorías, muestra el estado vacío e invita a crear una', async () => {
    const { user } = renderCategories();

    expect(
      await screen.findByRole('heading', { name: es.categories.list.emptyTitle }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: es.categories.list.emptyAction }));
    expect(field('name')).toHaveFocus();
  });

  it('crea una categoría dentro de otra y la suma al listado', async () => {
    const { user, fetchMock } = renderCategories({
      'GET /categories': jsonResponse(200, [apiCategory()]),
      'POST /categories': ({ body }) =>
        jsonResponse(201, apiCategory({ id: 9, name: body.name, parent_id: body.parent_id })),
    });
    await findRows();

    await user.type(field('name'), '  Mastercard  ');
    await user.selectOptions(field('parent'), 'Tarjetas');
    await user.click(screen.getByRole('button', { name: es.categories.form.submit }));

    expect(await screen.findByText(es.categories.form.created)).toBeInTheDocument();
    const rows = await findRows();
    expect(rows).toHaveLength(2);
    // La subcategoría nueva queda debajo de su categoría principal.
    expect(rows[0]).toHaveTextContent('Tarjetas');
    expect(rows[1]).toHaveTextContent('Mastercard');
    const [call] = fetchCallsTo(fetchMock, 'POST /categories');
    expect(call.body).toEqual({ name: 'Mastercard', parent_id: 1, tracks_installments: false });
    expect(field('name')).toHaveValue('');
  });

  it('valida el nombre antes de enviar', async () => {
    const { user, fetchMock } = renderCategories();
    await screen.findByRole('heading', { name: es.categories.list.emptyTitle });

    await user.click(screen.getByRole('button', { name: es.categories.form.submit }));

    expect(field('name')).toHaveAccessibleDescription(es.validation.required);
    expect(fetchCallsTo(fetchMock, 'POST /categories')).toHaveLength(0);
  });

  it('muestra el error 422 de la API en su campo', async () => {
    const { user } = renderCategories({
      'POST /categories': jsonResponse(422, apiErrors(['parent_id', 'debe existir'])),
    });
    await screen.findByRole('heading', { name: es.categories.list.emptyTitle });

    await user.type(field('name'), 'Visa');
    await user.click(screen.getByRole('button', { name: es.categories.form.submit }));

    expect(await screen.findByText('debe existir')).toBeInTheDocument();
    expect(field('parent')).toHaveAccessibleDescription(expect.stringContaining('debe existir'));
  });

  it('edita una categoría y devuelve el foco a su fila', async () => {
    const { user, fetchMock } = renderCategories({
      'GET /categories': jsonResponse(200, [apiCategory()]),
      'PATCH /categories/1': ({ body }) => jsonResponse(200, apiCategory({ name: body.name })),
    });
    await findRows();

    await user.click(editButton('Tarjetas'));
    expect(field('name')).toHaveValue('Tarjetas');
    expect(screen.queryByRole('option', { name: 'Tarjetas' })).not.toBeInTheDocument();
    await user.clear(field('name'));
    await user.type(field('name'), 'Tarjetas de crédito');
    await user.click(screen.getByRole('button', { name: es.categories.form.update }));

    expect(await screen.findByText(es.categories.form.updated)).toBeInTheDocument();
    const [row] = await findRows();
    expect(row).toHaveTextContent('Tarjetas de crédito');
    expect(editButton('Tarjetas de crédito')).toHaveFocus();
    const [call] = fetchCallsTo(fetchMock, 'PATCH /categories/1');
    expect(call.body).toEqual({
      name: 'Tarjetas de crédito',
      parent_id: null,
      tracks_installments: false,
    });
  });

  it('muestra las subcategorías agrupadas debajo de su categoría principal', async () => {
    renderCategories({
      'GET /categories': jsonResponse(200, [
        apiCategory({ id: 3, name: 'Visa', parent_id: 1 }),
        apiCategory({ id: 2, name: 'Servicios' }),
        apiCategory(),
        apiCategory({ id: 4, name: 'Mastercard', parent_id: 1 }),
      ]),
    });

    const rows = await findRows();

    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      'Servicios',
      'Tarjetas',
      'Mastercard',
      'Visa',
    ]);
  });

  it('marca una categoría como tarjeta y lo muestra en el listado', async () => {
    const { user, fetchMock } = renderCategories({
      'POST /categories': ({ body }) =>
        jsonResponse(
          201,
          apiCategory({ id: 9, name: body.name, tracks_installments: body.tracks_installments }),
        ),
    });
    await screen.findByRole('heading', { name: es.categories.list.emptyTitle });

    await user.type(field('name'), 'Visa');
    await user.click(field('tracksInstallments'));
    await user.click(screen.getByRole('button', { name: es.categories.form.submit }));

    await screen.findByText(es.categories.form.created);
    const [call] = fetchCallsTo(fetchMock, 'POST /categories');
    expect(call.body.tracks_installments).toBe(true);
    const [row] = await findRows();
    expect(row).toHaveTextContent(es.categories.list.isCard);
  });

  it('borra una categoría después de confirmar', async () => {
    const { user, fetchMock } = renderCategories({
      'GET /categories': jsonResponse(200, [
        apiCategory(),
        apiCategory({ id: 2, name: 'Sobrante' }),
      ]),
      'DELETE /categories/2': jsonResponse(204),
    });
    await findRows();

    await user.click(deleteButton('Sobrante'));
    await user.click(screen.getByRole('button', { name: es.categories.list.deleteConfirm }));

    expect(await screen.findByText(es.categories.list.deleted)).toBeInTheDocument();
    expect(await findRows()).toHaveLength(1);
    expect(fetchCallsTo(fetchMock, 'DELETE /categories/2')).toHaveLength(1);
  });

  it('si la API no la puede borrar, avisa el motivo y la categoría queda', async () => {
    const reason = 'No se puede borrar: tiene gastos';
    const { user } = renderCategories({
      'GET /categories': jsonResponse(200, [apiCategory()]),
      'DELETE /categories/1': jsonResponse(422, apiErrors(['base', reason])),
    });
    await findRows();

    await user.click(deleteButton('Tarjetas'));
    await user.click(screen.getByRole('button', { name: es.categories.list.deleteConfirm }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(es.categories.list.deleteError);
    expect(alert).toHaveTextContent(reason);
    expect(await findRows()).toHaveLength(1);
  });
});
