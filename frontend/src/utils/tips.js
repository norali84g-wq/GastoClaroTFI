// Elige un consejo según el día del año, así cambia a diario y todos los usuarios ven el mismo ese día.
export function tipIndex(date, length) {
  if (length <= 0) return 0;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start) / 86_400_000);
  return day % length;
}
