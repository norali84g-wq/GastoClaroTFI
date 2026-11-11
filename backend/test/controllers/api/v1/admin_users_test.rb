require "test_helper"

class Api::V1::AdminUsersTest < ActionDispatch::IntegrationTest
  setup do
    grupo = FamilyGroup.create!(name: "Grupo de prueba")
    @admin = User.create!(user: "jefa", password: "password123", family_group: grupo, admin: true)
    @comun = User.create!(user: "comun", email: "comun@example.com", password: "password123",
                          family_group: grupo, dni: "12345678", birth_date: "1990-01-01")
    @categoria = Category.create!(name: "Comida")
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "la lista del admin trae datos de cuenta y de uso, sin DNI ni fecha de nacimiento" do
    Expense.create!(user: @comun, family_group: @comun.family_group, category: @categoria, date: Date.new(2026, 11, 1), amount: 500)
    SupportMessage.create!(user: @comun, subject: "Ayuda", message: "No anda algo")

    get "/api/v1/users", headers: headers_for(@admin)

    assert_response :ok
    comun = response.parsed_body.find { |u| u["user"] == "comun" }
    assert_equal 1, comun["expenses_count"]
    assert_equal "2026-11-01", comun["last_expense_on"]
    assert_equal 1, comun["support_messages_count"]
    assert_equal 1, comun["pending_support_messages_count"]
    assert_equal true, comun["active"]
    %w[dni birth_date password_digest].each { |campo| assert_not comun.key?(campo), "no debería incluir #{campo}" }
  end

  test "el admin desactiva y reactiva un usuario sin borrar sus datos" do
    Income.create!(user: @comun, amount: 100, date: Date.current)

    patch "/api/v1/users/#{@comun.id}", params: { active: false }, headers: headers_for(@admin)
    assert_response :ok
    assert_equal false, response.parsed_body["active"]
    assert_equal 1, @comun.incomes.count

    patch "/api/v1/users/#{@comun.id}", params: { active: true }, headers: headers_for(@admin)
    assert_equal true, response.parsed_body["active"]
  end

  test "un usuario desactivado no puede entrar ni usar un token que ya tenía" do
    token = AuthToken.encode(@comun)
    @comun.update!(active: false)

    post "/api/v1/login", params: { user: "comun", password: "password123" }
    assert_response :forbidden

    get "/api/v1/me", headers: { "Authorization" => "Bearer #{token}" }
    assert_response :unauthorized
  end

  test "el admin no puede desactivar su propia cuenta" do
    patch "/api/v1/users/#{@admin.id}", params: { active: false }, headers: headers_for(@admin)

    assert_response :unprocessable_entity
    assert @admin.reload.active?
  end

  test "un usuario común no puede desactivar cuentas" do
    patch "/api/v1/users/#{@admin.id}", params: { active: false }, headers: headers_for(@comun)

    assert_response :forbidden
  end

  test "id inexistente da 404" do
    patch "/api/v1/users/0", params: { active: false }, headers: headers_for(@admin)

    assert_response :not_found
  end

  test "el admin desactiva una categoría: se conserva pero no admite gastos nuevos" do
    gasto = Expense.create!(user: @comun, family_group: @comun.family_group, category: @categoria, date: Date.current, amount: 10)

    patch "/api/v1/categories/#{@categoria.id}", params: { active: false }, headers: headers_for(@admin)
    assert_response :ok
    assert_equal false, response.parsed_body["active"]
    assert Expense.exists?(gasto.id)

    post "/api/v1/expenses", params: { category_id: @categoria.id, date: Date.current, amount: 20 }, headers: headers_for(@comun)
    assert_response :unprocessable_entity
    assert_equal "category", response.parsed_body["errors"].first["field"].sub("_id", "")
  end

  test "un usuario común no puede desactivar categorías" do
    patch "/api/v1/categories/#{@categoria.id}", params: { active: false }, headers: headers_for(@comun)

    assert_response :forbidden
  end
end
