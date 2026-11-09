# Una cuota de una compra en cuotas: su número, el mes en que se paga, el monto y si ya se pagó.
# Las crea la compra (ver InstallmentPurchase#generate_installments).
class Installment < ApplicationRecord
  belongs_to :installment_purchase

  validates :number, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :period, format: { with: Period::FORMAT, message: Period::FORMAT_MESSAGE }
  validates :amount, numericality: { greater_than_or_equal_to: 0 }
end
