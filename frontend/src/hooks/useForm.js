import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toFormErrors } from '../api/client';
import { TOAST_TONE } from '../config/constants';
import { statusMessage } from '../utils/errors';
import { logError } from '../utils/logger';

// Reparte el error de un envío entre los campos del formulario y los mensajes generales. Los
// mensajes de la API se muestran tal cual y todos juntos; si no trae ninguno, va el que corresponde
// al estado HTTP (403, 404, 422) o, si no, el genérico.
function splitSubmitError(error, fieldNames, apiFields, t) {
  if (error?.isNetworkError) {
    return { fieldErrors: {}, generalErrors: [t('errors.network')], isNetworkError: true };
  }

  const { fieldErrors: apiFieldErrors, baseErrors } = toFormErrors(error);
  const fieldErrors = {};
  const generalErrors = baseErrors.filter(Boolean);

  for (const [apiField, messages] of Object.entries(apiFieldErrors)) {
    const field = apiFields[apiField] ?? apiField;
    const list = messages.filter(Boolean);
    // Un campo que este formulario no muestra va a los mensajes generales para que no se pierda.
    if (fieldNames.includes(field)) fieldErrors[field] = list;
    else generalErrors.push(...list);
  }

  if (generalErrors.length === 0 && Object.keys(fieldErrors).length === 0) {
    generalErrors.push(statusMessage(error, t) ?? t('errors.generic'));
  }
  return { fieldErrors, generalErrors, isNetworkError: false };
}

// Maneja un formulario que se envía a la API: valores, validación previa, envío, errores y foco.
// - validate(values) devuelve { campo: [mensajes] } con lo que se puede chequear sin el servidor.
// - onSubmit(values) hace el pedido.
// - apiFields traduce nombres de campo de la API a los del formulario.
// - resetOnSuccess vuelve los valores a initialValues después de un envío exitoso.
// - successFocusRef es a dónde va el foco después de un envío exitoso; por ejemplo, el primer
//   campo, para cargar otro. La confirmación la muestra quien llama.
// - toast (lo que devuelve useToast) es dónde se avisan los errores generales: los de field "base"
//   y los de campos que el formulario no muestra. Sin toast, van al aviso de arriba (formErrors).
// Cada error de un campo se muestra junto a ese campo. La red caída siempre va al aviso de arriba,
// que ofrece reintentar. Todo error de envío se registra con logError.
// Después de un error, el foco va al aviso de arriba (alertRef) o al primer campo con problema.
export function useForm({
  initialValues,
  validate,
  onSubmit,
  apiFields = {},
  resetOnSuccess = false,
  successFocusRef,
  toast,
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formErrors, setFormErrors] = useState([]);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [successfulSubmits, setSuccessfulSubmits] = useState(0);
  const submittingRef = useRef(false);
  const formRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    if (failedAttempts === 0) return;
    const target = alertRef.current ?? formRef.current?.querySelector('[aria-invalid="true"]');
    target?.focus();
  }, [failedAttempts]);

  useEffect(() => {
    if (successfulSubmits > 0) successFocusRef?.current?.focus();
  }, [successfulSubmits, successFocusRef]);

  function showErrors({ fieldErrors: errorsByField, generalErrors, isNetworkError: isNetwork }) {
    const toToast = toast && !isNetwork && generalErrors.length > 0;
    if (toToast) toast.show(generalErrors, { tone: TOAST_TONE.ERROR });
    setFieldErrors(errorsByField);
    setFormErrors(toToast ? [] : generalErrors);
    setIsNetworkError(isNetwork);
    setFailedAttempts((count) => count + 1);
  }

  // Un error general de un envío anterior ya no corresponde: se cierra al volver a enviar.
  function closeErrorToast() {
    if (toast?.toast?.tone === TOAST_TONE.ERROR) toast.close();
  }

  // Al corregir un campo, su error deja de mostrarse.
  function clearFieldErrors(names) {
    setFieldErrors((current) => {
      const next = { ...current };
      for (const name of names) delete next[name];
      return next;
    });
  }

  function handleChange(event) {
    const { name, type, checked } = event.target;
    const value = type === 'checkbox' ? checked : event.target.value;
    setValues((current) => ({ ...current, [name]: value }));
    clearFieldErrors([name]);
  }

  // Para un valor que no sale de un campo simple (por ejemplo, una lista de ítems). `errorKeys` son
  // los errores que deja de mostrar; por defecto, el del propio valor.
  function setFieldValue(name, value, errorKeys = [name]) {
    setValues((current) => ({ ...current, [name]: value }));
    clearFieldErrors(errorKeys);
  }

  async function submit() {
    if (submittingRef.current) return;
    closeErrorToast();

    const clientErrors = validate?.(values) ?? {};
    if (Object.keys(clientErrors).length > 0) {
      showErrors({ fieldErrors: clientErrors, generalErrors: [], isNetworkError: false });
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setFieldErrors({});
    setFormErrors([]);
    setIsNetworkError(false);
    try {
      await onSubmit(values);
      if (resetOnSuccess) setValues(initialValues);
      setSuccessfulSubmits((count) => count + 1);
    } catch (error) {
      logError(error);
      showErrors(splitSubmitError(error, Object.keys(initialValues), apiFields, t));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit();
  }

  return {
    values,
    fieldErrors,
    formErrors,
    isNetworkError,
    isSubmitting,
    handleChange,
    setFieldValue,
    handleSubmit,
    retry: submit,
    formRef,
    alertRef,
  };
}
