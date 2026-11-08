# Genera las alertas de presupuesto. Una alerta se crea cuando lo gastado llega a un umbral
# (Budget::ALERT_THRESHOLDS) y no se repite: cada umbral avisa una sola vez por presupuesto.
class BudgetAlertChecker
  # Después de guardar un gasto: revisa el presupuesto de su categoría y el de sus categorías padre
  # en el mes del gasto.
  def self.for_expense(expense)
    category_ids = category_with_ancestors(expense.category)
    budgets = Budget.where(user_id: expense.user_id, period: expense.date.strftime("%Y-%m"),
                           category_id: category_ids)
    budgets.flat_map { |budget| for_budget(budget) }
  end

  # Revisa un presupuesto. Devuelve las alertas nuevas.
  def self.for_budget(budget)
    percentage = budget.percentage
    Budget::ALERT_THRESHOLDS.select { |threshold| percentage >= threshold }.filter_map do |threshold|
      create_alert(budget, threshold)
    end
  end

  def self.create_alert(budget, threshold)
    return if budget.budget_alerts.exists?(threshold_percentage: threshold)

    budget.budget_alerts.create!(
      threshold_percentage: threshold,
      triggered_at: Time.current,
      financial_tip: FinancialTip.for_alert.to_a.sample
    )
  rescue ActiveRecord::RecordNotUnique
    nil
  end

  # La categoría y todas sus categorías padre, de abajo hacia arriba.
  def self.category_with_ancestors(category)
    ids = []
    while category && ids.exclude?(category.id)
      ids << category.id
      category = category.parent
    end
    ids
  end

  private_class_method :create_alert, :category_with_ancestors
end
