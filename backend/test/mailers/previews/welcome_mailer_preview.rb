# Vista previa en http://localhost:3000/rails/mailers/welcome_mailer/bienvenida
class WelcomeMailerPreview < ActionMailer::Preview
  def bienvenida
    WelcomeMailer.bienvenida(User.new(user: "camila", email: "camila@example.com", first_name: "Camila"))
  end

  def sin_nombre
    WelcomeMailer.bienvenida(User.new(user: "camila@example.com", email: "camila@example.com"))
  end
end
