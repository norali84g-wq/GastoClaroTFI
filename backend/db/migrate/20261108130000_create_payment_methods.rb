class CreatePaymentMethods < ActiveRecord::Migration[8.1]
  def change
    create_table :payment_methods do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      # Costo de mantenimiento mensual del medio de pago (0 = no se suma).
      t.decimal :monthly_fee, precision: 10, scale: 2, default: 0, null: false

      t.timestamps
    end
  end
end
