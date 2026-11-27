export function shiftPeriod(period, offset) {
  const date = new Date(`${period}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function purchaseHasInstallmentInPeriod(purchase, period) {
  const first = purchase.first_period;
  return period >= first && period <= shiftPeriod(first, purchase.installments_count - 1);
}
