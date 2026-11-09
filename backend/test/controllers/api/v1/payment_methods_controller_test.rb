require "test_helper"

class Api::V1::PaymentMethodsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @admin = User.create!(user: "jefa", password: "password123", family_group: @familia, admin: true)
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @familia)

    @visa = PaymentMethod.create!(user: @user, name: "Visa Galicia", monthly_fee: 3500)
    @ajeno = PaymentMethod.create!(user: @otro_user, name: "Mastercard")
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "sin token da 401" do
    get "/api/v1/payment_methods"

    assert_response :unauthorized
  end

  test "index lista solo los medios de pago del usuario" do
    get "/api/v1/payment_methods", headers: headers_for(@user)

    assert_response :ok
    assert_equal [ "Visa Galicia" ], response.parsed_body.map { |m| m["name"] }
    visa = response.parsed_body.first
    assert_equal BigDecimal("3500"), BigDecimal(visa["monthly_fee"])
    assert_equal @user.id, visa["user"]["id"]
  end

  test "el admin ve los de todos" do
    get "/api/v1/payment_methods", headers: headers_for(@admin)

    assert_equal [ "Mastercard", "Visa Galicia" ], response.parsed_body.map { |m| m["name"] }
  end

  test "create deja el medio de pago a nombre del usuario aunque se envie otro user_id" do
    assert_difference -> { @user.payment_methods.count }, 1 do
      post "/api/v1/payment_methods",
           params: { name: "Naranja", monthly_fee: 1200, user_id: @otro_user.id },
           headers: headers_for(@user)
    end

    assert_response :created
    assert_equal @user.id, response.parsed_body["user"]["id"]
    assert_equal BigDecimal("1200"), BigDecimal(response.parsed_body["monthly_fee"])
  end

  test "create sin nombre da 422" do
    post "/api/v1/payment_methods", params: { name: "" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "name", response.parsed_body["errors"].first["field"]
  end

  test "create con un mantenimiento negativo da 422" do
    post "/api/v1/payment_methods", params: { name: "Naranja", monthly_fee: -5 }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "monthly_fee", response.parsed_body["errors"].first["field"]
  end

  test "update modifica solo lo que se envia" do
    patch "/api/v1/payment_methods/#{@visa.id}", params: { monthly_fee: 4000 }, headers: headers_for(@user)

    assert_response :ok
    assert_equal BigDecimal("4000"), @visa.reload.monthly_fee
    assert_equal "Visa Galicia", @visa.name
  end

  test "update de un medio de pago ajeno da 404" do
    patch "/api/v1/payment_methods/#{@ajeno.id}", params: { name: "Hackeado" }, headers: headers_for(@user)

    assert_response :not_found
    assert_equal "Mastercard", @ajeno.reload.name
  end

  test "destroy borra el medio de pago" do
    assert_difference -> { PaymentMethod.count }, -1 do
      delete "/api/v1/payment_methods/#{@visa.id}", headers: headers_for(@user)
    end

    assert_response :no_content
  end

  test "destroy de un medio de pago ajeno da 404 y no lo borra" do
    assert_no_difference -> { PaymentMethod.count } do
      delete "/api/v1/payment_methods/#{@ajeno.id}", headers: headers_for(@user)
    end

    assert_response :not_found
  end
end
