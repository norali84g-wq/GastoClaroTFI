# Medio de pago de un usuario (por ejemplo, "Visa Galicia"). Solo se guarda el nombre y el costo de
# mantenimiento mensual, que se suma una sola vez por mes al total de las cuotas que se pagan con él.
# No se guardan datos de la tarjeta (número, vencimiento ni código).
class PaymentMethod < ApplicationRecord
  belongs_to :user
  has_many :expenses, dependent: :nullify
  has_many :installment_purchases, dependent: :nullify

  validates :name, presence: true
  validates :monthly_fee, numericality: { greater_than_or_equal_to: 0 }
  # Clave del ícono: solo minúsculas, números, guiones y guion bajo (el front la usa para elegir la imagen).
  validates :icon, format: { with: /\A[a-z0-9_-]{1,40}\z/ }, allow_blank: true
end
