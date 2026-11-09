class Api::V1::BudgetsController < Api::V1::BaseController
  before_action :set_budget, only: %i[update destroy]

  def index
    if params[:period].present? && !Period.valid?(params[:period])
      return render_error(api_t("invalid_period"), status: :unprocessable_entity, field: "period")
    end

    budgets = visible_budgets.includes(:category, :user, budget_alerts: :financial_tip).order(period: :desc, id: :desc)
    budgets = budgets.where(period: params[:period]) if params[:period].present?

    render json: budgets.map { |budget| budget_json(budget) }
  end

  def create
    budget = current_user.budgets.new(budget_params)

    if budget.save
      BudgetAlertChecker.for_budget(budget)
      render json: budget_json(budget.reload), status: :created
    else
      render_record_errors(budget)
    end
  end

  def update
    if @budget.update(budget_params)
      BudgetAlertChecker.for_budget(@budget)
      render json: budget_json(@budget.reload)
    else
      render_record_errors(@budget)
    end
  end

  def destroy
    @budget.destroy!
    head :no_content
  end

  private

  # Solo se puede tocar un presupuesto visible para el usuario: el propio, o cualquiera si es admin.
  # Si no existe o es de otro usuario, find lanza RecordNotFound y la API responde 404.
  def set_budget
    @budget = visible_budgets.find(params[:id])
  end

  def budget_params
    params.permit(:category_id, :period, :amount)
  end

  # Lo gastado, lo que queda y el porcentaje no se guardan: se calculan cada vez.
  def budget_json(budget)
    spent = budget.spent
    {
      id: budget.id,
      period: budget.period,
      amount: budget.amount,
      spent: spent,
      remaining: budget.remaining(spent),
      percentage: budget.percentage(spent),
      user: { id: budget.user_id, user: budget.user.user },
      category: { id: budget.category_id, name: budget.category.name },
      alerts: budget.budget_alerts.sort_by(&:threshold_percentage).map { |alert| alert_json(alert) }
    }
  end

  def alert_json(alert)
    {
      id: alert.id,
      threshold_percentage: alert.threshold_percentage,
      triggered_at: alert.triggered_at,
      financial_tip: alert.financial_tip && { id: alert.financial_tip.id, content: alert.financial_tip.content }
    }
  end
end
