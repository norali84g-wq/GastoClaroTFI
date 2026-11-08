# Pasa a NULL los emails vacíos. En SQLite el índice único de users.email ignoraba los '', pero MySQL
# no tiene índices parciales: con dos usuarios sin email el segundo no se podría guardar.
class ClearBlankUserEmails < ActiveRecord::Migration[8.1]
  class MigrationUser < ActiveRecord::Base
    self.table_name = "users"
  end

  def up
    MigrationUser.where(email: "").update_all(email: nil)
  end

  def down
    # No hay nada que deshacer: un email vacío y uno NULL significan lo mismo.
  end
end
