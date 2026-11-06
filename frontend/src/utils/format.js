import { CURRENCY, LOCALE, PURCHASE_CHANNELS } from '../config/constants';

// Formato para mostrar. Las fechas se arman en UTC a propósito: '2026-09-12' es un día del
// calendario, y con la zona horaria local se correría al 11 en la Argentina.

const amountFormat = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
const percentageFormat = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 0,
});
const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});
const periodFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

// 13101 → "$ 13.101,00"
export function formatAmount(amount) {
  return amountFormat.format(amount);
}

// 0.656 → "66 %"
export function formatPercentage(ratio) {
  return percentageFormat.format(ratio);
}

// '2026-09-12' → "12/09/2026"
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return dateFormat.format(Date.UTC(year, month - 1, day));
}

// '2026-09' → "septiembre de 2026"
export function formatPeriod(period) {
  const [year, month] = period.split('-').map(Number);
  return periodFormat.format(Date.UTC(year, month - 1, 1));
}

// '2026-09' → "09/2026". Para tablas: ocupa poco y se lee igual que formatDate. Se arma a mano
// porque Intl con es-AR no completa el mes con cero ("9/2026").
export function formatShortPeriod(period) {
  const [year, month] = period.split('-');
  return `${month}/${year}`;
}

// Traduce el código que manda la API. Un código desconocido se muestra tal cual.
export function formatPurchaseChannel(code, t) {
  return PURCHASE_CHANNELS.includes(code) ? t(`expenses.channels.${code}`) : code;
}

const monthShortFormat = new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' });

// '2026-06' → "jun"
export function formatMonthShort(period) {
  const [year, month] = period.split('-').map(Number);
  return monthShortFormat.format(Date.UTC(year, month - 1, 1)).replace('.', '');
}

// 600000 → "$ 600 mil"; 1250000 → "$ 1,3 M". Para los ejes de los gráficos, donde no entra el
// importe completo.
export function formatCompactAmount(amount) {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${sign}$ ${(abs / 1_000_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} M`;
  }
  if (abs >= 1_000) {
    return `${sign}$ ${Math.round(abs / 1_000).toLocaleString(LOCALE)} mil`;
  }
  return `${sign}$ ${Math.round(abs).toLocaleString(LOCALE)}`;
}

const monthNameFormat = new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' });

// 9 → "septiembre"
export function formatMonthName(month) {
  return monthNameFormat.format(Date.UTC(2026, month - 1, 1));
}
