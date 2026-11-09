# Aviso de que un presupuesto llegó a un porcentaje (80 % o 100 %). Se genera una sola vez por umbral.
class BudgetAlert < ApplicationRecord
  belongs_to :budget
  belongs_to :financial_tip, optional: true

  validates :threshold_percentage, inclusion: { in: Budget::ALERT_THRESHOLDS }
  validates :triggered_at, presence: true
end
