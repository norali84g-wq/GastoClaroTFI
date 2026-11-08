# Compara los gastos reales de dos meses. Por categoría y por producto muestra cuánto cambió el gasto
# y separa cuánto se debe al precio y cuánto a la cantidad:
#   efecto cantidad = (cantidad nueva - cantidad vieja) * precio viejo   (redondeado a 2 decimales)
#   efecto precio   = diferencia - efecto cantidad  (= (precio nuevo - precio viejo) * cantidad nueva)
# Calcular el efecto precio como resto hace que los dos efectos sumen siempre la diferencia exacta.
# Los gastos de una subcategoría se suman a su categoría raíz. Los productos se emparejan por nombre
# (sin importar mayúsculas ni espacios de más) y unidad. Los efectos salen solo de los gastos con
# detalle de productos; lo que viene de gastos sin detalle se informa aparte en `other_effect`.
class MonthlyComparison
  # `expenses` es lo que el usuario puede ver (ya filtrado por la API).
  def initialize(from_period:, to_period:, expenses:)
    @from_period = from_period
    @to_period = to_period
    @expenses = expenses
    @parent_ids = Category.pluck(:id, :parent_id).to_h
    @root_ids = {}
  end

  def as_json(*)
    from = month_data(@from_period)
    to = month_data(@to_period)
    category_ids = from[:totals].keys | to[:totals].keys
    rows = Category.where(id: category_ids).map { |category| category_row(category, from, to) }
    rows = rows.sort_by { |row| [ -row[:difference].abs, row[:category][:name], row[:category][:id] ] }

    {
      from_period: @from_period,
      to_period: @to_period,
      from_total: rows.sum(0.to_d) { |row| row[:from_total] },
      to_total: rows.sum(0.to_d) { |row| row[:to_total] },
      difference: rows.sum(0.to_d) { |row| row[:difference] },
      categories: rows
    }
  end

  private

  # Totales e ítems de un mes, agrupados por categoría raíz.
  def month_data(period)
    start = Date.strptime("#{period}-01", "%Y-%m-%d")
    expenses = @expenses.where(date: start..start.end_of_month).to_a
    root_by_expense = expenses.to_h { |expense| [ expense.id, root_id(expense.category_id) ] }
    items = ExpenseItem.where(expense_id: root_by_expense.keys).to_a

    {
      totals: expenses.group_by { |expense| root_by_expense[expense.id] }
                      .transform_values { |list| list.sum(0.to_d, &:amount) },
      items: items.group_by { |item| root_by_expense[item.expense_id] }
    }
  end

  # Categoría de más arriba de la que cuelga una categoría. Si los datos tuvieran un ciclo, corta en
  # la última categoría no repetida, así que siempre termina.
  def root_id(category_id)
    @root_ids[category_id] ||= begin
      current = category_id
      seen = Set[current]
      while (parent = @parent_ids[current]) && seen.add?(parent)
        current = parent
      end
      current
    end
  end

  def category_row(category, from, to)
    from_total = from[:totals][category.id] || 0.to_d
    to_total = to[:totals][category.id] || 0.to_d
    products = product_rows(from[:items][category.id] || [], to[:items][category.id] || [])
    difference = to_total - from_total
    price_effect = products.sum(0.to_d) { |product| product[:price_effect] }
    quantity_effect = products.sum(0.to_d) { |product| product[:quantity_effect] }

    {
      category: { id: category.id, name: category.name },
      from_total: from_total,
      to_total: to_total,
      difference: difference,
      percent_change: percent_change(from_total, to_total),
      price_effect: price_effect,
      quantity_effect: quantity_effect,
      other_effect: difference - price_effect - quantity_effect,
      products: products
    }
  end

  def product_rows(from_items, to_items)
    from_by_product = from_items.group_by { |item| product_key(item) }
    to_by_product = to_items.group_by { |item| product_key(item) }

    rows = (from_by_product.keys | to_by_product.keys).map do |key|
      [ key, product_row(from_by_product[key] || [], to_by_product[key] || []) ]
    end
    rows.sort_by { |key, row| [ -row[:difference].abs, *key ] }.map(&:last)
  end

  def product_row(from_list, to_list)
    from_quantity = from_list.sum(0.to_d, &:quantity)
    to_quantity = to_list.sum(0.to_d, &:quantity)
    from_total = from_list.sum(0.to_d, &:subtotal)
    to_total = to_list.sum(0.to_d, &:subtotal)
    difference = to_total - from_total
    quantity_effect = quantity_effect(from_quantity, to_quantity, from_total, to_total)
    reference = to_list.first || from_list.first

    {
      name: reference.name,
      unit: reference.unit,
      from_quantity: from_quantity, to_quantity: to_quantity,
      from_unit_price: unit_price(from_total, from_quantity),
      to_unit_price: unit_price(to_total, to_quantity),
      from_total: from_total, to_total: to_total,
      difference: difference,
      price_effect: difference - quantity_effect,
      quantity_effect: quantity_effect,
      status: product_status(from_quantity, to_quantity)
    }
  end

  # Un producto nuevo o que se dejó de comprar no tiene precio con qué comparar: todo es cantidad.
  # Se usa el precio viejo sin redondear (total / cantidad) y se redondea solo el resultado.
  def quantity_effect(from_quantity, to_quantity, from_total, to_total)
    return to_total if from_quantity.zero?
    return -from_total if to_quantity.zero?

    ((to_quantity - from_quantity) * from_total / from_quantity).round(2)
  end

  # Precio promedio del mes, redondeado a 2 decimales para mostrarlo.
  def unit_price(total, quantity)
    quantity.positive? ? (total / quantity).round(2) : 0.to_d
  end

  def product_status(from_quantity, to_quantity)
    return "new" if from_quantity.zero?
    return "stopped" if to_quantity.zero?

    "bought"
  end

  def product_key(item)
    [ item.name.to_s.squish.downcase, item.unit ]
  end

  def percent_change(from_total, to_total)
    return nil if from_total.zero?

    ((to_total - from_total) / from_total * 100).round(2).to_f
  end
end
