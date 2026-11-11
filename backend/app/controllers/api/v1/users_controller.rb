class Api::V1::UsersController < Api::V1::BaseController
  before_action :require_admin!

  def index
    stats = AdminUserSerializer.stats_for
    render json: User.order(:id).map { |user| AdminUserSerializer.call(user, stats) }
  end

  # Cuántos usuarios hay. Lo usa el administrador en su perfil.
  def stats
    render json: {
      total: User.count,
      active: User.where(active: true).count,
      admins: User.where(admin: true).count,
      new_last_30_days: User.where(created_at: 30.days.ago..).count
    }
  end

  # Activa o desactiva una cuenta. No borra nada: los datos quedan y la persona no puede entrar
  # hasta que se la vuelva a activar.
  def update
    user = User.find(params[:id])
    if user == current_user
      return render_error(api_t("cannot_disable_self"), status: :unprocessable_entity, field: "active")
    end

    if user.update(active: ActiveModel::Type::Boolean.new.cast(params[:active]))
      render json: AdminUserSerializer.call(user, AdminUserSerializer.stats_for)
    else
      render_record_errors(user)
    end
  end
end
