require "test_helper"

class Api::V1::UsersStatsTest < ActionDispatch::IntegrationTest
  setup do
    grupo = FamilyGroup.create!(name: "Grupo de prueba")
    @comun = User.create!(user: "comun", email: "comun@example.com", password: "password123", family_group: grupo)
    @admin = User.create!(user: "jefa", password: "password123", family_group: grupo, admin: true)
    @viejo = User.create!(user: "viejo", email: "viejo@example.com", password: "password123", family_group: grupo)
    @viejo.update_columns(created_at: 45.days.ago)
  end

  def headers_for(user)
    { "Authorization" => "Bearer #{AuthToken.encode(user)}" }
  end

  test "el admin ve cuántos usuarios hay" do
    get "/api/v1/users/stats", headers: headers_for(@admin)

    assert_response :ok
    assert_equal({ "total" => 3, "active" => 3, "admins" => 1, "new_last_30_days" => 2 }, response.parsed_body)
  end

  test "un usuario común no ve las estadísticas de usuarios" do
    get "/api/v1/users/stats", headers: headers_for(@comun)

    assert_response :forbidden
  end

  test "sin token da 401" do
    get "/api/v1/users/stats"

    assert_response :unauthorized
  end
end
