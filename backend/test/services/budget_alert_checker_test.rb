require "test_helper"

class BudgetAlertCheckerTest < ActiveSupport::TestCase
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @otro = User.create!(user: "otro", password: "password123", family_group: @familia)
    @comida = Category.create!(name: "Comida")
    @verduras = Category.create!(name: "Verduras", parent: @comida)
    @budget = Budget.create!(user: @user, category: @comida, period: "2026-11", amount: 1000)
  end

  def gasto(monto, fecha: Date.new(2026, 11, 10), categoria: @comida, usuario: @user)
    Expense.create!(amount: monto, date: fecha, user: usuario, category: categoria)
  end

  def umbrales
    @budget.budget_alerts.order(:threshold_percentage).pluck(:threshold_percentage)
  end

  test "un gasto que no llega al 80 por ciento no genera alerta" do
    gasto(790)

    assert_empty umbrales
  end

  test "un gasto que llega al 80 por ciento genera la alerta de 80" do
    gasto(800)

    assert_equal [ 80 ], umbrales
  end

  test "un gasto que llega al 100 por ciento genera las alertas de 80 y de 100" do
    gasto(1000)

    assert_equal [ 80, 100 ], umbrales
  end

  test "cada umbral avisa una sola vez" do
    gasto(800)
    gasto(100)
    gasto(50)

    assert_equal [ 80 ], umbrales
    gasto(100)
    gasto(100)

    assert_equal [ 80, 100 ], umbrales
  end

  test "editar un gasto tambien puede disparar la alerta" do
    expense = gasto(100)
    assert_empty umbrales

    expense.update!(amount: 900)

    assert_equal [ 80 ], umbrales
  end

  test "un gasto de una subcategoria cuenta para el presupuesto de la categoria padre" do
    gasto(850, categoria: @verduras)

    assert_equal [ 80 ], umbrales
  end

  test "un gasto de otro mes no dispara la alerta" do
    gasto(900, fecha: Date.new(2026, 10, 31))

    assert_empty umbrales
  end

  test "un gasto de otro usuario no dispara la alerta" do
    gasto(900, usuario: @otro)

    assert_empty umbrales
  end

  test "la alerta lleva un consejo financiero si hay alguno para alertas" do
    consejo = FinancialTip.create!(content: "Revisá tus gastos de la semana", show_with_alert: true)
    FinancialTip.create!(content: "No es para alertas", show_with_alert: false)

    gasto(850)

    assert_equal consejo, @budget.budget_alerts.first.financial_tip
  end

  test "sin consejos cargados la alerta se crea igual, sin consejo" do
    gasto(850)

    assert_nil @budget.budget_alerts.first.financial_tip
    assert @budget.budget_alerts.first.triggered_at.present?
  end

  test "al crear un presupuesto que ya esta superado se generan las alertas" do
    gasto(500, categoria: @verduras, fecha: Date.new(2026, 12, 3))
    nuevo = Budget.create!(user: @user, category: @comida, period: "2026-12", amount: 400)

    alertas = BudgetAlertChecker.for_budget(nuevo)

    assert_equal [ 80, 100 ], alertas.map(&:threshold_percentage).sort
  end
end
