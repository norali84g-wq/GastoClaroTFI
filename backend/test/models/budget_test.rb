require "test_helper"

class BudgetTest < ActiveSupport::TestCase
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @otro = User.create!(user: "otro", password: "password123", family_group: @familia)
    @comida = Category.create!(name: "Comida")
    @verduras = Category.create!(name: "Verduras", parent: @comida)
    @servicios = Category.create!(name: "Servicios")
    @budget = Budget.create!(user: @user, category: @comida, period: "2026-11", amount: 1000)
  end

  def gasto(monto, fecha:, categoria:, usuario: @user)
    Expense.create!(amount: monto, date: fecha, user: usuario, category: categoria)
  end

  test "es valido con usuario, categoria, mes y monto" do
    assert @budget.valid?
  end

  test "el monto tiene que ser mayor a cero" do
    @budget.amount = 0

    assert_not @budget.valid?
    assert @budget.errors.of_kind?(:amount, :greater_than)
  end

  test "el mes tiene que tener formato AAAA-MM" do
    @budget.period = "noviembre"

    assert_not @budget.valid?
    assert @budget.errors[:period].any?
  end

  test "no puede haber dos presupuestos del mismo usuario, categoria y mes" do
    repetido = Budget.new(user: @user, category: @comida, period: "2026-11", amount: 500)

    assert_not repetido.valid?
    assert repetido.errors[:category_id].any?
  end

  test "otro usuario si puede tener presupuesto de la misma categoria y mes" do
    assert Budget.new(user: @otro, category: @comida, period: "2026-11", amount: 500).valid?
  end

  test "la misma categoria puede tener presupuesto en otro mes" do
    assert Budget.new(user: @user, category: @comida, period: "2026-12", amount: 500).valid?
  end

  test "spent suma solo los gastos del usuario, de ese mes y de esa categoria" do
    gasto(300, fecha: Date.new(2026, 11, 5), categoria: @comida)
    gasto(200, fecha: Date.new(2026, 11, 20), categoria: @comida)
    gasto(999, fecha: Date.new(2026, 10, 30), categoria: @comida)
    gasto(999, fecha: Date.new(2026, 11, 5), categoria: @servicios)
    gasto(999, fecha: Date.new(2026, 11, 5), categoria: @comida, usuario: @otro)

    assert_equal BigDecimal("500"), @budget.spent
  end

  test "spent incluye los gastos de las subcategorias" do
    gasto(300, fecha: Date.new(2026, 11, 5), categoria: @comida)
    gasto(150, fecha: Date.new(2026, 11, 6), categoria: @verduras)

    assert_equal BigDecimal("450"), @budget.spent
  end

  test "remaining y percentage se calculan con lo gastado" do
    gasto(250, fecha: Date.new(2026, 11, 5), categoria: @comida)

    assert_equal BigDecimal("750"), @budget.remaining
    assert_equal 25, @budget.percentage
  end

  test "percentage puede superar 100 y remaining ser negativo" do
    gasto(1500, fecha: Date.new(2026, 11, 5), categoria: @comida)

    assert_equal 150, @budget.percentage
    assert_equal BigDecimal("-500"), @budget.remaining
  end

  test "al borrar el presupuesto se borran sus alertas" do
    gasto(900, fecha: Date.new(2026, 11, 5), categoria: @comida)
    assert_equal 1, @budget.budget_alerts.count

    assert_difference -> { BudgetAlert.count }, -1 do
      @budget.destroy!
    end
  end
end
