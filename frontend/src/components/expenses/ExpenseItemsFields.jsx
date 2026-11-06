import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ITEM_UNITS } from '../../config/constants';
import { itemErrorKey } from '../../validation/expenses';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import FormField from '../ui/FormField';

// Ítems de un gasto que se está editando. Cada uno se puede modificar o quitar; uno quitado queda a
// la vista con la opción de deshacer, y recién se borra al guardar el gasto.
// - onChange(index, field, value) cambia un dato de un ítem; onRemove(index) y onRestore(index) lo
//   marcan para quitar o lo devuelven.
// - errors son los del formulario: los de cada campo llegan con la clave de itemErrorKey, y los que
//   la API informa para los ítems en general, en errors.items.
// Al quitar un ítem, el foco pasa a su Deshacer; al deshacer, vuelve a su nombre.
export default function ExpenseItemsFields({ items, errors, onChange, onRemove, onRestore }) {
  const { t } = useTranslation();
  // Botones y campos de cada ítem, por clave, para mover el foco después de quitar o deshacer.
  const focusTargetsRef = useRef(new Map());
  // A dónde va el foco cuando termine el render que provoca quitar o deshacer: recién entonces
  // existe el botón o el campo que lo recibe.
  const pendingFocusRef = useRef(null);

  useEffect(() => {
    const key = pendingFocusRef.current;
    if (!key) return;
    pendingFocusRef.current = null;
    focusTargetsRef.current.get(key)?.focus();
  });

  function setPendingFocus(key) {
    pendingFocusRef.current = key;
  }

  function focusTarget(key) {
    return (node) => {
      if (node) focusTargetsRef.current.set(key, node);
      else focusTargetsRef.current.delete(key);
    };
  }

  function itemLabel(item, index) {
    return item.name.trim() || t('expenses.form.item', { number: index + 1 });
  }

  return (
    <fieldset className="item-list">
      <legend>{t('expenses.fields.items')}</legend>
      <p className="form-field__hint">{t('expenses.form.itemsHint')}</p>
      <ErrorMessage messages={errors.items} />
      {items.map((item, index) => {
        if (item.removed) {
          return (
            <div key={item.id} className="item-removed">
              <p>{t('expenses.form.itemRemoved', { name: itemLabel(item, index) })}</p>
              <Button
                ref={focusTarget(`restore-${index}`)}
                variant="secondary"
                aria-label={t('expenses.form.restoreItemLabel', { name: itemLabel(item, index) })}
                onClick={() => {
                  onRestore(index);
                  setPendingFocus(`name-${index}`);
                }}
              >
                {t('expenses.form.restoreItem')}
              </Button>
            </div>
          );
        }
        const fieldError = (field) => errors[itemErrorKey(index, field)];
        const change = (field) => (event) => onChange(index, field, event.target.value);
        return (
          <fieldset key={item.id} className="item-fields">
            <legend>{t('expenses.form.item', { number: index + 1 })}</legend>
            <FormField
              ref={focusTarget(`name-${index}`)}
              label={t('expenses.fields.itemName')}
              name={itemErrorKey(index, 'name')}
              autoComplete="off"
              value={item.name}
              onChange={change('name')}
              errors={fieldError('name')}
              required
            />
            <FormField
              label={t('expenses.fields.itemQuantity')}
              name={itemErrorKey(index, 'quantity')}
              className="mono"
              inputMode="numeric"
              autoComplete="off"
              value={item.quantity}
              onChange={change('quantity')}
              errors={fieldError('quantity')}
              required
            />
            <FormField
              as="select"
              label={t('expenses.fields.itemUnit')}
              name={itemErrorKey(index, 'unit')}
              value={item.unit}
              onChange={change('unit')}
              errors={fieldError('unit')}
            >
              {ITEM_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {t(`expenses.units.${unit}`)}
                </option>
              ))}
            </FormField>
            <FormField
              label={t('expenses.fields.itemUnitPrice')}
              name={itemErrorKey(index, 'unitPrice')}
              className="mono"
              inputMode="decimal"
              autoComplete="off"
              value={item.unitPrice}
              onChange={change('unitPrice')}
              errors={fieldError('unitPrice')}
              required
            />
            <Button
              variant="secondary"
              aria-label={t('expenses.form.removeItemLabel', { name: itemLabel(item, index) })}
              onClick={() => {
                onRemove(index);
                setPendingFocus(`restore-${index}`);
              }}
            >
              {t('expenses.form.removeItem')}
            </Button>
          </fieldset>
        );
      })}
    </fieldset>
  );
}
