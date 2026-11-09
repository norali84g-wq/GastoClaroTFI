require "test_helper"

class Api::V1::BudgetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @admin = User.create!(user: "jefa", password: "password123", family_group: @familia, admin: true)
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @familia)
    @comida = Category.create!(name: "Comida")
    @servicios = Category.create!(name: "Servicios")

    @presupuesto = Budget.create!(user: @user, category: @comida, period: "2026-11", amount: 1000)
    @otro_mes = Budget.create!(user: @user, category: @servicios, period: "2026-12", amount: 500)
    @ajeno = Budget.create!(user: @otro_user, category: @comida, period: "2026-11", amount: 700)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "index sin token da 401" do
    get "/api/v1/budgets"

    assert_response :unauthorized
  end

  test "index devuelve solo los presupuestos del usuario, con lo gastado y el porcentaje" do
    Expense.create!(amount: 250, date: Date.new(2026, 11, 5), user: @user, category: @comida)

    get "/api/v1/budgets", headers: headers_for(@user)

    assert_response :ok
    presupuestos = response.parsed_body
    assert_equal [ @otro_mes.id, @presupuesto.id ], presupuestos.map { |p| p["id"] }
    comida = presupuestos.last
    assert_equal "2026-11", comida["period"]
    assert_equal BigDecimal("1000"), BigDecimal(comida["amount"])
    assert_equal BigDecimal("250"), BigDecimal(comida["spent"])
    assert_equal BigDecimal("750"), BigDecimal(comida["remaining"])
    assert_equal 25, comida["percentage"]
    assert_equal({ "id" => @comida.id, "name" => "Comida" }, comida["category"])
    assert_equal [], comida["alerts"]
  end

  test "index filtra por periodo" do
    get "/api/v1/budgets", params: { period: "2026-12" }, headers: headers_for(@user)

    assert_response :ok
    assert_equal [ @otro_mes.id ], response.parsed_body.map { |p| p["id"] }
  end

  test "index con periodo mal formado da 422" do
    get "/api/v1/budgets", params: { period: "diciembre" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "period", response.parsed_body["errors"].first["field"]
  end

  test "index incluye las alertas generadas" do
    Expense.create!(amount: 900, date: Date.new(2026, 11, 5), user: @user, category: @comida)

    get "/api/v1/budgets", params: { period: "2026-11" }, headers: headers_for(@user)

    alertas = response.parsed_body.first["alerts"]
    assert_equal [ 80 ], alertas.map { |a| a["threshold_percentage"] }
  end

  test "el admin ve los presupuestos de todos" do
    get "/api/v1/budgets", headers: headers_for(@admin)

    assert_response :ok
    assert_equal 3, response.parsed_body.size
  end

  test "create crea el presupuesto para el usuario" do
    assert_difference -> { @user.budgets.count }, 1 do
      post "/api/v1/budgets",
           params: { category_id: @servicios.id, period: "2026-11", amount: 300 },
           headers: headers_for(@user)
    end

    assert_response :created
    assert_equal "2026-11", response.parsed_body["period"]
    assert_equal @user.id, response.parsed_body["user"]["id"]
  end

  test "create ignora el user_id que se mande" do
    post "/api/v1/budgets",
         params: { category_id: @servicios.id, period: "2026-11", amount: 300, user_id: @otro_user.id },
         headers: headers_for(@user)

    assert_response :created
    assert_equal @user.id, Budget.find(response.parsed_body["id"]).user_id
  end

  test "create con un presupuesto ya existente para ese mes da 422" do
    post "/api/v1/budgets",
         params: { category_id: @comida.id, period: "2026-11", amount: 300 },
         headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "category_id", response.parsed_body["errors"].first["field"]
  end

  test "create con monto cero da 422" do
    post "/api/v1/budgets",
         params: { category_id: @servicios.id, period: "2026-11", amount: 0 },
         headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "amount", response.parsed_body["errors"].first["field"]
  end

  test "create con categoria que no existe da 422" do
    post "/api/v1/budgets",
         params: { category_id: 999_999, period: "2026-11", amount: 300 },
         headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "category_id", response.parsed_body["errors"].first["field"]
  end

  test "create con mes mal formado da 422" do
    post "/api/v1/budgets",
         params: { category_id: @servicios.id, period: "11-2026", amount: 300 },
         headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "period", response.parsed_body["errors"].first["field"]
  end

  test "create genera la alerta si ya se gasto de mas en ese mes" do
    Expense.create!(amount: 450, date: Date.new(2026, 11, 8), user: @user, category: @servicios)

    post "/api/v1/budgets",
         params: { category_id: @servicios.id, period: "2026-11", amount: 500 },
         headers: headers_for(@user)

    assert_response :created
    assert_equal [ 80 ], response.parsed_body["alerts"].map { |a| a["threshold_percentage"] }
  end

  test "update cambia el monto" do
    patch "/api/v1/budgets/#{@presupuesto.id}", params: { amount: 1500 }, headers: headers_for(@user)

    assert_response :ok
    assert_equal BigDecimal("1500"), BigDecimal(response.parsed_body["amount"])
    assert_equal BigDecimal("1500"), @presupuesto.reload.amount
  end

  test "update con monto invalido da 422" do
    patch "/api/v1/budgets/#{@presupuesto.id}", params: { amount: -5 }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "amount", response.parsed_body["errors"].first["field"]
  end

  test "update del monto mantiene las alertas ya generadas" do
    Expense.create!(amount: 900, date: Date.new(2026, 11, 5), user: @user, category: @comida)

    patch "/api/v1/budgets/#{@presupuesto.id}", params: { amount: 5000 }, headers: headers_for(@user)

    assert_response :ok
    assert_equal [ 80 ], response.parsed_body["alerts"].map { |a| a["threshold_percentage"] }
  end

  test "update de la categoria borra las alertas que eran de la categoria anterior" do
    Expense.create!(amount: 900, date: Date.new(2026, 11, 5), user: @user, category: @comida)
    Expense.create!(amount: 100, date: Date.new(2026, 11, 5), user: @user, category: @servicios)
    assert_equal 1, @presupuesto.budget_alerts.count

    patch "/api/v1/budgets/#{@presupuesto.id}", params: { category_id: @servicios.id }, headers: headers_for(@user)

    assert_response :ok
    assert_equal 10, response.parsed_body["percentage"]
    assert_equal [], response.parsed_body["alerts"]
  end

  test "despues de cambiar la categoria el umbral vuelve a avisar" do
    Expense.create!(amount: 900, date: Date.new(2026, 11, 5), user: @user, category: @comida)
    patch "/api/v1/budgets/#{@presupuesto.id}", params: { category_id: @servicios.id }, headers: headers_for(@user)
    assert_empty @presupuesto.budget_alerts.reload

    Expense.create!(amount: 850, date: Date.new(2026, 11, 6), user: @user, category: @servicios)

    assert_equal [ 80 ], @presupuesto.budget_alerts.reload.map(&:threshold_percentage)
  end

  test "update del mes recalcula las alertas para el mes nuevo" do
    Expense.create!(amount: 900, date: Date.new(2026, 11, 5), user: @user, category: @comida)
    Expense.create!(amount: 1000, date: Date.new(2027, 1, 5), user: @user, category: @comida)

    patch "/api/v1/budgets/#{@presupuesto.id}", params: { period: "2027-01" }, headers: headers_for(@user)

    assert_response :ok
    assert_equal [ 80, 100 ], response.parsed_body["alerts"].map { |a| a["threshold_percentage"] }
  end

  test "update que falla por validacion no borra las alertas" do
    Expense.create!(amount: 900, date: Date.new(2026, 11, 5), user: @user, category: @comida)

    patch "/api/v1/budgets/#{@presupuesto.id}", params: { period: "2026-12", category_id: @servicios.id },
                                                headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal [ 80 ], @presupuesto.budget_alerts.reload.map(&:threshold_percentage)
  end

  test "el admin puede editar el presupuesto de otro usuario" do
    patch "/api/v1/budgets/#{@ajeno.id}", params: { amount: 900 }, headers: headers_for(@admin)

    assert_response :ok
    assert_equal BigDecimal("900"), @ajeno.reload.amount
    assert_equal @otro_user.id, @ajeno.user_id
  end

  test "update de un presupuesto de otro usuario da 404" do
    patch "/api/v1/budgets/#{@ajeno.id}", params: { amount: 1 }, headers: headers_for(@user)

    assert_response :not_found
    assert_equal BigDecimal("700"), @ajeno.reload.amount
  end

  test "destroy borra el presupuesto" do
    assert_difference -> { Budget.count }, -1 do
      delete "/api/v1/budgets/#{@presupuesto.id}", headers: headers_for(@user)
    end

    assert_response :no_content
  end

  test "el admin puede borrar el presupuesto de otro usuario" do
    assert_difference -> { Budget.count }, -1 do
      delete "/api/v1/budgets/#{@ajeno.id}", headers: headers_for(@admin)
    end

    assert_response :no_content
  end

  test "destroy de un presupuesto de otro usuario da 404" do
    assert_no_difference -> { Budget.count } do
      delete "/api/v1/budgets/#{@ajeno.id}", headers: headers_for(@user)
    end

    assert_response :not_found
  end
end
