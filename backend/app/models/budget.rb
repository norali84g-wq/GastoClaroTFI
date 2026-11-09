# Tope de gasto de un usuario para una categoría en un mes (por ejemplo, Comida en 2026-11).
class Budget < ApplicationRecord
  # Porcentajes del presupuesto en los que se genera una alerta.
  ALERT_THRESHOLDS = [ 80, 100 ].freeze

  belongs_to :user
  belongs_to :category
  has_many :budget_alerts, dependent: :destroy

  validates :period, presence: true, format: { with: Period::FORMAT, message: Period::FORMAT_MESSAGE }
  validates :amount, numericality: { greater_than: 0 }
  validates :category_id, uniqueness: { scope: %i[user_id period], message: "ya tiene un presupuesto en ese mes" }

  # Las alertas se refieren a lo gastado en una categoría y un mes. Si cambia alguno de los dos, las
  # alertas viejas ya no valen: se borran para que los umbrales puedan volver a avisar.
  after_update :clear_alerts, if: -> { saved_change_to_category_id? || saved_change_to_period? }

  # Lo gastado en el mes en la categoría y en sus subcategorías. No se guarda: se calcula cada vez.
  def spent
    return 0.to_d unless Period.valid?(period) && category

    category_ids = [ category_id ] + category.descendant_ids
    user.expenses.where(category_id: category_ids, date: month_range).sum(:amount)
  end

  # `remaining` y `percentage` aceptan lo gastado ya calculado, para no consultarlo dos veces.
  def remaining(spent = self.spent)
    amount - spent
  end

  # Porcentaje del presupuesto ya gastado. Puede superar 100.
  def percentage(spent = self.spent)
    ((spent / amount) * 100).round
  end

  private

  def clear_alerts
    BudgetAlert.where(budget_id: id).delete_all
    budget_alerts.reset
  end

  def month_range
    start = Date.strptime(period, "%Y-%m")
    start..start.end_of_month
  end
end
