class InstallmentPurchase < ApplicationRecord
  belongs_to :family_group
  belongs_to :category
  belongs_to :vendor, optional: true
  belongs_to :payment_method, optional: true
  has_many :installments, -> { order(:number) }, dependent: :destroy

  validates :description, presence: true
  validates :total_amount, numericality: { greater_than: 0 }
  validates :installments_count,
            numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 48 }
  validates :interest_rate, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :first_period, presence: true, format: { with: Period::FORMAT, message: Period::FORMAT_MESSAGE }

  after_save :generate_installments, if: :installments_changed?

  # Total de la compra con el interés sumado. `interest_rate` es la tasa total de la compra en %
  # (10 = 10% más sobre el total), no una tasa mensual.
  def total_con_interes
    (total_amount * (1 + interest_rate / 100)).round(2)
  end

  # Monto de cada cuota (redondeado a 2 decimales), con el interés incluido. El mantenimiento de la
  # tarjeta no va acá: es del grupo y se suma una sola vez por mes (ver InstallmentMonthlyTotal).
  def monto_por_cuota
    (total_con_interes / installments_count).round(2)
  end

  # Monto de la cuota número `numero` (de 1 a installments_count). Todas valen monto_por_cuota salvo
  # la última, que absorbe la diferencia del redondeo para que las cuotas sumen exactamente
  # total_con_interes (por ejemplo, 1000 en 3 cuotas: 333.33, 333.33 y 333.34).
  def monto_cuota(numero)
    return monto_por_cuota unless numero == installments_count

    total_con_interes - (monto_por_cuota * (installments_count - 1))
  end

  # Monto de la cuota que vence en `period`, o nil si ese mes no vence ninguna.
  def monto_cuota_en(period)
    index = periodos.index(period)
    index && monto_cuota(index + 1)
  end

  # Lista de todos los períodos ("2026-09", "2026-10", ...) que cubre esta compra
  def periodos
    inicio = Date.strptime(first_period, "%Y-%m")
    (0...installments_count).map { |i| (inicio + i.months).strftime("%Y-%m") }
  end

  # Cuántas cuotas ya se "consumieron" hasta un período dado (por defecto, el mes actual)
  def cuotas_pagadas(hasta_period = Date.current.strftime("%Y-%m"))
    periodos.count { |p| p <= hasta_period }
  end

  # Cuántas cuotas quedan pendientes
  def cuotas_restantes(hasta_period = Date.current.strftime("%Y-%m"))
    [ installments_count - cuotas_pagadas(hasta_period), 0 ].max
  end

  # Crea una cuota por cada mes de la compra. Si ya había cuotas (porque se editó la compra), las
  # vuelve a crear y conserva como pagadas las que ya lo estaban.
  def generate_installments
    paid_numbers = installments.where(paid: true).pluck(:number)
    installments.destroy_all

    periodos.each_with_index do |period, index|
      installments.create!(
        number: index + 1, period: period, amount: monto_cuota(index + 1), paid: paid_numbers.include?(index + 1)
      )
    end
  end

  # ¿Ya se terminó de pagar?
  def finalizada?(hasta_period = Date.current.strftime("%Y-%m"))
    cuotas_restantes(hasta_period).zero?
  end

  private

  # Las cuotas dependen del total, la cantidad, el interés y el primer mes: solo si cambia alguno
  # (o la compra es nueva) hay que generarlas de nuevo.
  def installments_changed?
    saved_change_to_id? || saved_change_to_total_amount? || saved_change_to_installments_count? ||
      saved_change_to_interest_rate? || saved_change_to_first_period?
  end
end
