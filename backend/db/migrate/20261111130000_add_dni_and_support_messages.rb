# DNI opcional en el perfil (7 u 8 dígitos), desactivar usuarios y categorías, y mensajes de soporte que el usuario le manda al equipo.
class AddDniAndSupportMessages < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :dni, :string, limit: 8
    add_check_constraint :users, "dni IS NULL OR dni REGEXP '^[0-9]{7,8}$'", name: "chk_users_dni_format"

    # Desactivar no borra nada: la categoría o el usuario dejan de usarse pero su historial queda.
    add_column :categories, :active, :boolean, null: false, default: true
    add_column :users, :active, :boolean, null: false, default: true

    create_table :support_messages do |t|
      t.references :user, null: false, foreign_key: true
      t.string :subject, null: false, limit: 120
      t.text :message, null: false
      t.boolean :attended, null: false, default: false
      t.timestamps
    end
    add_index :support_messages, [ :user_id, :created_at ], name: "index_support_messages_on_user_and_created_at"
  end
end
