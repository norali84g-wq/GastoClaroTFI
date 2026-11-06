class AddInterestRateToInstallmentPurchases < ActiveRecord::Migration[8.1]
  def change
    # Tasa de interés total de la compra, en porcentaje (0 = sin interés).
    add_column :installment_purchases, :interest_rate, :decimal, precision: 5, scale: 2, default: 0, null: false
  end
end
