# Clave del ícono que el front muestra para la categoría o el medio de pago (por ejemplo "auto" o
# "tarjeta-azul"). Es opcional: sin ícono, el front elige uno por el nombre.
class AddIconToCategoriesAndPaymentMethods < ActiveRecord::Migration[8.1]
  def change
    add_column :categories, :icon, :string
    add_column :payment_methods, :icon, :string
  end
end
