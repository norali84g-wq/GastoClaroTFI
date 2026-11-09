class CreateInstallments < ActiveRecord::Migration[8.1]
  def change
    create_table :installments do |t|
      t.references :installment_purchase, null: false, foreign_key: true
      t.integer :number, null: false
      t.string :period, null: false
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.boolean :paid, default: false, null: false

      t.timestamps
    end

    add_index :installments, %i[installment_purchase_id number], unique: true
  end
end
