import i18n from '../i18n';
import es from '../locales/es.json';
import {
  formatAmount,
  formatDate,
  formatCompactAmount,
  formatMonthName,
  formatMonthShort,
  formatPercentage,
  formatPeriod,
  formatPurchaseChannel,
  formatShortPeriod,
} from './format';

describe('formato', () => {
  it('muestra los montos con punto para los miles y coma para los decimales', () => {
    expect(formatAmount(13101)).toMatch(/^\$\s13\.101,00$/);
    expect(formatAmount(1800.5)).toMatch(/1\.800,50$/);
  });

  it('muestra los porcentajes redondeados, sin decimales', () => {
    // Según la versión de ICU, el signo va pegado al número o separado por un espacio.
    expect(formatPercentage(0.6562)).toMatch(/^66\s?%$/);
  });

  it('muestra la fecha del calendario sin correrla por la zona horaria', () => {
    expect(formatDate('2026-09-01')).toBe('01/09/2026');
  });

  it('nombra el período con el mes y el año', () => {
    expect(formatPeriod('2026-09')).toBe('septiembre de 2026');
  });

  it('abrevia el período como la fecha, con el mes en dos cifras', () => {
    expect(formatShortPeriod('2026-09')).toBe('09/2026');
    expect(formatShortPeriod('2026-11')).toBe('11/2026');
  });

  it('traduce el canal de compra y muestra tal cual un código desconocido', () => {
    expect(formatPurchaseChannel('retiro', i18n.t)).toBe(es.expenses.channels.retiro);
    expect(formatPurchaseChannel('online', i18n.t)).toBe('online');
  });

  it('muestra el mes abreviado y los importes en forma compacta para los gráficos', () => {
    expect(formatMonthShort('2026-06')).toBe('jun');
    expect(formatMonthName(9)).toBe('septiembre');
    expect(formatCompactAmount(600000)).toBe('$ 600 mil');
    expect(formatCompactAmount(1250000)).toBe('$ 1,3 M');
    expect(formatCompactAmount(850)).toBe('$ 850');
  });
});
