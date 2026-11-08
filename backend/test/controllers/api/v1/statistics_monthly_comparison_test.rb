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

  def crear_gasto(fecha, items, user: @user, familia: @familia, categoria: @comida)
    total = items.sum { |_nombre, cantidad, precio| cantidad * precio }
    gasto = Expense.create!(amount: total, date: fecha, user: user, family_group: familia, category: categoria)
    items.each do |nombre, cantidad, precio|
      ExpenseItem.create!(expense: gasto, name: nombre, quantity: cantidad, unit_price: precio)
    end
    gasto
  end

  def comparar(params = { from: "2026-10", to: "2026-11" }, user: @user)
    get "/api/v1/statistics/monthly_comparison", params: params, headers: headers_for(user)
  end

  # Gasto con importe a mano y sin detalle de productos.
  def crear_gasto_sin_detalle(fecha, importe)
    Expense.create!(amount: importe, date: fecha, user: @user, family_group: @familia, category: @comida)
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

  test "con from y to mal formados informa los dos" do
    comparar({ from: "octubre", to: "noviembre" })

    assert_response :unprocessable_entity
    assert_equal %w[from to], response.parsed_body["errors"].map { |e| e["field"] }
  end

  test "con to mal formado y sin from informa solo to" do
    comparar({ to: "noviembre" })

    assert_response :unprocessable_entity
    assert_equal %w[to], response.parsed_body["errors"].map { |e| e["field"] }
  end

  test "con el mismo mes en from y to da 422" do
    comparar({ from: "2026-11", to: "2026-11" })

    assert_response :unprocessable_entity
    assert_equal %w[to], response.parsed_body["errors"].map { |e| e["field"] }
  end

  test "con from posterior a to compara igual" do
    crear_gasto("2026-10-10", [ [ "Leche", 1, 1000 ] ])

    comparar({ from: "2026-11", to: "2026-10" })

    assert_response :ok
    assert_equal BigDecimal("1000"), BigDecimal(response.parsed_body["difference"])
  end

  test "percent_change es un numero" do
    crear_gasto("2026-10-10", [ [ "Leche", 10, 1000 ] ])
    crear_gasto("2026-11-10", [ [ "Leche", 12, 1100 ] ])

    comparar

    assert_in_delta 32.0, response.parsed_body["categories"].first["percent_change"]
  end

  test "con precios que no dan exacto los efectos suman la diferencia y los precios se redondean" do
    crear_gasto("2026-10-10", [ [ "Yerba", 3, 1000.01 ] ])
    crear_gasto("2026-11-03", [ [ "Yerba", 7, 1333.33 ] ])
    crear_gasto("2026-11-04", [ [ "Yerba", 2, 999.99 ] ])

    comparar

    yerba = response.parsed_body["categories"].first["products"].first
    assert_equal BigDecimal("8333.26"), BigDecimal(yerba["difference"])
    assert_equal BigDecimal("6000.06"), BigDecimal(yerba["quantity_effect"])
    assert_equal BigDecimal("2333.2"), BigDecimal(yerba["price_effect"])
    assert_equal BigDecimal("1259.25"), BigDecimal(yerba["to_unit_price"])
    assert_equal BigDecimal(yerba["difference"]),
                 BigDecimal(yerba["price_effect"]) + BigDecimal(yerba["quantity_effect"])
  end

  test "lo que viene de gastos sin detalle va en other_effect" do
    crear_gasto("2026-10-10", [ [ "Leche", 10, 1000 ] ])
    crear_gasto("2026-11-10", [ [ "Leche", 12, 1100 ] ])
    crear_gasto_sin_detalle("2026-10-15", 500)
    crear_gasto_sin_detalle("2026-11-15", 900)

    comparar

    categoria = response.parsed_body["categories"].first
    assert_equal BigDecimal("3600"), BigDecimal(categoria["difference"])
    assert_equal BigDecimal("1200"), BigDecimal(categoria["price_effect"])
    assert_equal BigDecimal("2000"), BigDecimal(categoria["quantity_effect"])
    assert_equal BigDecimal("400"), BigDecimal(categoria["other_effect"])
  end

  test "suma las subcategorias de cualquier nivel a la categoria raiz" do
    lacteos = Category.create!(name: "Lácteos", parent: @comida)
    quesos = Category.create!(name: "Quesos", parent: lacteos)
    crear_gasto("2026-10-10", [ [ "Leche", 10, 1000 ] ], categoria: lacteos)
    crear_gasto("2026-11-10", [ [ "Leche", 12, 1100 ] ])
    crear_gasto("2026-11-12", [ [ "Muzzarella", 1, 5000 ] ], categoria: quesos)

    comparar

    categorias = response.parsed_body["categories"]
    assert_equal %w[Comida], categorias.map { |c| c["category"]["name"] }
    assert_equal BigDecimal("8200"), BigDecimal(categorias.first["difference"])
    leche = categorias.first["products"].find { |p| p["name"] == "Leche" }
    assert_equal "bought", leche["status"]
  end

  test "con la misma diferencia ordena por nombre" do
    crear_gasto("2026-10-10", [ [ "Pan", 2, 1000 ] ])
    crear_gasto("2026-11-10", [ [ "Arroz", 4, 500 ] ])

    comparar

    assert_equal %w[Arroz Pan], response.parsed_body["categories"].first["products"].map { |p| p["name"] }
  end

  test "no cuenta los gastos de otro usuario de la misma familia" do
    hermana = User.create!(user: "hermana", password: "password123", family_group: @familia)
    crear_gasto("2026-11-10", [ [ "Leche", 1, 1000 ] ])
    crear_gasto("2026-11-11", [ [ "Leche", 1, 700 ] ], user: hermana)

    comparar

    assert_equal BigDecimal("1000"), BigDecimal(response.parsed_body["to_total"])
  end

  test "el admin ve los gastos de todos" do
    admin = User.create!(user: "jefa", password: "password123", family_group: @familia, admin: true)
    crear_gasto("2026-11-10", [ [ "Leche", 1, 1000 ] ])
    crear_gasto("2026-11-12", [ [ "Ajeno", 5, 100 ] ], user: @otro_user, familia: @otra_familia)

    comparar(user: admin)

    assert_equal BigDecimal("1500"), BigDecimal(response.parsed_body["to_total"])
  end
end
