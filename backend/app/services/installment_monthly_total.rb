# Lo que hay que pagar en un mes por las compras en cuotas: las cuotas que vencen ese mes y el
# mantenimiento mensual. Cada medio de pago con cuotas ese mes suma su mantenimiento una sola vez;
# las compras sin medio de pago usan el mantenimiento del grupo, también una sola vez. Si ese mes
# no vence ninguna cuota, no se suma mantenimiento.
class InstallmentMonthlyTotal
  # `purchases` son las compras del grupo familiar del usuario.
  def initialize(period:, purchases:, card_monthly_fee:)
    @period = period
    @purchases = purchases
    @card_monthly_fee = card_monthly_fee
  end

  def as_json(*)
    due = @purchases.includes(:payment_method).order(:id).to_a.select { |purchase| purchase.periodos.include?(@period) }
    installments_total = due.sum(0.to_d) { |purchase| purchase.monto_cuota_en(@period) }
    fee = monthly_fee(due)

    {
      period: @period,
      installments: due.map { |purchase| installment_json(purchase) },
      installments_total: installments_total,
      card_monthly_fee: fee,
      total: installments_total + fee
    }
  end

  private

  def monthly_fee(due)
    own = due.filter_map(&:payment_method).uniq.sum(0.to_d, &:monthly_fee)
    group = due.any? { |purchase| purchase.payment_method_id.nil? } ? @card_monthly_fee : 0.to_d
    own + group
  end

  def installment_json(purchase)
    { id: purchase.id, description: purchase.description, installment_amount: purchase.monto_cuota_en(@period) }
  end
end
