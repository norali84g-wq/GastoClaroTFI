export function relativeChange(before, after) {
  if (before == null || after == null) return null;
  const base = Number(before);
  const current = Number(after);
  return base > 0 && Number.isFinite(current) ? (current - base) / base : null;
}

export function effectSegments(values) {
  const cents = values.map((value) => Math.round(Number(value) * 100));
  const negative = cents.reduce((sum, value) => sum + Math.max(0, -value), 0);
  const positive = cents.reduce((sum, value) => sum + Math.max(0, value), 0);
  const scale = 2 * Math.max(negative, positive, 1);
  let left = 50;
  let right = 50;

  return cents.map((value) => {
    const width = (Math.abs(value) / scale) * 100;
    if (value < 0) {
      left -= width;
      return { start: left, width };
    }

    const start = right;
    right += width;
    return { start, width };
  });
}
