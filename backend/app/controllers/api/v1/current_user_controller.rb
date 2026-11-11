class Api::V1::CurrentUserController < Api::V1::BaseController
  EDITABLE_FIELDS = %i[first_name last_name birth_date dni].freeze

  # Devuelve el usuario del token. Sirve para saber quién está logueado y si es admin.
  def show
    render json: UserSerializer.call(current_user)
  end

  # Edita los datos personales. El mail, el usuario y el rol no se cambian desde acá.
  def update
    if current_user.update(params.permit(*EDITABLE_FIELDS))
      render json: UserSerializer.call(current_user)
    else
      render_record_errors(current_user)
    end
  end
end
