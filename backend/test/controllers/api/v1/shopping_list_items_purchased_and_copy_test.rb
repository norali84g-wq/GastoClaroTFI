require "test_helper"

class Api::V1::ShoppingListItemsPurchasedAndCopyTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @comida = Category.create!(name: "Comida")
    @arroz = ShoppingListItem.create!(family_group: @familia, category: @comida, name: "Arroz",
                                      period: "2026-11", quantity: 2, estimated_unit_price: 1500)
    @leche = ShoppingListItem.create!(family_group: @familia, category: @comida, name: "Leche",
                                      period: "2026-11", quantity: 3, estimated_unit_price: 1200,
                                      purchased: true)

    @otra_familia = FamilyGroup.create!(name: "Otra familia")
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @otra_familia)
    @ajeno = ShoppingListItem.create!(family_group: @otra_familia, category: @comida, name: "Ajeno",
                                      period: "2026-11", quantity: 1, estimated_unit_price: 100)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "un item nuevo se crea como no comprado" do
    post "/api/v1/shopping_list_items",
         params: { name: "Pan", period: "2026-11", quantity: 1, estimated_unit_price: 500, category_id: @comida.id },
         headers: headers_for(@user)

    assert_response :created
    assert_equal false, response.parsed_body["purchased"]
  end

  test "se puede marcar y desmarcar un item como comprado" do
    patch "/api/v1/shopping_list_items/#{@arroz.id}", params: { purchased: true }, headers: headers_for(@user)

    assert_response :ok
    assert_equal true, response.parsed_body["purchased"]
    assert @arroz.reload.purchased

    patch "/api/v1/shopping_list_items/#{@arroz.id}", params: { purchased: false }, headers: headers_for(@user)

    assert_response :ok
    assert_equal false, @arroz.reload.purchased
  end

  test "index con status=pending trae solo los no comprados" do
    get "/api/v1/shopping_list_items", params: { status: "pending" }, headers: headers_for(@user)

    assert_response :ok
    assert_equal %w[Arroz], response.parsed_body.map { |i| i["name"] }
  end

  test "index con status=purchased trae solo los comprados" do
    get "/api/v1/shopping_list_items", params: { status: "purchased" }, headers: headers_for(@user)

    assert_response :ok
    assert_equal %w[Leche], response.parsed_body.map { |i| i["name"] }
  end

  test "index sin status trae todos los del grupo" do
    get "/api/v1/shopping_list_items", headers: headers_for(@user)

    assert_response :ok
    assert_equal %w[Arroz Leche], response.parsed_body.map { |i| i["name"] }
  end

  test "copy sin token da 401" do
    post "/api/v1/shopping_list_items/copy", params: { from_period: "2026-11", to_period: "2026-12" }

    assert_response :unauthorized
  end

  test "copy pasa solo los pendientes al otro mes" do
    assert_difference -> { @familia.shopping_list_items.count }, 1 do
      post "/api/v1/shopping_list_items/copy",
           params: { from_period: "2026-11", to_period: "2026-12" }, headers: headers_for(@user)
    end

    assert_response :created
    copiados = response.parsed_body
    assert_equal %w[Arroz], copiados.map { |i| i["name"] }
    assert_equal "2026-12", copiados.first["period"]
    assert_equal false, copiados.first["purchased"]
    assert_equal BigDecimal("3000"), BigDecimal(copiados.first["subtotal"])
  end

  test "copy no duplica los items que ya estan en el mes destino" do
    ShoppingListItem.create!(family_group: @familia, category: @comida, name: "Arroz",
                             period: "2026-12", quantity: 1, estimated_unit_price: 1)

    assert_no_difference -> { ShoppingListItem.count } do
      post "/api/v1/shopping_list_items/copy",
           params: { from_period: "2026-11", to_period: "2026-12" }, headers: headers_for(@user)
    end

    assert_response :created
    assert_empty response.parsed_body
  end

  test "copy no toca los items de otra familia" do
    post "/api/v1/shopping_list_items/copy",
         params: { from_period: "2026-11", to_period: "2026-12" }, headers: headers_for(@user)

    assert_response :created
    assert_equal 0, @otra_familia.shopping_list_items.where(period: "2026-12").count
  end

  test "copy con periodo mal formado da 422" do
    post "/api/v1/shopping_list_items/copy",
         params: { from_period: "noviembre", to_period: "2026-12" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "from_period", response.parsed_body["errors"].first["field"]
  end

  test "copy sin periodos da 422" do
    post "/api/v1/shopping_list_items/copy", headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal %w[from_period to_period], response.parsed_body["errors"].map { |e| e["field"] }
  end

  test "copy con el mismo mes de origen y destino da 422" do
    post "/api/v1/shopping_list_items/copy",
         params: { from_period: "2026-11", to_period: "2026-11" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "to_period", response.parsed_body["errors"].first["field"]
  end

  test "copy con to_period mal formado da 422" do
    post "/api/v1/shopping_list_items/copy",
         params: { from_period: "2026-11", to_period: "2026-13" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal %w[to_period], response.parsed_body["errors"].map { |e| e["field"] }
  end

  test "marcar purchased vacio da 422 y no cambia el item" do
    patch "/api/v1/shopping_list_items/#{@leche.id}", params: { purchased: "" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "purchased", response.parsed_body["errors"].first["field"]
    assert @leche.reload.purchased
  end

  test "marcar purchased null en JSON da 422" do
    patch "/api/v1/shopping_list_items/#{@arroz.id}",
          params: { purchased: nil }.to_json,
          headers: headers_for(@user).merge("Content-Type" => "application/json")

    assert_response :unprocessable_entity
    assert_equal "purchased", response.parsed_body["errors"].first["field"]
  end

  test "crear con purchased vacio da 422" do
    assert_no_difference -> { ShoppingListItem.count } do
      post "/api/v1/shopping_list_items",
           params: { name: "Pan", period: "2026-11", estimated_unit_price: 500, category_id: @comida.id, purchased: "" },
           headers: headers_for(@user)
    end

    assert_response :unprocessable_entity
    assert_equal "purchased", response.parsed_body["errors"].first["field"]
  end

  test "index con status invalido da 422" do
    get "/api/v1/shopping_list_items", params: { status: "todos" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "status", response.parsed_body["errors"].first["field"]
  end

  test "index combina period y status" do
    ShoppingListItem.create!(family_group: @familia, category: @comida, name: "Fideos",
                             period: "2026-12", quantity: 1, estimated_unit_price: 800)

    get "/api/v1/shopping_list_items", params: { period: "2026-12", status: "pending" }, headers: headers_for(@user)

    assert_response :ok
    assert_equal %w[Fideos], response.parsed_body.map { |i| i["name"] }
  end

  test "copy conserva categoria, cantidad y precio" do
    post "/api/v1/shopping_list_items/copy",
         params: { from_period: "2026-11", to_period: "2026-12" }, headers: headers_for(@user)

    copia = @familia.shopping_list_items.find_by!(period: "2026-12", name: "Arroz")
    assert_equal @comida.id, copia.category_id
    assert_equal 2, copia.quantity
    assert_equal BigDecimal("1500"), copia.estimated_unit_price
    assert_not copia.purchased
    assert_equal "2026-11", @arroz.reload.period
  end

  test "copy saltea los que ya estan en destino aunque cambien mayusculas o espacios" do
    ShoppingListItem.create!(family_group: @familia, category: @comida, name: "  ARROZ ",
                             period: "2026-12", quantity: 1, estimated_unit_price: 1)

    assert_no_difference -> { ShoppingListItem.count } do
      post "/api/v1/shopping_list_items/copy",
           params: { from_period: "2026-11", to_period: "2026-12" }, headers: headers_for(@user)
    end

    assert_response :created
    assert_empty response.parsed_body
  end

  test "copy no duplica dos pendientes con el mismo nombre en el origen" do
    ShoppingListItem.create!(family_group: @familia, category: @comida, name: "arroz",
                             period: "2026-11", quantity: 5, estimated_unit_price: 1)

    assert_difference -> { @familia.shopping_list_items.where(period: "2026-12").count }, 1 do
      post "/api/v1/shopping_list_items/copy",
           params: { from_period: "2026-11", to_period: "2026-12" }, headers: headers_for(@user)
    end
  end

  test "el admin copia solo los items de su grupo" do
    admin = User.create!(user: "jefa", password: "password123", family_group: @familia, admin: true)

    post "/api/v1/shopping_list_items/copy",
         params: { from_period: "2026-11", to_period: "2026-12" }, headers: headers_for(admin)

    assert_response :created
    assert_equal %w[Arroz], response.parsed_body.map { |i| i["name"] }
    assert_equal 0, @otra_familia.shopping_list_items.where(period: "2026-12").count
  end
end
