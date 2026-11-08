# Cuotas de una compra en cuotas: se listan y se marcan como pagadas o no pagadas.
class Api::V1::InstallmentsController < Api::V1::BaseController
  before_action :set_installment_purchase

  def index
    # Las compras anteriores a esta función no tienen cuotas guardadas: se generan la primera vez.
    @installment_purchase.generate_installments if @installment_purchase.installments.none?

    render json: @installment_purchase.installments.reload.map { |installment| installment_json(installment) }
  end

  def update
    installment = @installment_purchase.installments.find(params[:id])
    paid = params[:paid]

    unless [ true, false, "true", "false" ].include?(paid)
      installment.errors.add(:paid, :invalid)
      return render_record_errors(installment)
    end

    installment.update!(paid: paid.to_s == "true")
    render json: installment_json(installment)
  end

  private

  # Solo se puede ver la compra de su grupo familiar, o cualquiera si es admin (si no, 404).
  def set_installment_purchase
    @installment_purchase = visible_installment_purchases.find(params[:installment_purchase_id])
  end

  def installment_json(installment)
    {
      id: installment.id,
      number: installment.number,
      period: installment.period,
      amount: installment.amount,
      paid: installment.paid
    }
  end
end
