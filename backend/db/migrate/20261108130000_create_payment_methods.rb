class CreatePaymentMethods < ActiveRecord::Migration[8.1]
  def change
    create_table :payment_methods do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :nickname
      t.string :issuer
      t.string :last_four, limit: 4
      t.integer :closing_day
      t.integer :due_day
      # Costo de mantenimiento mensual del medio de pago (0 = no se suma).
      t.decimal :monthly_fee, precision: 10, scale: 2, default: 0, null: false

      t.timestamps
    end
  end
end
