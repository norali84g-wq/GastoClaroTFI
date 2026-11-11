import { iconoPorNombre } from '../domain/icons.js';
import { useIconPreferences } from '../hooks/icon-preferences.jsx';
import { Icono } from './icono.jsx';

export function TarjetaIcono({ medio }) {
  const { paymentIcons } = useIconPreferences();
  const clave = medio ? paymentIcons.resolve(medio) : iconoPorNombre('efectivo');

  return (
    <span className="gc-payment-art gc-payment-catalog-art">
      <Icono clave={clave} />
    </span>
  );
}
