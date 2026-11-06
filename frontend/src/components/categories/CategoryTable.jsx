import { useTranslation } from 'react-i18next';
import { orderAsTree } from '../../utils/categories';
import Button from '../ui/Button';
import ConfirmButton from '../ui/ConfirmButton';

// Listado de categorías en el orden en que llega. `caption` nombra la tabla para lectores de
// pantalla. La categoría trae solo el id de su categoría principal: el nombre sale de la misma lista.
// onDelete(category) se llama recién cuando se confirma el borrado y devuelve una promesa que no
// falla (maneja sus propios errores). onEdit(category) se llama al tocar Editar; editButtonRef(id, node) recibe el botón de cada fila
// (null cuando se va), para que quien llama pueda devolverle el foco.
export default function CategoryTable({ caption, categories, onEdit, onDelete, editButtonRef }) {
  const { t } = useTranslation();
  const names = new Map(categories.map(({ id, name }) => [id, name]));

  return (
    <div className="table-wrapper">
      <table className="data-table data-table--stack">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t('categories.fields.name')}</th>
            <th scope="col">{t('categories.fields.parent')}</th>
            <th scope="col">{t('categories.fields.card')}</th>
            <th scope="col">
              <span className="visually-hidden">{t('categories.list.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orderAsTree(categories).map((category) => {
            const { name } = category;
            return (
              <tr key={category.id}>
                <td data-label={t('categories.fields.name')} className="free-text">
                  {category.parentId === null ? (
                    name
                  ) : (
                    <span className="category-child">{name}</span>
                  )}
                </td>
                <td data-label={t('categories.fields.parent')}>
                  {category.parentId === null ? (
                    <span className="muted">{t('categories.list.noParent')}</span>
                  ) : (
                    (names.get(category.parentId) ?? t('categories.list.unknownParent'))
                  )}
                </td>
                <td data-label={t('categories.fields.card')}>
                  {category.tracksInstallments ? (
                    t('categories.list.isCard')
                  ) : (
                    <span className="muted">{t('categories.list.noCard')}</span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <Button
                      ref={(node) => editButtonRef(category.id, node)}
                      variant="secondary"
                      aria-label={t('categories.list.editLabel', { name })}
                      onClick={() => onEdit(category)}
                    >
                      {t('categories.list.edit')}
                    </Button>
                    <ConfirmButton
                      aria-label={t('categories.list.deleteLabel', { name })}
                      question={t('categories.list.deleteQuestion', { name })}
                      confirmLabel={t('categories.list.deleteConfirm')}
                      onConfirm={() => onDelete(category)}
                    >
                      {t('categories.list.delete')}
                    </ConfirmButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
