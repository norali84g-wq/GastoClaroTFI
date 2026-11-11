require "test_helper"

# El login busca por usuario y, si no, por mail. Para que no se confundan dos cuentas, un nombre de
# usuario con forma de mail solo es válido si es el mail de la propia cuenta.
class UserLoginIdentityTest < ActiveSupport::TestCase
  setup do
    @family_group = FamilyGroup.create!(name: "Familia de prueba")
  end

  def build_user(attributes)
    User.new({ password: "password123", family_group: @family_group }.merge(attributes))
  end

  test "un usuario con forma de mail que no es el suyo es invalido" do
    user = build_user(user: "otra@example.com", email: "mio@example.com")

    assert_not user.valid?
    assert_includes user.errors.attribute_names, :user
  end

  test "un usuario con forma de mail y sin mail propio es invalido" do
    assert_not build_user(user: "otra@example.com").valid?
  end

  test "un usuario igual a su propio mail es valido" do
    assert build_user(user: "ana@example.com", email: "ana@example.com").valid?
  end

  test "un usuario comun sigue siendo valido" do
    assert build_user(user: "ana", email: "ana@example.com").valid?
  end

  test "un usuario existente con forma de mail no se invalida al cambiar otros datos" do
    user = build_user(user: "viejo@example.com", email: "viejo@example.com")
    user.save!
    user.update_columns(email: "nuevo@example.com")

    assert user.reload.update(first_name: "Viejo")
  end
end
