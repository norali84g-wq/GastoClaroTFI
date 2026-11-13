class Api::V1::RegistrationsController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [ :create ]

  def create
    user = RegisterUser.call(registration_params)

    if user.persisted?
      WelcomeMailer.bienvenida(user).deliver_later
      render json: SessionSerializer.call(user), status: :created
    else
      render_record_errors(user)
    end
  end

  private

  def registration_params
    params.permit(:user, :email, :password, :password_confirmation, :first_name, :last_name, :birth_date)
  end
end
