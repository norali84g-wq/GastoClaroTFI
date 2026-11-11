class RegisterUser
  def self.call(params)
    user = User.new(params)
    # Sin nombre de usuario, el usuario es su mail: así se puede registrar con nombre, apellido,
    # mail, fecha de nacimiento y contraseña, y después entrar con el mail.
    user.user = user.email if user.user.blank?
    user.admin = false
    user.family_group = FamilyGroup.new(name: "Personal - #{user.first_name.presence || user.user}")
    user.save(context: :registration)
    user
  end
end
