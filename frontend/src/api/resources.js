const periodQuery = (period) => `?period=${encodeURIComponent(period)}`;

export function createResources(request) {
  return {
    login: (body) => request('/login', { method: 'POST', publicRoute: true, body }),
    register: (body) => request('/register', { method: 'POST', publicRoute: true, body }),
    me: (signal) => request('/me', { signal }),
    logout: () => request('/logout', { method: 'DELETE' }),
    budgets: (period, signal) => request(`/budgets${periodQuery(period)}`, { signal }),
    budgetAlerts: (period, signal) => request(`/budget_alerts${periodQuery(period)}`, { signal }),
    createBudget: (body) => request('/budgets', { method: 'POST', body }),
    paymentMethods: (signal) => request('/payment_methods', { signal }),
    createPaymentMethod: (body) => request('/payment_methods', { method: 'POST', body }),
    updatePaymentMethod: (id, body) => request(`/payment_methods/${id}`, { method: 'PATCH', body }),
    removePaymentMethod: (id) => request(`/payment_methods/${id}`, { method: 'DELETE' }),
    dashboard: (signal) => request('/dashboard', { signal }),
    categories: (signal) => request('/categories', { signal }),
    expenses: (period, signal) => request(`/expenses${periodQuery(period)}`, { signal }),
    createExpense: (body) => request('/expenses', { method: 'POST', body }),
    updateExpense: (id, body) => request(`/expenses/${id}`, { method: 'PATCH', body }),
    removeExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
    purchases: (signal) => request('/installment_purchases', { signal }),
    createPurchase: (body) => request('/installment_purchases', { method: 'POST', body }),
    installments: (id, signal) => request(`/installment_purchases/${id}/installments`, { signal }),
    markInstallmentAsPaid: (purchaseId, installmentId) =>
      request(`/installment_purchases/${purchaseId}/installments/${installmentId}`, {
        method: 'PATCH',
        body: { paid: true },
      }),
  };
}
