class InstallmentPurchase < ApplicationRecord
  belongs_to :family_group
  belongs_to :category
  belongs_to :vendor, optional: true

  validates :description, presence: true
  validates :total_amount, numericality: { greater_than: 0 }
  validates :installments_count,
            numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 48 }
  validates :interest_rate, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :first_period, presence: true, format: { with: Period::FORMAT, message: Period::FORMAT_MESSAGE }

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

  # ¿Ya se terminó de pagar?
  def finalizada?(hasta_period = Date.current.strftime("%Y-%m"))
    cuotas_restantes(hasta_period).zero?
  end
end
