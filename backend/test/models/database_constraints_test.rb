require "test_helper"

# Comprueba que la base de datos rechaza por sí sola los datos inválidos (CHECK), sin pasar por las
# validaciones de Rails: se usan update_columns e insert_all, que se saltean los modelos.
class DatabaseConstraintsTest < ActiveSupport::TestCase
  setup do
    @family_group = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @family_group)
    @category = Category.create!(name: "Supermercado")
  end

  def assert_rejected_by_database(&block)
    assert_raises(ActiveRecord::StatementInvalid, &block)
  end

  test "la base rechaza un gasto con monto cero o negativo" do
    expense = Expense.create!(user: @user, category: @category, date: Date.current, amount: 100)

    assert_rejected_by_database { expense.update_columns(amount: 0) }
    assert_rejected_by_database { expense.update_columns(amount: -5) }
  end

  test "la base rechaza un ingreso con monto cero o negativo" do
    income = Income.create!(user: @user, amount: 100, date: Date.current)

    assert_rejected_by_database { income.update_columns(amount: 0) }
  end

  test "la base rechaza un item con cantidad cero o precio negativo" do
    expense = Expense.new(user: @user, category: @category, date: Date.current)
    expense.expense_items.build(name: "Leche", quantity: 1, unit_price: 100)
    expense.save!
    item = expense.expense_items.first

    assert_rejected_by_database { item.update_columns(quantity: 0) }
    assert_rejected_by_database { item.update_columns(unit_price: -1) }
  end

  test "la base rechaza una meta de ahorro con objetivo cero o ahorro negativo" do
    goal = SavingsGoal.create!(family_group: @family_group, name: "Viaje", target_amount: 1000)

    assert_rejected_by_database { goal.update_columns(target_amount: 0) }
    assert_rejected_by_database { goal.update_columns(saved_amount: -1) }
  end

  test "la base rechaza un medio de pago con mantenimiento negativo" do
    method = PaymentMethod.create!(user: @user, name: "Visa", monthly_fee: 0)

    assert_rejected_by_database { method.update_columns(monthly_fee: -10) }
  end

  test "la base rechaza un porcentaje de ahorro fuera de 0 a 100" do
    assert_rejected_by_database { @family_group.update_columns(savings_percentage: 101) }
    assert_rejected_by_database { @family_group.update_columns(savings_percentage: -1) }
  end

  test "la base sigue aceptando los valores válidos en el límite" do
    method = PaymentMethod.create!(user: @user, name: "Visa", monthly_fee: 0)
    method.update_columns(monthly_fee: 2500)
    @family_group.update_columns(savings_percentage: 100)

    assert_equal 2500, method.reload.monthly_fee
  end

  test "existen los indices de las consultas mas frecuentes" do
    connection = ActiveRecord::Base.connection

    assert connection.index_exists?(:expenses, %i[user_id date])
    assert connection.index_exists?(:incomes, %i[user_id date])
    assert connection.index_exists?(:expense_items, :name)
    assert connection.index_exists?(:shopping_list_items, %i[family_group_id period])
  end
end
