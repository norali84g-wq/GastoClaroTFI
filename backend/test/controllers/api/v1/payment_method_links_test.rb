require "test_helper"

# Gastos y compras en cuotas con medio de pago, y el total mensual con el mantenimiento de cada uno.
class Api::V1::PaymentMethodLinksTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba", card_monthly_fee: 500)
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @familia)
    @categoria = Category.create!(name: "Hogar")
    @visa = PaymentMethod.create!(user: @user, name: "Visa", monthly_fee: 3500)
    @master = PaymentMethod.create!(user: @user, name: "Mastercard", monthly_fee: 1000)
    @ajeno = PaymentMethod.create!(user: @otro_user, name: "Naranja", monthly_fee: 99)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  def comprar(descripcion, total, cuotas, medio: nil)
    InstallmentPurchase.create!(
      family_group: @familia, category: @categoria, description: descripcion, total_amount: total,
      installments_count: cuotas, first_period: "2026-11", payment_method: medio
    )
  end

  def total_de(periodo)
    get "/api/v1/installment_purchases/monthly_total", params: { period: periodo }, headers: headers_for(@user)
    assert_response :ok
    response.parsed_body
  end

  # --- gastos ---

  test "un gasto se puede cargar con un medio de pago propio" do
    post "/api/v1/expenses",
         params: { amount: 100, date: "2026-11-05", category_id: @categoria.id, payment_method_id: @visa.id },
         headers: headers_for(@user)

    assert_response :created
    assert_equal @visa.id, response.parsed_body["payment_method_id"]
  end

  test "un gasto sin medio de pago lo devuelve en null" do
    post "/api/v1/expenses",
         params: { amount: 100, date: "2026-11-05", category_id: @categoria.id }, headers: headers_for(@user)

    assert_response :created
    assert_nil response.parsed_body["payment_method_id"]
  end

  test "un gasto con el medio de pago de otro usuario da 422" do
    assert_no_difference -> { Expense.count } do
      post "/api/v1/expenses",
           params: { amount: 100, date: "2026-11-05", category_id: @categoria.id, payment_method_id: @ajeno.id },
           headers: headers_for(@user)
    end

    assert_response :unprocessable_entity
    error = response.parsed_body["errors"].first
    assert_equal "payment_method_id", error["field"]
    assert_equal "no existe", error["message"]
  end

  test "un gasto se puede editar para cambiarle el medio de pago" do
    gasto = Expense.create!(user: @user, category: @categoria, amount: 100, date: Date.current)

    patch "/api/v1/expenses/#{gasto.id}", params: { payment_method_id: @master.id }, headers: headers_for(@user)

    assert_response :ok
    assert_equal @master.id, gasto.reload.payment_method_id
  end

  # --- compras en cuotas ---

  test "una compra en cuotas se puede cargar con un medio de pago propio" do
    post "/api/v1/installment_purchases",
         params: { description: "Televisor", total_amount: 900, installments_count: 3, first_period: "2026-11",
                   category_id: @categoria.id, payment_method_id: @visa.id },
         headers: headers_for(@user)

    assert_response :created
    assert_equal @visa.id, response.parsed_body["payment_method_id"]
  end

  test "una compra en cuotas con el medio de pago de otro usuario da 422" do
    post "/api/v1/installment_purchases",
         params: { description: "Televisor", total_amount: 900, installments_count: 3, first_period: "2026-11",
                   category_id: @categoria.id, payment_method_id: @ajeno.id },
         headers: headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal "payment_method_id", response.parsed_body["errors"].first["field"]
  end

  test "otro integrante del grupo puede editar una compra sin cambiarle el medio de pago" do
    compra = comprar("Heladera", 1200, 4, medio: @visa)

    patch "/api/v1/installment_purchases/#{compra.id}",
          params: { description: "Heladera no frost", payment_method_id: @visa.id }, headers: headers_for(@otro_user)

    assert_response :ok
    assert_equal "Heladera no frost", compra.reload.description
    assert_equal @visa.id, compra.payment_method_id
  end

  test "otro integrante del grupo no puede pasar la compra a una tarjeta que no es suya" do
    compra = comprar("Heladera", 1200, 4, medio: @visa)

    patch "/api/v1/installment_purchases/#{compra.id}",
          params: { payment_method_id: @master.id }, headers: headers_for(@otro_user)

    assert_response :unprocessable_entity
    assert_equal "payment_method_id", response.parsed_body["errors"].first["field"]
    assert_equal @visa.id, compra.reload.payment_method_id
  end

  test "otro integrante del grupo puede pasar la compra a su propia tarjeta" do
    compra = comprar("Heladera", 1200, 4, medio: @visa)

    patch "/api/v1/installment_purchases/#{compra.id}",
          params: { payment_method_id: @ajeno.id }, headers: headers_for(@otro_user)

    assert_response :ok
    assert_equal @ajeno.id, compra.reload.payment_method_id
  end

  # --- total mensual ---

  test "en el ultimo mes el total usa la ultima cuota, con la diferencia del redondeo" do
    comprar("Microondas", 1000, 3, medio: @visa)   # 333.33, 333.33 y 333.34

    assert_equal BigDecimal("333.33"), BigDecimal(total_de("2026-11")["installments_total"])
    ultimo = total_de("2027-01")
    assert_equal BigDecimal("333.34"), BigDecimal(ultimo["installments_total"])
    assert_equal BigDecimal("333.34"), BigDecimal(ultimo["installments"].first["installment_amount"])
  end

  test "cada medio de pago suma su mantenimiento una sola vez aunque tenga varias compras" do
    comprar("Heladera", 1200, 4, medio: @visa)   # 300 por mes
    comprar("Notebook", 600, 3, medio: @visa)    # 200 por mes
    comprar("Celular", 400, 2, medio: @master)   # 200 por mes

    body = total_de("2026-11")

    assert_equal BigDecimal("700"), BigDecimal(body["installments_total"])
    assert_equal BigDecimal("4500"), BigDecimal(body["card_monthly_fee"])
    assert_equal BigDecimal("5200"), BigDecimal(body["total"])
  end

  test "las compras sin medio de pago usan el mantenimiento del grupo una sola vez" do
    comprar("Heladera", 1200, 4, medio: @visa)   # 300 por mes
    comprar("Sillon", 100, 1)                    # 100, sin medio de pago
    comprar("Mesa", 200, 1)                      # 200, sin medio de pago

    body = total_de("2026-11")

    assert_equal BigDecimal("600"), BigDecimal(body["installments_total"])
    assert_equal BigDecimal("4000"), BigDecimal(body["card_monthly_fee"])
    assert_equal BigDecimal("4600"), BigDecimal(body["total"])
  end

  test "un medio de pago sin cuotas ese mes no suma su mantenimiento" do
    comprar("Heladera", 1200, 4, medio: @visa)   # de 2026-11 a 2027-02
    comprar("Celular", 400, 2, medio: @master)   # de 2026-11 a 2026-12

    body = total_de("2027-02")

    assert_equal BigDecimal("300"), BigDecimal(body["installments_total"])
    assert_equal BigDecimal("3500"), BigDecimal(body["card_monthly_fee"])
  end
end
