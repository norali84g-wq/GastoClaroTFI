# Datos personales que se piden al registrarse. Son opcionales en la base: los usuarios que ya
# existían (admin, demo) no los tienen.
class AddProfileFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :first_name, :string
    add_column :users, :last_name, :string
    add_column :users, :birth_date, :date
  end
end
