require "test_helper"

class WelcomeMailerTest < ActionMailer::TestCase
  def usuario(attrs = {})
    User.new({ user: "camila", email: "camila@example.com", first_name: "Camila" }.merge(attrs))
  end

  test "bienvenida va al usuario y tiene el asunto" do
    mail = WelcomeMailer.bienvenida(usuario)

    assert_equal [ "camila@example.com" ], mail.to
    assert_equal "Te damos la bienvenida a GastoClaro", mail.subject
  end

  test "saluda con el apodo que eligio la persona" do
    mail = WelcomeMailer.bienvenida(usuario(user: "cami", first_name: "Camila"))

    [ mail.text_part, mail.html_part ].each do |parte|
      assert_includes parte.body.to_s, "Hola, Cami"
      assert_not_includes parte.body.to_s, "Hola, Camila"
    end
  end

  test "sin apodo (el usuario es su mail) saluda con el nombre de pila" do
    mail = WelcomeMailer.bienvenida(usuario(user: "camila@example.com", first_name: "Camila"))

    [ mail.text_part, mail.html_part ].each do |parte|
      assert_includes parte.body.to_s, "Hola, Camila"
      assert_not_includes parte.body.to_s, "camila@example.com"
    end
  end

  test "sin apodo ni nombre saluda con Hola" do
    mail = WelcomeMailer.bienvenida(usuario(user: "camila@example.com", first_name: nil))

    [ mail.text_part, mail.html_part ].each do |parte|
      assert_includes parte.body.to_s, "¡Hola!"
      assert_not_includes parte.body.to_s, "Hola, "
    end
  end

  test "lleva las dos imagenes dentro del correo y no usa base64" do
    mail = WelcomeMailer.bienvenida(usuario)

    assert_equal %w[gastoclaro-chanchito.png gastoclaro-portada.jpg], mail.attachments.map(&:filename).sort
    assert mail.attachments.all?(&:inline?)
    assert_no_match(/data:image/, mail.html_part.body.to_s)
    assert_equal 2, mail.html_part.body.to_s.scan("cid:").size
  end

  test "trae el contenido aprobado: formulario de soporte y nota con las cifras" do
    mail = WelcomeMailer.bienvenida(usuario)

    assert_includes mail.html_part.body.to_s, "formulario de soporte"
    assert_includes mail.html_part.body.to_s, "El contexto que nos inspiró"
    assert_includes mail.text_part.body.to_s, "12,9%"
  end
end
