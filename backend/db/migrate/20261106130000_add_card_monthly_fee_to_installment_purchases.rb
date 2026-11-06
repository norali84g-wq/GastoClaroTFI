class AddCardMonthlyFeeToInstallmentPurchases < ActiveRecord::Migration[8.1]
  def change
    # Costo de mantenimiento mensual de la tarjeta (opcional, 0 = no se suma).
    add_column :installment_purchases, :card_monthly_fee, :decimal, precision: 10, scale: 2, default: 0, null: false
  end
end
