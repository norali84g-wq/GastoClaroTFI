# Las compras en cuotas cargadas antes de que existiera la tabla installments no tienen sus cuotas
# guardadas: se generan acá, igual que si se hubieran creado ahora.
class GenerateInstallmentsForExistingPurchases < ActiveRecord::Migration[8.1]
  def up
    InstallmentPurchase.reset_column_information
    Installment.reset_column_information

    InstallmentPurchase.where.not(id: Installment.select(:installment_purchase_id))
                       .find_each(&:generate_installments)
  end

  # No hace falta borrar nada: si se deshace CreateInstallments, la tabla se borra con sus cuotas.
  def down; end
end
