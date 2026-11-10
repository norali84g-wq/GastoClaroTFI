require "test_helper"

class Api::V1::SavingsGoalsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @familia = FamilyGroup.create!(name: "Familia de prueba")
    @user = User.create!(user: "tester", password: "password123", family_group: @familia)
    @admin = User.create!(user: "jefa", password: "password123", family_group: @familia, admin: true)
    @meta = SavingsGoal.create!(family_group: @familia, name: "Viaje", target_amount: 1000, saved_amount: 250)

    @otra_familia = FamilyGroup.create!(name: "Otra familia")
    @otro_user = User.create!(user: "otro", password: "password123", family_group: @otra_familia)
    @meta_ajena = SavingsGoal.create!(family_group: @otra_familia, name: "Auto", target_amount: 5000)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "index sin token da 401" do
    get "/api/v1/savings_goals"

    assert_response :unauthorized
  end

  test "index devuelve solo las metas del grupo familiar, con el progreso calculado" do
    get "/api/v1/savings_goals", headers: headers_for(@user)

    assert_response :ok
    metas = response.parsed_body
    assert_equal [ "Viaje" ], metas.map { |m| m["name"] }
    assert_equal 25, metas.first["progress_percentage"]
    assert_equal BigDecimal("1000"), BigDecimal(metas.first["target_amount"])
    assert_nil metas.first["deadline"]
  end

  test "el admin ve las metas de todos los grupos" do
    get "/api/v1/savings_goals", headers: headers_for(@admin)

    assert_equal [ "Auto", "Viaje" ], response.parsed_body.map { |m| m["name"] }.sort
  end

  test "create con datos validos da 201 y queda en el grupo del usuario" do
    assert_difference "SavingsGoal.count", 1 do
      post "/api/v1/savings_goals",
           params: { name: "Notebook", target_amount: 800, deadline: "2027-03-01" },
           headers: headers_for(@user), as: :json
    end

    assert_response :created
    body = response.parsed_body
    assert_equal "Notebook", body["name"]
    assert_equal 0, BigDecimal(body["saved_amount"])
    assert_equal 0, body["progress_percentage"]
    assert_equal "2027-03-01", body["deadline"]
    assert_equal @familia.id, SavingsGoal.find(body["id"]).family_group_id
  end

  test "create ignora un family_group_id enviado" do
    post "/api/v1/savings_goals",
         params: { name: "Notebook", target_amount: 800, family_group_id: @otra_familia.id },
         headers: headers_for(@user), as: :json

    assert_response :created
    assert_equal @familia.id, SavingsGoal.find(response.parsed_body["id"]).family_group_id
  end

  test "create con datos invalidos da 422 y no guarda" do
    assert_no_difference "SavingsGoal.count" do
      post "/api/v1/savings_goals",
           params: { name: "", target_amount: 0, saved_amount: -5 },
           headers: headers_for(@user), as: :json
    end

    assert_response :unprocessable_entity
    campos = response.parsed_body["errors"].map { |e| e["field"] }
    assert_includes campos, "name"
    assert_includes campos, "target_amount"
    assert_includes campos, "saved_amount"
  end

  test "update cambia solo lo que se envia y recalcula el progreso" do
    patch "/api/v1/savings_goals/#{@meta.id}", params: { saved_amount: 500 },
                                               headers: headers_for(@user), as: :json

    assert_response :ok
    assert_equal 50, response.parsed_body["progress_percentage"]
    assert_equal "Viaje", response.parsed_body["name"]
  end

  test "update con datos invalidos da 422" do
    patch "/api/v1/savings_goals/#{@meta.id}", params: { target_amount: 0 },
                                               headers: headers_for(@user), as: :json

    assert_response :unprocessable_entity
    assert_equal "target_amount", response.parsed_body["errors"].first["field"]
    assert_equal 1000, @meta.reload.target_amount
  end

  test "update de una meta de otro grupo da 404 y no la modifica" do
    patch "/api/v1/savings_goals/#{@meta_ajena.id}", params: { name: "hackeada" },
                                                     headers: headers_for(@user), as: :json

    assert_response :not_found
    assert_equal "Auto", @meta_ajena.reload.name
  end

  test "el admin puede editar la meta de otro grupo" do
    patch "/api/v1/savings_goals/#{@meta_ajena.id}", params: { name: "Auto nuevo" },
                                                     headers: headers_for(@admin), as: :json

    assert_response :ok
    assert_equal "Auto nuevo", @meta_ajena.reload.name
  end

  test "destroy sin token da 401" do
    assert_no_difference "SavingsGoal.count" do
      delete "/api/v1/savings_goals/#{@meta.id}"
    end

    assert_response :unauthorized
  end

  test "destroy borra la meta y responde 204 sin cuerpo" do
    assert_difference "SavingsGoal.count", -1 do
      delete "/api/v1/savings_goals/#{@meta.id}", headers: headers_for(@user)
    end

    assert_response :no_content
    assert_empty response.body
  end

  test "destroy de una meta de otro grupo da 404 y no la borra" do
    assert_no_difference "SavingsGoal.count" do
      delete "/api/v1/savings_goals/#{@meta_ajena.id}", headers: headers_for(@user)
    end

    assert_response :not_found
  end

  test "destroy de una meta que no existe da 404" do
    delete "/api/v1/savings_goals/0", headers: headers_for(@user)

    assert_response :not_found
  end

  PNG_1X1 = Base64.decode64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==").freeze

  # Active Storage detecta el tipo real mirando los bytes, no la extensión: para probar el rechazo
  # hay que mandar un GIF de verdad.
  GIF_1X1 = Base64.decode64("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7").freeze

  def imagen_png(nombre = "meta.png", tipo = "image/png", contenido = PNG_1X1)
    Rack::Test::UploadedFile.new(StringIO.new(contenido), tipo, original_filename: nombre)
  end

  test "las metas sin imagen devuelven image_url nulo" do
    get "/api/v1/savings_goals", headers: headers_for(@user)

    assert_nil response.parsed_body.first["image_url"]
  end

  test "create acepta una imagen y devuelve su image_url" do
    post "/api/v1/savings_goals", headers: headers_for(@user),
         params: { name: "Moto", target_amount: 900, image: imagen_png }

    assert_response :created
    assert_match %r{\A/rails/active_storage/blobs/}, response.parsed_body["image_url"]
    assert SavingsGoal.find(response.parsed_body["id"]).image.attached?
  end

  test "create rechaza una imagen que no es JPG, PNG o WebP" do
    post "/api/v1/savings_goals", headers: headers_for(@user),
         params: { name: "Moto", target_amount: 900, image: imagen_png("meta.gif", "image/gif", GIF_1X1) }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].map { |e| e["field"] }, "image"
  end

  test "create rechaza una imagen de más de 2 MB" do
    grande = PNG_1X1 + ("0" * (2.megabytes + 1))
    post "/api/v1/savings_goals", headers: headers_for(@user),
         params: { name: "Moto", target_amount: 900, image: imagen_png("grande.png", "image/png", grande) }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].map { |e| e["field"] }, "image"
  end

  test "update puede cambiar y quitar la imagen" do
    patch "/api/v1/savings_goals/#{@meta.id}", headers: headers_for(@user), params: { image: imagen_png }
    assert_response :ok
    assert @meta.reload.image.attached?

    patch "/api/v1/savings_goals/#{@meta.id}", headers: headers_for(@user), params: { remove_image: "true" }
    assert_response :ok
    assert_nil response.parsed_body["image_url"]
    assert_not @meta.reload.image.attached?
  end
end
