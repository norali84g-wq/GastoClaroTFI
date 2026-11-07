# Compara los gastos reales de dos meses. Por categoría y por producto muestra cuánto cambió el gasto
# y separa cuánto se debe al precio y cuánto a la cantidad:
#   efecto cantidad = (cantidad nueva - cantidad vieja) * precio viejo
#   efecto precio   = (precio nuevo - precio viejo) * cantidad nueva
# Los dos efectos suman la diferencia total del producto. Los productos se emparejan por nombre y
# unidad, sin importar mayúsculas. Los efectos se calculan solo con los gastos que tienen detalle de
# productos; el total de la categoría sale del importe de cada gasto.
class MonthlyComparison
  PERIOD_FORMAT = /\A\d{4}-(0[1-9]|1[0-2])\z/

  # `expenses` es lo que el usuario puede ver (ya filtrado por la API).
  def initialize(from_period:, to_period:, expenses:)
    @from_period = from_period
    @to_period = to_period
    @expenses = expenses
  end

  def as_json(*)
    from = month_data(@from_period)
    to = month_data(@to_period)
    category_ids = (from[:totals].keys | to[:totals].keys)
    rows = Category.where(id: category_ids).map { |category| category_row(category, from, to) }
    rows = rows.sort_by { |row| -row[:difference].abs }

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

  def month_data(period)
    start = Date.strptime("#{period}-01", "%Y-%m-%d")
    expenses = @expenses.where(date: start..start.end_of_month).to_a
    category_by_expense = expenses.to_h { |expense| [ expense.id, expense.category_id ] }
    items = ExpenseItem.where(expense_id: category_by_expense.keys).to_a

    {
      totals: expenses.group_by(&:category_id).transform_values { |list| list.sum(0.to_d, &:amount) },
      items: items.group_by { |item| category_by_expense[item.expense_id] }
    }
  end

  def category_row(category, from, to)
    from_total = from[:totals][category.id] || 0.to_d
    to_total = to[:totals][category.id] || 0.to_d
    products = product_rows(from[:items][category.id] || [], to[:items][category.id] || [])

    {
      category: { id: category.id, name: category.name },
      from_total: from_total,
      to_total: to_total,
      difference: to_total - from_total,
      percent_change: percent_change(from_total, to_total),
      price_effect: products.sum(0.to_d) { |product| product[:price_effect] },
      quantity_effect: products.sum(0.to_d) { |product| product[:quantity_effect] },
      products: products
    }
  end

  def product_rows(from_items, to_items)
    from_by_product = from_items.group_by { |item| product_key(item) }
    to_by_product = to_items.group_by { |item| product_key(item) }

    rows = (from_by_product.keys | to_by_product.keys).map do |key|
      product_row(from_by_product[key] || [], to_by_product[key] || [])
    end
    rows.sort_by { |row| -row[:difference].abs }
  end

  def product_row(from_list, to_list)
    from_quantity = from_list.sum(0.to_d, &:quantity)
    to_quantity = to_list.sum(0.to_d, &:quantity)
    from_total = from_list.sum(0.to_d, &:subtotal)
    to_total = to_list.sum(0.to_d, &:subtotal)
    from_price = from_quantity > 0 ? from_total / from_quantity : 0.to_d
    to_price = to_quantity > 0 ? to_total / to_quantity : 0.to_d
    price_effect, quantity_effect = effects(from_quantity, to_quantity, from_total, to_total, from_price, to_price)
    reference = to_list.first || from_list.first

    {
      name: reference.name,
      unit: reference.unit,
      from_quantity: from_quantity, to_quantity: to_quantity,
      from_unit_price: from_price, to_unit_price: to_price,
      from_total: from_total, to_total: to_total,
      difference: to_total - from_total,
      price_effect: price_effect,
      quantity_effect: quantity_effect,
      status: product_status(from_quantity, to_quantity)
    }
  end

  # Un producto nuevo o que se dejó de comprar no tiene precio con qué comparar: todo es cantidad.
  def effects(from_quantity, to_quantity, from_total, to_total, from_price, to_price)
    return [ 0.to_d, to_total ] if from_quantity.zero?
    return [ 0.to_d, -from_total ] if to_quantity.zero?

    [ (to_price - from_price) * to_quantity, (to_quantity - from_quantity) * from_price ]
  end

  def product_status(from_quantity, to_quantity)
    return "new" if from_quantity.zero?
    return "stopped" if to_quantity.zero?

    "bought"
  end

  def product_key(item)
    [ item.name.to_s.strip.downcase, item.unit ]
  end

  def percent_change(from_total, to_total)
    return nil if from_total.zero?

    ((to_total - from_total) / from_total * 100).round(2)
  end
end
