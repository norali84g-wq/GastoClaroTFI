import { esClaveIcono, iconoPorNombre } from '../domain/icons.js';

export function Icono({ clave, size = 36, color }) {
  const src = esClaveIcono(clave) ? clave : 'otros';
  return (
    <span
      className="gc-category-icon"
      style={{ '--category-icon-size': `${size}px`, '--category-icon-color': color }}
    >
      <img
        src={`/iconos/${src}.webp`}
        alt=""
        width={128}
        height={128}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export function ProductIcon({ name }) {
  return <Icono clave={iconoPorNombre(name)} size={32} />;
}
