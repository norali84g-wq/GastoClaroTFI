// Fechas en el formato de la API: 'YYYY-MM-DD' para un día y 'YYYY-MM' para un período (un mes).
// Hoy y el mes en curso se calculan con la hora local: son los del usuario, no los de UTC.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function pad(number) {
  return String(number).padStart(2, '0');
}

export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function currentPeriod(now = new Date()) {
  return periodOf(todayISO(now));
}

// Período al que pertenece una fecha 'YYYY-MM-DD'.
export function periodOf(isoDate) {
  return isoDate.slice(0, 7);
}

export function isValidPeriod(value) {
  return PERIOD_PATTERN.test(value);
}

// Además del formato, revisa que el día exista (descarta, por ejemplo, 2026-02-30).
export function isValidISODate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}
