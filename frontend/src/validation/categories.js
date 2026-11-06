// Devuelve { campo: [mensajes] } solo con los campos que tienen problemas; `t` es la función de
// traducción. El nombre es obligatorio; la categoría a la que pertenece es opcional.
export function validateCategory({ name }, t) {
  const errors = {};
  if (name.trim() === '') errors.name = [t('validation.required')];
  return errors;
}

// Pasa los valores del formulario (texto) a los tipos que espera la API. Sin categoría padre,
// parentId es null.
export function toCategory({ name, parentId, tracksInstallments }) {
  return { name, parentId: parentId === '' ? null : Number(parentId), tracksInstallments };
}

// Lo inverso: una categoría ya guardada como valores del formulario, para editarla.
export function toCategoryFormValues({ name, parentId, tracksInstallments }) {
  return { name, parentId: parentId === null ? '' : String(parentId), tracksInstallments };
}
