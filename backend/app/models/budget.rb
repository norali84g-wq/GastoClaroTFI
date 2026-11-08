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

  # Lo gastado en el mes en la categoría y en sus subcategorías. No se guarda: se calcula cada vez.
  def spent
    return 0.to_d unless Period.valid?(period) && category

    category_ids = [ category_id ] + category.descendant_ids
    user.expenses.where(category_id: category_ids, date: month_range).sum(:amount)
  end

  def remaining
    amount - spent
  end

  # Porcentaje del presupuesto ya gastado. Puede superar 100.
  def percentage
    ((spent / amount) * 100).round
  end

  private

  def month_range
    start = Date.strptime(period, "%Y-%m")
    start..start.end_of_month
  end
end
