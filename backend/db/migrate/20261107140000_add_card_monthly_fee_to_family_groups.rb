class AddCardMonthlyFeeToFamilyGroups < ActiveRecord::Migration[8.1]
  def change
    # Mantenimiento mensual de la tarjeta (0 = no se suma). Es del grupo familiar y no de cada compra,
    # porque se cobra una vez por mes.
    add_column :family_groups, :card_monthly_fee, :decimal, precision: 10, scale: 2, default: 0, null: false
  end
end
