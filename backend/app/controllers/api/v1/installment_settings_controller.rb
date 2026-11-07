class Api::V1::InstallmentSettingsController < Api::V1::BaseController
  # Mantenimiento mensual de la tarjeta del grupo familiar. Es un monto fijo en pesos que se suma una
  # vez por mes al total de las cuotas. Si el banco lo cambia, hay que actualizarlo acá para que los
  # totales sean reales.
  def show
    render json: settings_json
  end

  def update
    family_group = current_user.family_group

    if family_group.update(params.permit(:card_monthly_fee))
      render json: settings_json
    else
      render_record_errors(family_group)
    end
  end

  private

  def settings_json
    { card_monthly_fee: current_user.family_group.card_monthly_fee }
  end
end
