// Qué escena ilustra una meta, según lo que dice su nombre (casa, mar, montaña, auto, notebook,
// celular, bici, estudio, fondo de emergencia o regalo). Si no se reconoce, se reparte por id para
// que las tarjetas no salgan todas iguales.
export const GOAL_SCENES = ['mountain', 'sea', 'house'];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function goalScene({ id, name }) {
  const text = normalize(name);
  if (/auto|coche|camioneta|moto\b|vehiculo/.test(text)) return 'car';
  if (/notebook|compu|laptop|\bpc\b|tablet/.test(text)) return 'laptop';
  if (/celular|telefono|iphone|smartphone/.test(text)) return 'phone';
  if (/bici|bicicleta/.test(text)) return 'bike';
  if (/estudi|facultad|carrera|curso|universidad|libro|posgrado|maestria/.test(text))
    return 'study';
  if (/emergencia|imprevisto|reserva|colchon|fondo/.test(text)) return 'shield';
  if (/regalo|cumple|boda|casamiento|fiesta/.test(text)) return 'gift';
  if (/casa|hogar|depto|departamento|vivienda|mudanza/.test(text)) return 'house';
  if (/\bmar\b|playa|vacacion|costa|isla/.test(text)) return 'sea';
  if (/monta|patagonia|viaje|trekking|aventura|sierra/.test(text)) return 'mountain';
  return GOAL_SCENES[Math.abs(Number(id) || 0) % GOAL_SCENES.length];
}
