class Api::V1::PaymentMethodsController < Api::V1::BaseController
  before_action :set_payment_method, only: %i[update destroy]

  def index
    payment_methods = visible_payment_methods.includes(:user).order(:name, :id)

    render json: payment_methods.map { |payment_method| payment_method_json(payment_method) }
  end

  def create
    payment_method = current_user.payment_methods.new(payment_method_params)

    if payment_method.save
      render json: payment_method_json(payment_method), status: :created
    else
      render_record_errors(payment_method)
    end
  end

  def update
    if @payment_method.update(payment_method_params)
      render json: payment_method_json(@payment_method)
    else
      render_record_errors(@payment_method)
    end
  end

  # Los gastos y las compras en cuotas que usaban este medio de pago quedan sin medio de pago.
  def destroy
    @payment_method.destroy!
    head :no_content
  end

  private

  # Solo se puede tocar un medio de pago visible para el usuario: el propio, o cualquiera si es admin.
  # Si no existe o es de otro usuario, find lanza RecordNotFound y la API responde 404.
  def set_payment_method
    @payment_method = visible_payment_methods.find(params[:id])
  end

  def payment_method_params
    params.permit(:name, :nickname, :issuer, :last_four, :closing_day, :due_day, :monthly_fee)
  end

  def payment_method_json(payment_method)
    {
      id: payment_method.id,
      name: payment_method.name,
      nickname: payment_method.nickname,
      issuer: payment_method.issuer,
      last_four: payment_method.last_four,
      closing_day: payment_method.closing_day,
      due_day: payment_method.due_day,
      monthly_fee: payment_method.monthly_fee,
      user: { id: payment_method.user_id, user: payment_method.user.user }
    }
  end
end
