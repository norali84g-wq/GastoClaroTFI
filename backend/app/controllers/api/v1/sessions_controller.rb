class Api::V1::SessionsController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [ :create ]

  def create
    user = authenticate(params[:user].to_s, params[:password].to_s)
    if user
      render json: SessionSerializer.call(user)
    else
      render_error(api_t("invalid_credentials"), status: :unauthorized)
    end
  end

  # Cierra la sesión: invalida todos los tokens emitidos para el usuario.
  def destroy
    current_user.revoke_tokens!
    head :no_content
  end

  private

  # Se puede entrar con el nombre de usuario o con el mail.
  def authenticate(identifier, password)
    User.authenticate_by(user: identifier, password: password) ||
      User.authenticate_by(email: identifier, password: password)
  end
end
