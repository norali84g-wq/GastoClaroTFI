require "test_helper"

class PaymentMethodTest < ActiveSupport::TestCase
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
  end

  def medio(**attrs)
    PaymentMethod.new({ user: @user, name: "Visa" }.merge(attrs))
  end

  test "es valido con solo el nombre y el mantenimiento vale 0" do
    m = medio

    assert m.valid?
    assert_equal BigDecimal("0"), m.monthly_fee
  end

  test "el nombre es obligatorio" do
    m = medio(name: "")
    m.valid?

    assert m.errors.key?(:name)
  end

  test "el mantenimiento no puede ser negativo" do
    m = medio(monthly_fee: -1)
    m.valid?

    assert m.errors.key?(:monthly_fee)
  end

  test "al borrarlo, los gastos y las compras que lo usaban quedan sin medio de pago" do
    categoria = Category.create!(name: "Hogar")
    m = medio
    m.save!
    gasto = Expense.create!(user: @user, category: categoria, amount: 100, date: Date.current, payment_method: m)
    compra = InstallmentPurchase.create!(
      family_group: @familia, category: categoria, description: "Heladera", total_amount: 1200,
      installments_count: 3, first_period: "2026-11", payment_method: m
    )

    m.destroy!

    assert_nil gasto.reload.payment_method_id
    assert_nil compra.reload.payment_method_id
  end
end
