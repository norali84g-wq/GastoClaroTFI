require "test_helper"

class Api::V1::InstallmentMonthlyTotalTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba", card_monthly_fee: 500)
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @categoria = Category.create!(name: "Hogar")

    # 1.200 en 4 cuotas sin interes: 300 por mes, de 2026-11 a 2027-02
    comprar(@familia, "Heladera", 1200, 4, "2026-11")
    # 600 en 3 cuotas con 10% de interes: 660 en total, 220 por mes, de 2026-10 a 2026-12
    comprar(@familia, "Notebook", 600, 3, "2026-10", interest_rate: 10)

    @otra_familia = FamilyGroup.create!(name: "Otra familia", card_monthly_fee: 9999)
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @otra_familia)
    comprar(@otra_familia, "Ajena", 5000, 1, "2026-11")
  end

  def comprar(familia, descripcion, total, cuotas, primer_mes, interest_rate: 0)
    InstallmentPurchase.create!(
      family_group: familia, category: @categoria, description: descripcion, total_amount: total,
      installments_count: cuotas, first_period: primer_mes, interest_rate: interest_rate
    )
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "monthly_total sin token da 401" do
    get "/api/v1/installment_purchases/monthly_total", params: { period: "2026-11" }

    assert_response :unauthorized
  end

  test "suma las cuotas del mes y el mantenimiento una sola vez" do
    get "/api/v1/installment_purchases/monthly_total", params: { period: "2026-11" }, headers: headers_for(@user)

    assert_response :ok
    body = response.parsed_body
    assert_equal %w[Heladera Notebook], body["installments"].map { |i| i["description"] }.sort
    assert_equal BigDecimal("520"), BigDecimal(body["installments_total"])
    assert_equal BigDecimal("500"), BigDecimal(body["card_monthly_fee"])
    assert_equal BigDecimal("1020"), BigDecimal(body["total"])
  end

  test "un mes con una sola cuota suma el mantenimiento igual, una vez" do
    get "/api/v1/installment_purchases/monthly_total", params: { period: "2026-10" }, headers: headers_for(@user)

    body = response.parsed_body
    assert_equal BigDecimal("220"), BigDecimal(body["installments_total"])
    assert_equal BigDecimal("720"), BigDecimal(body["total"])
  end

  test "un mes sin cuotas no suma mantenimiento" do
    get "/api/v1/installment_purchases/monthly_total", params: { period: "2027-05" }, headers: headers_for(@user)

    body = response.parsed_body
    assert_empty body["installments"]
    assert_equal BigDecimal("0"), BigDecimal(body["card_monthly_fee"])
    assert_equal BigDecimal("0"), BigDecimal(body["total"])
  end

  test "no cuenta las compras de otro grupo" do
    get "/api/v1/installment_purchases/monthly_total", params: { period: "2026-11" }, headers: headers_for(@user)

    assert_not_includes response.parsed_body["installments"].map { |i| i["description"] }, "Ajena"
  end

  test "con un periodo mal formado da 422" do
    get "/api/v1/installment_purchases/monthly_total", params: { period: "marzo" }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "period", response.parsed_body["errors"].first["field"]
  end

  test "la cuota de cada compra incluye el interes" do
    get "/api/v1/installment_purchases", headers: headers_for(@user)

    notebook = response.parsed_body.find { |p| p["description"] == "Notebook" }
    assert_equal BigDecimal("660"), BigDecimal(notebook["total_with_interest"])
    assert_equal BigDecimal("220"), BigDecimal(notebook["installment_amount"])
  end

  test "el mantenimiento se puede ver y editar" do
    get "/api/v1/installment_settings", headers: headers_for(@user)
    assert_response :ok
    assert_equal BigDecimal("500"), BigDecimal(response.parsed_body["card_monthly_fee"])

    patch "/api/v1/installment_settings", params: { card_monthly_fee: 3500 }, headers: headers_for(@user)

    assert_response :ok
    assert_equal BigDecimal("3500"), BigDecimal(response.parsed_body["card_monthly_fee"])
    assert_equal BigDecimal("3500"), @familia.reload.card_monthly_fee
  end

  test "un mantenimiento negativo da 422 y no se guarda" do
    patch "/api/v1/installment_settings", params: { card_monthly_fee: -1 }, headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal BigDecimal("500"), @familia.reload.card_monthly_fee
  end

  test "installment_settings sin token da 401" do
    get "/api/v1/installment_settings"

    assert_response :unauthorized
  end
end
