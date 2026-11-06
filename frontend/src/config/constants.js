// La URL de la API sale del entorno (.env); nunca se escribe en el código.
export const API_BASE_URL = import.meta.env.VITE_API_URL;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  SAVINGS: '/savings',
  SAVINGS_GOALS: '/savings-goals',
  DASHBOARD: '/dashboard',
  INCOMES: '/incomes',
  EXPENSES: '/expenses',
  INSTALLMENTS: '/installments',
  CATEGORIES: '/categories',
  USERS: '/users',
  SHOPPING_LIST: '/shopping-list',
  STATISTICS: '/statistics',
  CATEGORY_DETAIL: '/category-detail/:categoryId',
};

// La ruta del detalle de una categoría, con su id.
export function categoryDetailPath(categoryId) {
  return ROUTES.CATEGORY_DETAIL.replace(':categoryId', String(categoryId));
}

export const TOKEN_STORAGE_KEY = 'gastoclaro.token';

// Campo que usa la API para los errores que no pertenecen a un campo puntual.
export const BASE_ERROR_FIELD = 'base';

export const HTTP_STATUS = {
  NO_CONTENT: 204,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_CONTENT: 422,
};

// Status que usa ApiError cuando no hubo respuesta (red caída o tiempo agotado).
export const NETWORK_ERROR_STATUS = 0;

export const REQUEST_TIMEOUT_MS = 15000;

// Cuánto tiempo queda a la vista un aviso de confirmación (toast) si nadie lo cierra antes. Los
// avisos de error no se cierran solos: quedan hasta que se cierran o se vuelve a enviar.
export const TOAST_DURATION_MS = 4000;

export const TOAST_TONE = {
  SUCCESS: 'success',
  ERROR: 'error',
};

// Validar la sesión guardada con GET /me al arrancar la app: así, al recargar la página, se
// recupera el usuario del token. Si el token ya no sirve, el 401 cierra la sesión.
export const VALIDATE_SESSION_ON_START = true;

// Límites de los formularios. Deben coincidir con las validaciones del back-end.
export const PASSWORD_MIN_LENGTH = 8;
// El monto de un gasto y el total de una compra en cuotas tienen que ser estrictamente mayores que
// este valor. La fecha de un gasto no puede ser posterior a hoy.
export const AMOUNT_MIN_EXCLUSIVE = 0;
// Cantidad de cuotas que acepta una compra en cuotas, con los dos extremos incluidos.
export const INSTALLMENTS_MIN = 1;
export const INSTALLMENTS_MAX = 48;

// Montos y fechas se muestran con formato argentino: punto para los miles, coma para los decimales.
export const LOCALE = 'es-AR';
export const CURRENCY = 'ARS';
export const AMOUNT_MAX_DECIMALS = 2;

// Desde qué parte de lo planificado de una categoría (0 a 1) el panel avisa que el consumo está
// cerca del monto.
export const BUDGET_WARNING_RATIO = 0.8;

// Consejos de Inicio: desde qué parte de los ingresos el consumo se considera alto, y desde cuál el
// ahorro se considera bueno.
export const HIGH_CONSUMPTION_RATIO = 0.8;
export const GOOD_SAVINGS_RATIO = 0.1;

// Códigos de canal de compra que acepta la API. Las etiquetas visibles están en es.json.
export const PURCHASE_CHANNELS = ['presencial', 'delivery', 'retiro'];

// Ítems de un gasto: unidades que acepta la API (etiquetas en es.json) y cantidad entera mínima.
// La API recorta una cantidad con decimales sin avisar, así que se valida antes de enviar.
export const ITEM_UNITS = ['unidad', 'kg', 'g'];
export const ITEM_QUANTITY_MIN = 1;

// Colores de los gráficos. Son valores de la paleta (ver styles/tokens.css); se usan acá porque los
// atributos de un SVG no leen variables de CSS en todos los navegadores.
export const CHART_COLORS = ['#2fae7a', '#ff9f5a', '#3b82f6', '#f5c542', '#e5648a', '#7c5ce6'];
export const CHART_SERIES_COLORS = {
  income: '#2fae7a',
  consumption: '#ff9f5a',
  savings: '#3b82f6',
};

// Foto de la pantalla de ingreso (se sirve desde public/images). Si falta, se ve la ilustración.
export const LOGIN_HERO_IMAGE = '/images/login-hero.webp';

// Fotos de las metas y del cierre de Inicio (se sirven desde public/images). Si alguna falta, se ve
// la ilustración de esa escena.
export const GOAL_PHOTOS = {
  mountain: '/images/goals/mountain.webp',
  sea: '/images/goals/sea.webp',
  house: '/images/goals/house.webp',
  // Fotos opcionales: si el archivo no está en public/images/goals, se muestra la ilustración.
  car: '/images/goals/car.jpg',
  laptop: '/images/goals/laptop.jpg',
  phone: '/images/goals/phone.jpg',
  bike: '/images/goals/bike.jpg',
  study: '/images/goals/study.jpg',
  shield: '/images/goals/shield.jpg',
  gift: '/images/goals/gift.jpg',
};
export const BANNER_PHOTO = '/images/banner.webp';
