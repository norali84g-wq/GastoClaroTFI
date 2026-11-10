# Reglas de datos que hasta ahora solo controlaba Rails, ahora también las controla la base (CHECK),
# y los índices de lo que más se consulta. Cada CHECK repite una validación del modelo, así que la
# base rechaza un dato inválido aunque entre por fuera de Rails (un script, otra app, un INSERT a mano).
class AddCheckConstraintsAndIndexes < ActiveRecord::Migration[8.1]
  CHECKS = {
    expenses: { "amount > 0" => "chk_expenses_amount_positive" },
    incomes: { "amount > 0" => "chk_incomes_amount_positive" },
    budgets: { "amount > 0" => "chk_budgets_amount_positive" },
    expense_items: {
      "quantity > 0" => "chk_expense_items_quantity_positive",
      "unit_price >= 0" => "chk_expense_items_unit_price_not_negative"
    },
    installment_purchases: {
      "total_amount > 0" => "chk_installment_purchases_total_positive",
      "installments_count > 0" => "chk_installment_purchases_count_positive",
      "interest_rate >= 0 AND interest_rate <= 100" => "chk_installment_purchases_interest_range"
    },
    installments: { "amount >= 0" => "chk_installments_amount_not_negative" },
    payment_methods: { "monthly_fee >= 0" => "chk_payment_methods_fee_not_negative" },
    savings_goals: {
      "target_amount > 0" => "chk_savings_goals_target_positive",
      "saved_amount >= 0" => "chk_savings_goals_saved_not_negative"
    },
    shopping_list_items: {
      "estimated_unit_price >= 0" => "chk_shopping_list_items_price_not_negative",
      "quantity IS NULL OR quantity > 0" => "chk_shopping_list_items_quantity_positive"
    },
    family_groups: {
      "savings_percentage >= 0 AND savings_percentage <= 100" => "chk_family_groups_savings_range",
      "card_monthly_fee >= 0" => "chk_family_groups_fee_not_negative"
    }
  }.freeze

  # Los gastos y los ingresos se listan por usuario y fecha; los ítems se agrupan por nombre en la
  # comparación mensual; la lista de compras se pide por grupo y período.
  INDEXES = [
    [ :expenses, %i[user_id date], "index_expenses_on_user_id_and_date" ],
    [ :incomes, %i[user_id date], "index_incomes_on_user_id_and_date" ],
    [ :expense_items, %i[name], "index_expense_items_on_name" ],
    [ :shopping_list_items, %i[family_group_id period], "index_shopping_list_items_on_group_and_period" ]
  ].freeze

  def change
    CHECKS.each do |table, rules|
      rules.each { |expression, name| add_check_constraint table, expression, name: name }
    end

    INDEXES.each { |table, columns, name| add_index table, columns, name: name }
  end
end
