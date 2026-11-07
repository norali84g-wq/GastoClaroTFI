class MoveCardMonthlyFeeToFamilyGroups < ActiveRecord::Migration[8.1]
  def change
    # El mantenimiento de la tarjeta se cobra una vez por mes, no por compra: pasa al grupo familiar.
    remove_column :installment_purchases, :card_monthly_fee, :decimal, precision: 10, scale: 2, default: 0, null: false
    add_column :family_groups, :card_monthly_fee, :decimal, precision: 10, scale: 2, default: 0, null: false
  end
end
