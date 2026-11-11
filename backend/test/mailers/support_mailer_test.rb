require "test_helper"

class SupportMailerTest < ActionMailer::TestCase
  setup do
    ENV["SUPPORT_EMAIL"] = "equipo@example.com"
    usuario = User.new(user: "comun", email: "comun@example.com")
    @mensaje = SupportMessage.new(user: usuario, subject: "No me carga el gasto", message: "Da error al guardar.")
  end

  teardown { ENV.delete("SUPPORT_EMAIL") }

  test "new_message va al equipo, responde al usuario y tiene el asunto" do
    mail = SupportMailer.new_message(@mensaje)

    assert_equal [ "equipo@example.com" ], mail.to
    assert_equal [ "comun@example.com" ], mail.reply_to
    assert_includes mail.subject, "No me carga el gasto"
  end

  test "new_message muestra quién escribe y el texto en texto y HTML" do
    mail = SupportMailer.new_message(@mensaje)

    [ mail.text_part, mail.html_part ].each do |parte|
      assert_includes parte.body.to_s, "comun"
      assert_includes parte.body.to_s, "Da error al guardar."
    end
  end
end
