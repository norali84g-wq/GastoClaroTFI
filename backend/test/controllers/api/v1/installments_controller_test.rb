require "test_helper"

class Api::V1::InstallmentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @categoria = Category.create!(name: "Electro")
    @compra = InstallmentPurchase.create!(
      family_group: @familia, category: @categoria, description: "Heladera",
      total_amount: 1200, installments_count: 4, first_period: "2026-11"
    )

    @otra_familia = FamilyGroup.create!(name: "Otra familia")
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @otra_familia)
    @compra_ajena = InstallmentPurchase.create!(
      family_group: @otra_familia, category: @categoria, description: "Lavarropas",
      total_amount: 600, installments_count: 2, first_period: "2026-11"
    )
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "sin token da 401" do
    get "/api/v1/installment_purchases/#{@compra.id}/installments"

    assert_response :unauthorized
  end

  test "index lista las cuotas en orden" do
    get "/api/v1/installment_purchases/#{@compra.id}/installments", headers: headers_for(@user)

    assert_response :ok
    body = response.parsed_body
    assert_equal [ 1, 2, 3, 4 ], body.map { |c| c["number"] }
    assert_equal %w[2026-11 2026-12 2027-01 2027-02], body.map { |c| c["period"] }
    assert_equal BigDecimal("300"), BigDecimal(body.first["amount"])
    assert_equal [ false ] * 4, body.map { |c| c["paid"] }
  end

  test "las compras anteriores sin cuotas guardadas las generan al listarlas" do
    @compra.installments.destroy_all

    get "/api/v1/installment_purchases/#{@compra.id}/installments", headers: headers_for(@user)

    assert_response :ok
    assert_equal 4, response.parsed_body.size
  end

  test "las cuotas de una compra de otro grupo dan 404" do
    get "/api/v1/installment_purchases/#{@compra_ajena.id}/installments", headers: headers_for(@user)

    assert_response :not_found
  end

  test "update marca una cuota como pagada y la puede desmarcar" do
    cuota = @compra.installments.first

    patch "/api/v1/installment_purchases/#{@compra.id}/installments/#{cuota.id}",
          params: { paid: true }, headers: headers_for(@user)

    assert_response :ok
    assert response.parsed_body["paid"]
    assert cuota.reload.paid

    patch "/api/v1/installment_purchases/#{@compra.id}/installments/#{cuota.id}",
          params: { paid: false }, headers: headers_for(@user)

    assert_not cuota.reload.paid
  end

  test "update con un valor que no es booleano da 422" do
    cuota = @compra.installments.first

    patch "/api/v1/installment_purchases/#{@compra.id}/installments/#{cuota.id}",
          params: { paid: "quizas" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "paid", response.parsed_body["errors"].first["field"]
    assert_not cuota.reload.paid
  end

  test "update sin paid da 422" do
    cuota = @compra.installments.first

    patch "/api/v1/installment_purchases/#{@compra.id}/installments/#{cuota.id}", headers: headers_for(@user)

    assert_response :unprocessable_entity
  end

  test "update de una cuota de otra compra da 404" do
    cuota_ajena = @compra_ajena.installments.first

    patch "/api/v1/installment_purchases/#{@compra.id}/installments/#{cuota_ajena.id}",
          params: { paid: true }, headers: headers_for(@user)

    assert_response :not_found
    assert_not cuota_ajena.reload.paid
  end
end
