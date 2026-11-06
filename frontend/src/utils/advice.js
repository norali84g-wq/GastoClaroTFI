import { GOOD_SAVINGS_RATIO, HIGH_CONSUMPTION_RATIO } from '../config/constants';
import { BUDGET_STATUS, budgetStatus } from './budget';
import { formatAmount, formatPercentage } from './format';

function namesWithStatus(summary, status) {
  return summary.consumptionByCategory
    .filter(({ total, planned }) => budgetStatus(total, planned) === status)
    .map(({ category }) => category)
    .join(', ');
}

// Un consejo según cómo viene el mes. Se arma con lo que ya trae el resumen (lo consumido y lo
// planificado por categoría, ingresos y ahorro) y con las metas: no hay un pedido aparte. Va de lo
// más urgente a lo más alentador: plan superado, cerca del plan, consumo alto, buen ahorro y, si
// no hay nada para marcar, una sugerencia.
export function pickAdvice(summary, goals, t) {
  const over = namesWithStatus(summary, BUDGET_STATUS.OVER);
  if (over) return { tone: 'alert', text: t('dashboard.advice.over', { categories: over }) };

  const near = namesWithStatus(summary, BUDGET_STATUS.NEAR);
  if (near) return { tone: 'warning', text: t('dashboard.advice.near', { categories: near }) };

  if (summary.income > 0) {
    const consumption = summary.consumption / summary.income;
    if (consumption >= HIGH_CONSUMPTION_RATIO) {
      return {
        tone: 'warning',
        text: t('dashboard.advice.highConsumption', { percentage: formatPercentage(consumption) }),
      };
    }
    if (goals && goals.length === 0) {
      return { tone: 'info', text: t('dashboard.advice.noGoals') };
    }
    const savings = summary.savings / summary.income;
    if (savings >= GOOD_SAVINGS_RATIO) {
      return {
        tone: 'success',
        text: t('dashboard.advice.goodSavings', {
          amount: formatAmount(summary.savings),
          percentage: formatPercentage(savings),
        }),
      };
    }
  }
  if (summary.savings > 0) {
    return {
      tone: 'success',
      text: t('dashboard.advice.saving', { amount: formatAmount(summary.savings) }),
    };
  }
  return { tone: 'info', text: t('dashboard.advice.empty') };
}
