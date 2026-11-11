class Api::V1::SupportMessagesController < Api::V1::BaseController
  before_action :require_admin!, only: %i[index update]

  # Solo administrador: los mensajes recibidos, del más nuevo al más viejo.
  def index
    messages = SupportMessage.includes(:user).order(created_at: :desc, id: :desc)
    render json: messages.map { |message| serialize(message) }
  end

  def create
    message = current_user.support_messages.new(params.permit(:subject, :message))
    if message.save
      SupportMailer.new_message(message).deliver_later if SupportMailer.recipient.present?
      render json: serialize(message), status: :created
    else
      render_record_errors(message)
    end
  end

  # Solo administrador: marca el mensaje como atendido (o lo vuelve a pendiente).
  def update
    message = SupportMessage.find_by(id: params[:id])
    return render_error(api_t("not_found"), status: :not_found) unless message

    if message.update(attended: ActiveModel::Type::Boolean.new.cast(params[:attended]) || false)
      render json: serialize(message)
    else
      render_record_errors(message)
    end
  end

  private

  def serialize(message)
    {
      id: message.id, subject: message.subject, message: message.message, attended: message.attended,
      created_at: message.created_at, user: message.user.user, email: message.user.email
    }
  end
end
