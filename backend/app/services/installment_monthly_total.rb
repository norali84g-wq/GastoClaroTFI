# Lo que hay que pagar en un mes por las compras en cuotas: las cuotas que vencen ese mes y el
# mantenimiento mensual de la tarjeta. El mantenimiento se suma una sola vez, y solo si ese mes
# vence al menos una cuota.
class InstallmentMonthlyTotal
  PERIOD_FORMAT = /\A\d{4}-(0[1-9]|1[0-2])\z/

  # `purchases` son las compras del grupo familiar del usuario.
  def initialize(period:, purchases:, card_monthly_fee:)
    @period = period
    @purchases = purchases
    @card_monthly_fee = card_monthly_fee
  end

  def as_json(*)
    due = @purchases.order(:id).to_a.select { |purchase| purchase.periodos.include?(@period) }
    installments_total = due.sum(0.to_d, &:monto_por_cuota)
    fee = due.any? ? @card_monthly_fee : 0.to_d

    {
      period: @period,
      installments: due.map { |purchase| installment_json(purchase) },
      installments_total: installments_total,
      card_monthly_fee: fee,
      total: installments_total + fee
    }
  end

  private

  def installment_json(purchase)
    { id: purchase.id, description: purchase.description, installment_amount: purchase.monto_por_cuota }
  end
end
