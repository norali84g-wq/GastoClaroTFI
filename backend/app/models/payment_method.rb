# Medio de pago de un usuario (por ejemplo, una tarjeta de crédito). Puede tener un costo de
# mantenimiento mensual, que se suma una sola vez por mes al total de las cuotas que se pagan con él.
class PaymentMethod < ApplicationRecord
  belongs_to :user
  has_many :expenses, dependent: :nullify
  has_many :installment_purchases, dependent: :nullify

  normalizes :last_four, with: ->(value) { value.to_s.strip.presence }

  validates :name, presence: true
  validates :last_four, format: { with: /\A\d{4}\z/, message: "deben ser 4 dígitos" }, allow_nil: true
  validates :closing_day, :due_day, allow_nil: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 31 }
  validates :monthly_fee, numericality: { greater_than_or_equal_to: 0 }
end
