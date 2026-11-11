export const fullName = ({ first_name, last_name }) =>
  [first_name, last_name].filter(Boolean).join(' ');

const displayDate = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC' });

export function formatAccountDate(value) {
  const date = new Date(value?.slice(0, 10) ?? '');
  return Number.isNaN(date.getTime()) ? null : displayDate.format(date);
}
