require "test_helper"

class Api::V1::BudgetAlertsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @familia)
    @comida = Category.create!(name: "Comida")
    @servicios = Category.create!(name: "Servicios")
    @consejo = FinancialTip.create!(content: "Planificá las compras de la semana")

    Budget.create!(user: @user, category: @comida, period: "2026-11", amount: 1000)
    Budget.create!(user: @user, category: @servicios, period: "2026-12", amount: 1000)
    Budget.create!(user: @otro_user, category: @comida, period: "2026-11", amount: 1000)
    Expense.create!(amount: 900, date: Date.new(2026, 11, 5), user: @user, category: @comida)
    Expense.create!(amount: 1000, date: Date.new(2026, 12, 5), user: @user, category: @servicios)
    Expense.create!(amount: 1000, date: Date.new(2026, 11, 5), user: @otro_user, category: @comida)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "index sin token da 401" do
    get "/api/v1/budget_alerts"

    assert_response :unauthorized
  end

  test "index devuelve solo las alertas de los presupuestos del usuario" do
    get "/api/v1/budget_alerts", headers: headers_for(@user)

    assert_response :ok
    alertas = response.parsed_body
    assert_equal 3, alertas.size
    assert alertas.all? { |a| %w[2026-11 2026-12].include?(a["budget"]["period"]) }
    assert_equal [ "Comida", "Servicios" ].sort, alertas.map { |a| a["budget"]["category"]["name"] }.uniq.sort
  end

  test "index filtra por periodo" do
    get "/api/v1/budget_alerts", params: { period: "2026-11" }, headers: headers_for(@user)

    assert_response :ok
    alertas = response.parsed_body
    assert_equal [ 80 ], alertas.map { |a| a["threshold_percentage"] }
    assert_equal "Comida", alertas.first["budget"]["category"]["name"]
  end

  test "la alerta trae el consejo financiero" do
    Budget.create!(user: @user, category: @comida, period: "2027-01", amount: 100)
    Expense.create!(amount: 90, date: Date.new(2027, 1, 3), user: @user, category: @comida)

    get "/api/v1/budget_alerts", params: { period: "2027-01" }, headers: headers_for(@user)

    assert_equal({ "id" => @consejo.id, "content" => "Planificá las compras de la semana" },
                 response.parsed_body.first["financial_tip"])
  end

  test "index con periodo mal formado da 422" do
    get "/api/v1/budget_alerts", params: { period: "enero" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "period", response.parsed_body["errors"].first["field"]
  end
end
