// Ícono chico para una categoría, según lo que dice su nombre. Si no se reconoce, una etiqueta.
const ICONS = {
  cart: 'M3 4h2l2.4 11h10.2L20 7H6M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  clean: 'M9 3h4v3H9zM8 6h6v3l2 3v8H6v-8l2-3zM17 4l2-1M17 7l3 0',
  bolt: 'M13 3 5 13h6l-1 8 8-10h-6z',
  bus: 'M5 5h14v11H5zM5 11h14M8 19v-3M16 19v-3M8 14h.01M16 14h.01',
  health: 'M12 5v14M5 12h14',
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  food: 'M7 3v8a2 2 0 0 0 2 2v8M11 3v8M15 21V3c2 0 4 2 4 6s-2 5-4 5',
  tag: 'M4 4h8l8 8-8 8-8-8zM8 8h.01',
};

function iconFor(name) {
  const text = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (/super|mercado|compra|almacen/.test(text)) return 'cart';
  if (/limpieza|higiene|hogar/.test(text)) return 'clean';
  if (/servicio|luz|gas|agua|internet|electric/.test(text)) return 'bolt';
  if (/transporte|nafta|combustible|colectivo|auto/.test(text)) return 'bus';
  if (/farmacia|salud|medic/.test(text)) return 'health';
  if (/alquiler|casa|vivienda/.test(text)) return 'home';
  if (/comida|restaurant|delivery|cafe/.test(text)) return 'food';
  return 'tag';
}

const TONES = ['green', 'orange', 'blue', 'pink', 'violet', 'yellow'];

// Cada categoría tiene siempre el mismo color, que sale de su nombre.
function toneFor(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return TONES[hash % TONES.length];
}

export default function CategoryIcon({ name }) {
  return (
    <svg
      className={`category-icon category-icon--${toneFor(name)}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICONS[iconFor(name)]} />
    </svg>
  );
}
