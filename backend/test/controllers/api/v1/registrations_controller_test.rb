require "test_helper"

class Api::V1::RegistrationsControllerTest < ActionDispatch::IntegrationTest
  def valid_params
    {
      user: "nueva",
      email: "nueva@example.com",
      password: "password123",
      password_confirmation: "password123"
    }
  end

  def crear_usuario_existente
    familia = FamilyGroup.create!(name: "Familia existente")
    User.create!(user: "existente", email: "existente@example.com", password: "password123", family_group: familia)
  end

  test "el registro crea el usuario con su grupo personal y devuelve el token" do
    assert_difference [ "User.count", "FamilyGroup.count" ], 1 do
      post "/api/v1/register", params: valid_params, as: :json
    end

    assert_response :created
    user = User.find_by(user: "nueva")
    assert_equal user, AuthToken.user_from(response.parsed_body["token"])
    assert_equal "nueva", response.parsed_body["user"]["user"]
    assert_not user.admin?
  end

  test "el registro informa cuando vence el token" do
    post "/api/v1/register", params: valid_params, as: :json

    vence = Time.zone.parse(response.parsed_body["expires_at"])
    assert_in_delta AuthToken::EXPIRATION.from_now.to_f, vence.to_f, 60
  end

  test "el vencimiento del token sale siempre en UTC, aunque la app use hora argentina" do
    post "/api/v1/register", params: valid_params, as: :json

    assert_match(/Z\z/, response.parsed_body["expires_at"])
  end

  test "el token devuelto sirve para usar la API" do
    post "/api/v1/register", params: valid_params, as: :json
    token = response.parsed_body["token"]

    get "/api/v1/expenses", headers: { "Authorization" => "Bearer #{token}" }

    assert_response :ok
  end

  test "ignora admin y family_group_id si vienen en el pedido" do
    otra_familia = FamilyGroup.create!(name: "Otra familia")

    post "/api/v1/register",
         params: valid_params.merge(admin: true, family_group_id: otra_familia.id),
         as: :json

    assert_response :created
    user = User.find_by(user: "nueva")
    assert_not user.admin?
    assert_not_equal otra_familia.id, user.family_group_id
  end

  test "un usuario repetido da 422 y no crea nada" do
    crear_usuario_existente

    assert_no_difference [ "User.count", "FamilyGroup.count" ] do
      post "/api/v1/register", params: valid_params.merge(user: "existente"), as: :json
    end

    assert_response :unprocessable_entity
    assert_not_empty response.parsed_body["errors"]
  end

  test "un email repetido da 422, sin importar mayusculas" do
    crear_usuario_existente

    post "/api/v1/register", params: valid_params.merge(email: "EXISTENTE@example.com"), as: :json

    assert_response :unprocessable_entity
    assert_not_empty response.parsed_body["errors"]
  end

  test "sin email da 422" do
    post "/api/v1/register", params: valid_params.except(:email), as: :json

    assert_response :unprocessable_entity
  end

  test "una contrasena corta da 422" do
    corta = "a" * (User::PASSWORD_MIN_LENGTH - 1)

    post "/api/v1/register", params: valid_params.merge(password: corta, password_confirmation: corta), as: :json

    assert_response :unprocessable_entity
  end

  test "si la confirmacion no coincide da 422" do
    post "/api/v1/register", params: valid_params.merge(password_confirmation: "otra-cosa-123"), as: :json

    assert_response :unprocessable_entity
  end

  test "sin confirmacion de contrasena da 422" do
    post "/api/v1/register", params: valid_params.except(:password_confirmation), as: :json

    assert_response :unprocessable_entity
  end

  test "el registro guarda el nombre de usuario en minusculas y sin espacios" do
    post "/api/v1/register", params: valid_params.merge(user: "  NuevaPersona "), as: :json

    assert_response :created
    assert_equal "nuevapersona", response.parsed_body["user"]["user"]
  end

  test "el registro rechaza un nombre que solo cambia en mayusculas con 422 y el formato de error unico" do
    crear_usuario_existente

    assert_no_difference "User.count" do
      post "/api/v1/register", params: valid_params.merge(user: "Existente"), as: :json
    end

    assert_response :unprocessable_entity
    assert_equal "user", response.parsed_body["errors"].first["field"]
  end

  test "el registro guarda nombre, apellido y fecha de nacimiento, y usa el mail como usuario" do
    post "/api/v1/register", as: :json, params: {
      email: "Ana.Perez@Example.com", password: "password123", password_confirmation: "password123",
      first_name: "  Ana ", last_name: "Pérez", birth_date: "1990-05-17"
    }

    assert_response :created
    user = response.parsed_body["user"]
    assert_equal "ana.perez@example.com", user["user"]
    assert_equal "Ana", user["first_name"]
    assert_equal "Pérez", user["last_name"]
    assert_equal "1990-05-17", user["birth_date"]
  end

  test "una fecha de nacimiento futura da 422" do
    post "/api/v1/register", params: valid_params.merge(birth_date: 1.day.from_now.to_date.to_s), as: :json

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].map { |e| e["field"] }, "birth_date"
  end

  test "despues de registrarse con mail se puede iniciar sesion con ese mail" do
    post "/api/v1/register", as: :json, params: {
      email: "luz@example.com", password: "password123", password_confirmation: "password123"
    }
    assert_response :created

    post "/api/v1/login", params: { user: "luz@example.com", password: "password123" }, as: :json
    assert_response :ok
  end

  test "registrarse solo con mail usa el mail como usuario y el grupo lleva el nombre" do
    post "/api/v1/register",
         params: { email: "ana@example.com", first_name: "Ana", password: "password123",
                   password_confirmation: "password123" },
         as: :json

    assert_response :created
    assert_equal "ana@example.com", response.parsed_body["user"]["user"]
    assert_equal "Personal - Ana", User.find_by(user: "ana@example.com").family_group.name
  end

  test "no se puede registrar un usuario con el mail de otra persona" do
    assert_no_difference "User.count" do
      post "/api/v1/register", params: valid_params.merge(user: "victima@example.com"), as: :json
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].map { |e| e["field"] }, "user"
  end
end
