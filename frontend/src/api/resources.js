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
    updateBudget: (id, body) => request(`/budgets/${id}`, { method: 'PATCH', body }),
    removeBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),
    shoppingItems: (period, signal) =>
      request(`/shopping_list_items${periodQuery(period)}`, { signal }),
    createShoppingItem: (body) => request('/shopping_list_items', { method: 'POST', body }),
    updateShoppingItem: (id, body) =>
      request(`/shopping_list_items/${id}`, { method: 'PATCH', body }),
    removeShoppingItem: (id) => request(`/shopping_list_items/${id}`, { method: 'DELETE' }),
    copyShoppingItems: (from, to) =>
      request('/shopping_list_items/copy', {
        method: 'POST',
        body: { from_period: from, to_period: to },
      }),
    savings: (signal) => request('/savings', { signal }),
    savingsGoals: (signal) => request('/savings_goals', { signal }),
    createSavingsGoal: (body) => request('/savings_goals', { method: 'POST', body }),
    updateSavingsGoal: (id, body) => request(`/savings_goals/${id}`, { method: 'PATCH', body }),
    removeSavingsGoal: (id) => request(`/savings_goals/${id}`, { method: 'DELETE' }),
    monthlyComparison: (from, to, signal) =>
      request(`/statistics/monthly_comparison?${new URLSearchParams({ from, to })}`, { signal }),
    statistics: (year, month, signal) => {
      const query = new URLSearchParams({ year });
      if (month) query.set('month', month);
      return request(`/statistics?${query}`, { signal });
    },
    paymentMethods: (signal) => request('/payment_methods', { signal }),
    createPaymentMethod: (body) => request('/payment_methods', { method: 'POST', body }),
    updatePaymentMethod: (id, body) => request(`/payment_methods/${id}`, { method: 'PATCH', body }),
    removePaymentMethod: (id) => request(`/payment_methods/${id}`, { method: 'DELETE' }),
    dashboard: (signal) => request('/dashboard', { signal }),
    categoryComparison: (id, period, signal) =>
      request(`/categories/${id}/comparison${periodQuery(period)}`, { signal }),
    categories: (signal) => request('/categories', { signal }),
    createCategory: (body) => request('/categories', { method: 'POST', body }),
    updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PATCH', body }),
    removeCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
    expenses: (period, signal) => request(`/expenses${periodQuery(period)}`, { signal }),
    createExpense: (body) => request('/expenses', { method: 'POST', body }),
    updateExpense: (id, body) => request(`/expenses/${id}`, { method: 'PATCH', body }),
    removeExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
    incomes: (signal) => request('/incomes', { signal }),
    createIncome: (body) => request('/incomes', { method: 'POST', body }),
    updateIncome: (id, body) => request(`/incomes/${id}`, { method: 'PATCH', body }),
    removeIncome: (id) => request(`/incomes/${id}`, { method: 'DELETE' }),
    installmentMonthlyTotal: (period, signal) =>
      request(`/installment_purchases/monthly_total${periodQuery(period)}`, { signal }),
    purchases: (signal) => request('/installment_purchases', { signal }),
    createPurchase: (body) => request('/installment_purchases', { method: 'POST', body }),
    updatePurchase: (id, body) =>
      request(`/installment_purchases/${id}`, { method: 'PATCH', body }),
    removePurchase: (id) => request(`/installment_purchases/${id}`, { method: 'DELETE' }),
    installments: (id, signal) => request(`/installment_purchases/${id}/installments`, { signal }),
    markInstallmentAsPaid: (purchaseId, installmentId) =>
      request(`/installment_purchases/${purchaseId}/installments/${installmentId}`, {
        method: 'PATCH',
        body: { paid: true },
      }),
  };
}
