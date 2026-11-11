require "test_helper"

class Api::V1::SupportMessagesControllerTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  setup do
    grupo = FamilyGroup.create!(name: "Grupo de prueba")
    @comun = User.create!(user: "comun", email: "comun@example.com", password: "password123", family_group: grupo)
    @admin = User.create!(user: "jefa", password: "password123", family_group: grupo, admin: true)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  def crear(user = @comun, subject: "No me carga el gasto", message: "Cuando guardo un gasto da error.")
    post "/api/v1/support_messages", params: { subject: subject, message: message }, headers: headers_for(user)
  end

  test "un usuario manda una consulta y queda guardada" do
    assert_difference "SupportMessage.count", 1 do
      crear
    end

    assert_response :created
    assert_equal "No me carga el gasto", response.parsed_body["subject"]
    assert_equal false, response.parsed_body["attended"]
    assert_equal "comun", response.parsed_body["user"]
  end

  test "avisa por mail al equipo cuando hay casilla configurada" do
    ENV["SUPPORT_EMAIL"] = "equipo@example.com"
    assert_enqueued_jobs 1 do
      crear
    end
  ensure
    ENV.delete("SUPPORT_EMAIL")
  end

  test "sin casilla configurada guarda el mensaje y no manda mail" do
    ENV.delete("SUPPORT_EMAIL")
    assert_no_enqueued_jobs { crear }
    assert_response :created
  end

  test "rechaza un mensaje sin asunto o sin texto" do
    crear(subject: "", message: "")

    assert_response :unprocessable_entity
    campos = response.parsed_body["errors"].map { |e| e["field"] }
    assert_includes campos, "subject"
    assert_includes campos, "message"
  end

  test "frena el spam: más de 5 mensajes en una hora" do
    SupportMessage::MAX_PER_HOUR.times { crear }
    assert_response :created

    crear

    assert_response :unprocessable_entity
  end

  test "sin token da 401" do
    post "/api/v1/support_messages", params: { subject: "a", message: "b" }

    assert_response :unauthorized
  end

  test "el admin ve todos los mensajes" do
    crear

    get "/api/v1/support_messages", headers: headers_for(@admin)

    assert_response :ok
    assert_equal 1, response.parsed_body.size
    assert_equal "comun@example.com", response.parsed_body.first["email"]
  end

  test "un usuario común no puede ver los mensajes" do
    get "/api/v1/support_messages", headers: headers_for(@comun)

    assert_response :forbidden
  end

  test "el admin marca un mensaje como atendido" do
    crear
    id = response.parsed_body["id"]

    patch "/api/v1/support_messages/#{id}", params: { attended: true }, headers: headers_for(@admin)

    assert_response :ok
    assert_equal true, response.parsed_body["attended"]
  end

  test "un usuario común no puede marcar mensajes y un id inexistente da 404" do
    crear
    id = response.parsed_body["id"]

    patch "/api/v1/support_messages/#{id}", params: { attended: true }, headers: headers_for(@comun)
    assert_response :forbidden

    patch "/api/v1/support_messages/0", params: { attended: true }, headers: headers_for(@admin)
    assert_response :not_found
  end
end
