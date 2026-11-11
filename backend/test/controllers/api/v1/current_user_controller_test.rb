require "test_helper"

class Api::V1::CurrentUserControllerTest < ActionDispatch::IntegrationTest
  setup do
    grupo = FamilyGroup.create!(name: "Grupo de prueba")
    @comun = User.create!(user: "comun", email: "comun@example.com", password: "password123", family_group: grupo)
    @admin = User.create!(user: "jefa", password: "password123", family_group: grupo, admin: true)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "me devuelve el usuario del token" do
    get "/api/v1/me", headers: headers_for(@comun)

    assert_response :ok
    esperado = { "id" => @comun.id, "user" => "comun", "email" => "comun@example.com", "admin" => false,
                 "first_name" => nil, "last_name" => nil, "birth_date" => nil, "dni" => nil }
    assert_equal esperado, response.parsed_body
  end

  test "PATCH me edita nombre, apellido, fecha de nacimiento y DNI" do
    patch "/api/v1/me", params: { first_name: " Norali ", last_name: "Gómez", birth_date: "1990-05-20", dni: "12.345.678" },
                        headers: headers_for(@comun)

    assert_response :ok
    assert_equal "Norali", response.parsed_body["first_name"]
    assert_equal "1990-05-20", response.parsed_body["birth_date"]
    assert_equal "12345678", response.parsed_body["dni"]
    assert_equal "12345678", @comun.reload.dni
  end

  test "PATCH me rechaza una fecha de nacimiento futura" do
    patch "/api/v1/me", params: { birth_date: 1.day.from_now.to_date.to_s }, headers: headers_for(@comun)

    assert_response :unprocessable_entity
    assert_equal "birth_date", response.parsed_body["errors"].first["field"]
  end

  test "PATCH me rechaza un DNI que no tiene 7 u 8 dígitos" do
    [ "123456", "123456789", "12a45678" ].each do |dni|
      patch "/api/v1/me", params: { dni: dni }, headers: headers_for(@comun)

      assert_response :unprocessable_entity, "debería rechazar #{dni}"
      assert_equal "dni", response.parsed_body["errors"].first["field"]
    end
  end

  test "PATCH me permite borrar el DNI" do
    @comun.update!(dni: "1234567")

    patch "/api/v1/me", params: { dni: "" }, headers: headers_for(@comun)

    assert_response :ok
    assert_nil response.parsed_body["dni"]
  end

  test "PATCH me no cambia el mail, el usuario ni el rol" do
    patch "/api/v1/me", params: { email: "otro@example.com", user: "otro", admin: true, first_name: "Ana" },
                        headers: headers_for(@comun)

    assert_response :ok
    @comun.reload
    assert_equal "comun@example.com", @comun.email
    assert_equal "comun", @comun.user
    assert_not @comun.admin?
  end

  test "PATCH me sin token da 401" do
    patch "/api/v1/me", params: { first_name: "Ana" }

    assert_response :unauthorized
  end

  test "me informa si el usuario es admin" do
    get "/api/v1/me", headers: headers_for(@admin)

    assert_response :ok
    assert_equal true, response.parsed_body["admin"]
  end

  test "me sin token da 401" do
    get "/api/v1/me"

    assert_response :unauthorized
  end

  test "el login devuelve el mismo objeto de usuario que me" do
    post "/api/v1/login", params: { user: "comun", password: "password123" }
    usuario_del_login = response.parsed_body["user"]
    token = response.parsed_body["token"]

    get "/api/v1/me", headers: { "Authorization" => "Bearer #{token}" }

    assert_equal usuario_del_login, response.parsed_body
  end

  test "el login informa cuando vence el token" do
    post "/api/v1/login", params: { user: "comun", password: "password123" }

    vence = Time.zone.parse(response.parsed_body["expires_at"])
    assert_in_delta AuthToken::EXPIRATION.from_now.to_f, vence.to_f, 60
  end
end
