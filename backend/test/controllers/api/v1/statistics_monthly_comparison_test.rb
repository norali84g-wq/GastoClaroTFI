require "test_helper"

class Api::V1::StatisticsMonthlyComparisonTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @comida = Category.create!(name: "Comida")

    @otra_familia = FamilyGroup.create!(name: "Otra familia")
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @otra_familia)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  def crear_gasto(fecha, items, user: @user, familia: @familia)
    total = items.sum { |_nombre, cantidad, precio| cantidad * precio }
    gasto = Expense.create!(amount: total, date: fecha, user: user, family_group: familia, category: @comida)
    items.each do |nombre, cantidad, precio|
      ExpenseItem.create!(expense: gasto, name: nombre, quantity: cantidad, unit_price: precio)
    end
    gasto
  end

  def comparar(params = { from: "2026-10", to: "2026-11" })
    get "/api/v1/statistics/monthly_comparison", params: params, headers: headers_for(@user)
  end

  test "sin token da 401" do
    get "/api/v1/statistics/monthly_comparison", params: { from: "2026-10", to: "2026-11" }

    assert_response :unauthorized
  end

  test "separa el efecto precio del efecto cantidad" do
    crear_gasto("2026-10-10", [ [ "Leche", 10, 1000 ] ])
    crear_gasto("2026-11-10", [ [ "Leche", 12, 1100 ] ])

    comparar

    assert_response :ok
    categoria = response.parsed_body["categories"].first
    assert_equal "Comida", categoria["category"]["name"]
    assert_equal BigDecimal("3200"), BigDecimal(categoria["difference"])
    assert_equal BigDecimal("2000"), BigDecimal(categoria["quantity_effect"])
    assert_equal BigDecimal("1200"), BigDecimal(categoria["price_effect"])

    leche = categoria["products"].first
    assert_equal "Leche", leche["name"]
    assert_equal "bought", leche["status"]
    assert_equal BigDecimal("2000"), BigDecimal(leche["quantity_effect"])
    assert_equal BigDecimal("1200"), BigDecimal(leche["price_effect"])
  end

  test "los dos efectos suman la diferencia del producto" do
    crear_gasto("2026-10-10", [ [ "Aceite", 3, 2500 ] ])
    crear_gasto("2026-11-10", [ [ "Aceite", 2, 3100 ] ])

    comparar

    aceite = response.parsed_body["categories"].first["products"].first
    suma = BigDecimal(aceite["price_effect"]) + BigDecimal(aceite["quantity_effect"])
    assert_equal BigDecimal(aceite["difference"]), suma
  end

  test "un producto nuevo cuenta todo como cantidad" do
    crear_gasto("2026-10-10", [ [ "Leche", 1, 1000 ] ])
    crear_gasto("2026-11-10", [ [ "Leche", 1, 1000 ], [ "Pan", 4, 500 ] ])

    comparar

    pan = response.parsed_body["categories"].first["products"].find { |p| p["name"] == "Pan" }
    assert_equal "new", pan["status"]
    assert_equal BigDecimal("2000"), BigDecimal(pan["quantity_effect"])
    assert_equal BigDecimal("0"), BigDecimal(pan["price_effect"])
  end

  test "un producto que se dejo de comprar resta todo como cantidad" do
    crear_gasto("2026-10-10", [ [ "Leche", 1, 1000 ], [ "Pan", 4, 500 ] ])
    crear_gasto("2026-11-10", [ [ "Leche", 1, 1000 ] ])

    comparar

    pan = response.parsed_body["categories"].first["products"].find { |p| p["name"] == "Pan" }
    assert_equal "stopped", pan["status"]
    assert_equal BigDecimal("-2000"), BigDecimal(pan["quantity_effect"])
  end

  test "empareja los productos sin importar mayusculas" do
    crear_gasto("2026-10-10", [ [ "leche", 10, 1000 ] ])
    crear_gasto("2026-11-10", [ [ "LECHE ", 10, 1000 ] ])

    comparar

    productos = response.parsed_body["categories"].first["products"]
    assert_equal 1, productos.size
    assert_equal BigDecimal("0"), BigDecimal(productos.first["difference"])
  end

  test "no cuenta los gastos de otra familia" do
    crear_gasto("2026-10-10", [ [ "Leche", 1, 1000 ] ])
    crear_gasto("2026-11-10", [ [ "Leche", 1, 1000 ] ])
    crear_gasto("2026-11-12", [ [ "Ajeno", 5, 9999 ] ], user: @otro_user, familia: @otra_familia)

    comparar

    assert_equal BigDecimal("1000"), BigDecimal(response.parsed_body["to_total"])
  end

  test "sin parametros compara el mes actual contra el anterior" do
    travel_to Date.new(2026, 11, 15) do
      comparar({})
    end

    assert_response :ok
    assert_equal "2026-10", response.parsed_body["from_period"]
    assert_equal "2026-11", response.parsed_body["to_period"]
  end

  test "con un mes sin gastos devuelve todo en cero" do
    comparar

    assert_response :ok
    assert_empty response.parsed_body["categories"]
    assert_equal BigDecimal("0"), BigDecimal(response.parsed_body["difference"])
  end

  test "con from mal formado da 422" do
    comparar({ from: "octubre", to: "2026-11" })

    assert_response :unprocessable_entity
    assert_equal "from", response.parsed_body["errors"].first["field"]
  end

  test "con to mal formado da 422" do
    comparar({ from: "2026-10", to: "13-2026" })

    assert_response :unprocessable_entity
    assert_equal "to", response.parsed_body["errors"].first["field"]
  end
end
