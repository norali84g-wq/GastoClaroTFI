class SupportMailer < ApplicationMailer
  # Casilla del equipo que recibe las consultas. Si no está definida, el mensaje igual se guarda
  # y el administrador lo ve en la app.
  def self.recipient
    ENV["SUPPORT_EMAIL"]
  end

  def new_message(support_message)
    @support_message = support_message
    @sender = support_message.user

    mail to: self.class.recipient, reply_to: @sender.email.presence,
         subject: "[GastoClaro] Soporte: #{support_message.subject}"
  end
end
