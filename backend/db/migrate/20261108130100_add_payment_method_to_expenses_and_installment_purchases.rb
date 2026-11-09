class AddPaymentMethodToExpensesAndInstallmentPurchases < ActiveRecord::Migration[8.1]
  def change
    add_reference :expenses, :payment_method, null: true, foreign_key: true
    add_reference :installment_purchases, :payment_method, null: true, foreign_key: true
  end
end
