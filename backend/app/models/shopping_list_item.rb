class ShoppingListItem < ApplicationRecord
  belongs_to :family_group
  belongs_to :category

  validates :name, presence: true
  validates :period, presence: true, format: { with: Period::FORMAT, message: Period::FORMAT_MESSAGE }
  validates :quantity, numericality: { greater_than: 0 }, allow_nil: true
  validates :estimated_unit_price, numericality: { greater_than_or_equal_to: 0 }
  # La columna es NOT NULL: sin esto, un purchased vacío o null llegaría a la base y daría 500.
  validates :purchased, inclusion: { in: [ true, false ], message: "debe ser true o false" }

  # Copia al mes `to` los ítems no comprados del mes `from` de un grupo familiar y devuelve los creados.
  # Saltea los que ya están en `to` con el mismo nombre, sin distinguir mayúsculas ni espacios de más.
  def self.copy_pending(family_group, from:, to:)
    items = family_group.shopping_list_items
    taken = items.where(period: to).pluck(:name).to_set { |name| normalize_name(name) }

    transaction do
      items.where(period: from, purchased: false).order(:name, :id).filter_map do |item|
        # add? devuelve nil si el nombre ya estaba: así tampoco se duplican dos pendientes iguales del origen.
        next unless taken.add?(normalize_name(item.name))

        items.create!(
          name: item.name, period: to, quantity: item.quantity,
          estimated_unit_price: item.estimated_unit_price, category_id: item.category_id
        )
      end
    end
  end

  def self.normalize_name(name)
    name.to_s.squish.downcase
  end

  def subtotal
    (quantity || 0) * (estimated_unit_price || 0)
  end
end
