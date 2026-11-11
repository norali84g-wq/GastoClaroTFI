import { Icono } from './icono.jsx';
import { useIconPreferences } from '../hooks/icon-preferences.jsx';

export function CategoriaIcono({ nombre, id, size = 36, color }) {
  const { categories, categoryIcons } = useIconPreferences();
  const category = categories.data?.find((item) =>
    id == null ? item.name === nombre : item.id === id,
  );
  const clave = categoryIcons.resolve(category ?? { id, name: nombre });

  return <Icono clave={clave} size={size} color={color} />;
}
