const groups = [
  [
    'Gastos del hogar',
    [
      [
        'supermercado',
        'Supermercado',
        'super|alimentación|alimentos|comida|leche|yogur|queso|arroz|fideos|huevos|aceite|cereales|almacén|mercado',
      ],
      [
        'verduleria',
        'Verdulería',
        'verdura|verduras|fruta|frutas|manzana|banana|tomate|papa|lechuga',
      ],
      ['carniceria', 'Carnicería', 'carne|pollo|bife|asado|milanesa'],
      ['panaderia', 'Panadería', 'pan|facturas|medialuna|medialunas|tostadas'],
      ['bebidas', 'Bebidas', 'bebida|gaseosa|jugo|cerveza|vino'],
      ['limpieza', 'Limpieza', 'limpiador|detergente|lavandina|desinfectante'],
      ['perfumeria', 'Perfumería', 'perfume|champú|shampoo|jabón|higiene'],
      ['mascotas', 'Mascotas', 'mascota|perro|gato|veterinaria|alimento para mascotas'],
      ['ferreteria', 'Ferretería', 'herramientas|martillo|tornillos|taladro'],
      ['muebles', 'Muebles', 'mueble|sillón|mesa|silla|sofá|cama|hogar'],
    ],
  ],
  [
    'Servicios',
    [
      ['luz', 'Luz', 'electricidad|edelap|edenor|edesur'],
      ['gas', 'Gas', 'garrafa|metrogas|camuzzi'],
      ['agua', 'Agua', 'aysa|absa|agua corriente'],
      ['internet', 'Internet', 'wifi|fibra|banda ancha'],
      ['telefono', 'Teléfono', 'telefonía|línea fija'],
      ['streaming', 'Streaming', 'netflix|spotify|prime video|disney plus'],
      ['cable', 'Cable', 'televisión por cable|tv por cable'],
      ['expensas', 'Expensas', 'consorcio'],
      ['alquiler', 'Alquiler', 'renta|arrendamiento'],
      ['seguro', 'Seguro', 'seguros|póliza|cobertura'],
    ],
  ],
  [
    'Transporte',
    [
      ['auto', 'Auto', 'automóvil|automotor|coche'],
      ['nafta', 'Nafta', 'combustible|gasoil|diésel|ypf'],
      ['micro', 'Micro', 'micros|transporte|colectivo|colectivos|ómnibus|bus|sube'],
      ['tren', 'Tren', 'ferrocarril|trenes'],
      ['moto', 'Moto', 'motocicleta'],
      ['bicicleta', 'Bicicleta', 'bici|ciclismo'],
      ['peaje', 'Peaje', 'telepase|peajes'],
      ['estacionamiento', 'Estacionamiento', 'cochera|parking'],
      ['taxi', 'Taxi o remis', 'taxi|remis|uber|cabify'],
    ],
  ],
  [
    'Salud y bienestar',
    [
      ['farmacia', 'Farmacia', 'salud|farmacias|medicamento|medicamentos|remedio'],
      ['medico', 'Médico', 'médica|consulta médica|hospital|clínica|doctor|doctora'],
      ['gimnasio', 'Gimnasio', 'gym|fitness|entrenamiento'],
      ['dentista', 'Dentista', 'odontología|odontólogo|dental'],
      ['optica', 'Óptica', 'lentes|anteojos|oftalmología'],
    ],
  ],
  [
    'Ocio y compras',
    [
      ['cine', 'Cine', 'película|entradas de cine'],
      ['salidas', 'Salidas', 'ocio|entretenimiento|recreación|bar|boliche'],
      ['restaurante', 'Restaurante', 'restaurantes|comer afuera|delivery|pizza'],
      ['cafe', 'Café', 'cafetería|cafés|café molido'],
      ['viajes', 'Viajes', 'viaje|avión|pasajes|vacaciones|turismo'],
      ['ropa', 'Ropa', 'indumentaria|vestimenta|remera|pantalón|campera'],
      ['calzado', 'Calzado', 'zapatilla|zapatillas|zapatos|botas'],
      ['regalos', 'Regalos', 'regalo|obsequio'],
      ['juegos', 'Juegos', 'juego|videojuego|juguetes|playstation'],
      ['libros', 'Libros', 'libro|librería|lectura|novela'],
    ],
  ],
  [
    'Educación y trabajo',
    [
      ['estudios', 'Estudios', 'educación|facultad|universidad|colegio|escuela'],
      ['cursos', 'Cursos', 'curso|taller|capacitación|clases'],
      ['trabajo', 'Trabajo', 'oficina|laboral|empleo'],
      ['computadora', 'Computadora', 'notebook|laptop|pc|informática'],
      ['celular', 'Celular', 'móvil|smartphone|teléfono celular'],
    ],
  ],
  [
    'Finanzas',
    [
      ['efectivo', 'Efectivo', 'cash|billetera|billetes'],
      ['tarjeta', 'Tarjeta', 'débito|crédito|visa|mastercard'],
      ['ahorro', 'Ahorro', 'ahorros|alcancía|meta'],
      ['impuestos', 'Impuestos', 'impuesto|arca|afip|arba|monotributo'],
      ['sueldo', 'Sueldo', 'salario|haberes|nómina'],
      ...['verde', 'azul', 'dorada', 'rosa', 'violeta', 'gris'].map((color) => [
        `tarjeta-${color}`,
        `Tarjeta ${color}`,
        '',
      ]),
    ],
  ],
  [
    'Otros',
    [
      ['estrella', 'Estrella', 'favorito|favorita'],
      ['corazon', 'Corazón', 'amor'],
      ['bolsa', 'Bolsa de compras', 'bolsa|compras'],
      ['otros', 'Otros', 'otro|varios'],
    ],
  ],
];

export const catalogoIconos = groups.flatMap(([grupo, items]) =>
  items.map(([clave, etiqueta, aliases]) => ({
    clave,
    etiqueta,
    grupo,
    palabras: [etiqueta, ...aliases.split('|').filter(Boolean)],
  })),
);

export function normalizarIconos(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const validKeys = new Set(catalogoIconos.map(({ clave }) => clave));
const terms = catalogoIconos
  .flatMap(({ clave, palabras }) => palabras.map((word) => [clave, normalizarIconos(word)]))
  .sort((a, b) => b[1].length - a[1].length);

export const esClaveIcono = (clave) => validKeys.has(clave);

export function iconoPorNombre(texto) {
  const value = ` ${normalizarIconos(texto)} `;
  return terms.find(([, word]) => value.includes(` ${word} `))?.[0] ?? 'otros';
}
