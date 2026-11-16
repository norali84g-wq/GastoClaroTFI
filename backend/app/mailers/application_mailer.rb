class ApplicationMailer < ActionMailer::Base
  # Remitente: Gmail lo reemplaza por la cuenta de SMTP_USER y Brevo exige un remitente verificado,
  # por eso se lee de MAIL_FROM.
  default from: ENV["MAIL_FROM"].presence || "from@example.com"
  layout "mailer"
end
