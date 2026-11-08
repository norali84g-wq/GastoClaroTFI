class Api::V1::BudgetAlertsController < Api::V1::BaseController
  # Alertas de los presupuestos del usuario, de la más reciente a la más antigua.
  # `?period=AAAA-MM` trae solo las de los presupuestos de ese mes.
  def index
    if params[:period].present? && !Period.valid?(params[:period])
      return render_error(api_t("invalid_period"), status: :unprocessable_entity, field: "period")
    end

    budgets = visible_budgets
    budgets = budgets.where(period: params[:period]) if params[:period].present?
    alerts = BudgetAlert.where(budget_id: budgets.select(:id))
                        .includes(:financial_tip, budget: :category)
                        .order(triggered_at: :desc, id: :desc)

    render json: alerts.map { |alert| alert_json(alert) }
  end

  private

  def alert_json(alert)
    budget = alert.budget
    {
      id: alert.id,
      threshold_percentage: alert.threshold_percentage,
      triggered_at: alert.triggered_at,
      budget: {
        id: budget.id,
        period: budget.period,
        amount: budget.amount,
        category: { id: budget.category_id, name: budget.category.name }
      },
      financial_tip: alert.financial_tip && { id: alert.financial_tip.id, content: alert.financial_tip.content }
    }
  end
end
