require "test_helper"
require Rails.root.join("db/migrate/20261108130300_generate_installments_for_existing_purchases")

class GenerateInstallmentsForExistingPurchasesTest < ActiveSupport::TestCase
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @categoria = Category.create!(name: "Electro")
  end

  def compra(descripcion, cuotas)
    InstallmentPurchase.create!(
      family_group: @familia, category: @categoria, description: descripcion,
      total_amount: 1200, installments_count: cuotas, first_period: "2026-11"
    )
  end

  test "genera las cuotas de las compras que no las tienen y no toca las demas" do
    vieja = compra("Heladera", 4)
    vieja.installments.delete_all
    nueva = compra("Lavarropas", 2)
    nueva.installments.first.update!(paid: true)

    GenerateInstallmentsForExistingPurchases.new.up

    assert_equal [ 1, 2, 3, 4 ], vieja.installments.reload.map(&:number)
    assert_equal [ true, false ], nueva.installments.reload.map(&:paid)
  end
end
