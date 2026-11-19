class ApplicationMailer < ActionMailer::Base
  default from: ENV["SMTP_FROM"].presence || ENV["SMTP_USER"].presence || "from@example.com"
  layout "mailer"
end
