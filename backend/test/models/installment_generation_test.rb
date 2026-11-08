require "test_helper"

class InstallmentGenerationTest < ActiveSupport::TestCase
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @categoria = Category.create!(name: "Electro")
  end

  def compra(**attrs)
    InstallmentPurchase.create!(
      { family_group: @familia, category: @categoria, description: "Heladera", total_amount: 1200,
        installments_count: 4, first_period: "2026-11" }.merge(attrs)
    )
  end

  test "al crear la compra se genera una cuota por mes" do
    c = compra

    assert_equal [ 1, 2, 3, 4 ], c.installments.map(&:number)
    assert_equal %w[2026-11 2026-12 2027-01 2027-02], c.installments.map(&:period)
    assert_equal [ BigDecimal("300") ] * 4, c.installments.map(&:amount)
    assert c.installments.none?(&:paid)
  end

  test "con interes las cuotas lo incluyen" do
    c = compra(total_amount: 1000, interest_rate: 10)

    assert_equal [ BigDecimal("275") ] * 4, c.installments.map(&:amount)
  end

  test "al cambiar la cantidad de cuotas se generan de nuevo" do
    c = compra

    c.update!(installments_count: 2)

    assert_equal 2, c.installments.reload.count
    assert_equal [ BigDecimal("600") ] * 2, c.installments.map(&:amount)
  end

  test "al generarlas de nuevo se conservan las que ya estaban pagadas" do
    c = compra
    c.installments.find_by(number: 1).update!(paid: true)

    c.update!(installments_count: 5)

    assert_equal [ true, false, false, false, false ], c.installments.reload.map(&:paid)
  end

  test "editar solo la descripcion no toca las cuotas" do
    c = compra
    ids = c.installments.map(&:id)

    c.update!(description: "Heladera nueva")

    assert_equal ids, c.installments.reload.map(&:id)
  end

  test "al borrar la compra se borran sus cuotas" do
    c = compra

    assert_difference "Installment.count", -4 do
      c.destroy!
    end
  end
end
