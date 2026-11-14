# Estadísticas de un año (o de un mes de ese año), como las del back-office: consumo, ahorro y gasto
# hormiga mes a mes, el consumo por categoría (con sus subcategorías) y el detalle del gasto hormiga.
# Gasto hormiga: un producto que se compró y no estaba en la lista de gastos fijos de ese mes.
class StatisticsReport
  UNKNOWN_VENDOR = nil

  # `incomes`, `expenses` y `shopping_items` son lo que el usuario puede ver (ya filtrado por la API).
  def initialize(year:, month:, incomes:, expenses:, shopping_items:, today: Date.current)
    @year = year
    @month = month
    @incomes = incomes
    @expenses = expenses
    @shopping_items = shopping_items
    @today = today
  end

  def as_json(*)
    year_range = Date.new(@year, 1, 1)..Date.new(@year, 12, 31)
    income_rows = @incomes.where(date: year_range).pluck(:date, :amount)
    expense_rows = @expenses.where(date: year_range).pluck(:date, :amount, :category_id)
    leaves = Category.where.missing(:subcategories).preload(:parent).to_a
    planned_items = @shopping_items.where(period: periods(months_of_year)).to_a
    expense_items = ExpenseItem.where(expense_id: @expenses.where(date: year_range).select(:id))
                               .includes(expense: :vendor).to_a

    self.class.build(
      year: @year, month: @month, months: months_of_year, available_years: available_years,
      income_rows: income_rows, expense_rows: expense_rows, expense_items: expense_items,
      planned_items: planned_items, leaves: leaves
    )
  end

  # Arma el informe a partir de datos ya cargados. Lo usan el endpoint y las pruebas.
  # - income_rows: [[fecha, monto]]; expense_rows: [[fecha, monto, category_id]]
  # - expense_items: ítems de gasto (con `expense.date`, `expense.category_id`, `expense.vendor`)
  # - planned_items: ítems de la lista de gastos fijos; leaves: categorías sin subcategorías
  def self.build(year:, month:, months:, available_years:, income_rows:, expense_rows:,
                 expense_items:, planned_items:, leaves:)
    leaf_ids = leaves.map(&:id)
    planned_names = planned_names_by_category_and_period(planned_items)
    unplanned_all = unplanned_items(expense_items, leaf_ids, planned_names)
    in_range = month ? months.select { |m| m.month == month } : months
    range_periods = periods(in_range)

    {
      year: year,
      month: month,
      available_years: available_years,
      months: monthly_rows(months, income_rows, expense_rows, unplanned_all),
      by_category: by_category(leaves, expense_rows, planned_items, range_periods),
      by_item: by_item(leaves, planned_items, expense_items, range_periods),
      unplanned: unplanned_summary(unplanned_all.select { |item| range_periods.include?(period_of(item.expense.date)) })
    }
  end

  def self.periods(months)
    months.map { |m| m.strftime("%Y-%m") }
  end

  def self.period_of(date)
    date.strftime("%Y-%m")
  end

  def self.normalize(name)
    name.to_s.strip.downcase
  end

  # { [category_id, "YYYY-MM"] => Set de nombres planificados }
  def self.planned_names_by_category_and_period(planned_items)
    planned_items.each_with_object(Hash.new { |hash, key| hash[key] = [] }) do |item, names|
      names[[ item.category_id, item.period ]] << normalize(item.name)
    end
  end

  def self.unplanned_items(expense_items, leaf_ids, planned_names)
    expense_items.select do |item|
      expense = item.expense
      next false unless leaf_ids.include?(expense.category_id)

      !planned_names[[ expense.category_id, period_of(expense.date) ]].include?(normalize(item.name))
    end
  end

  def self.monthly_rows(months, income_rows, expense_rows, unplanned_all)
    incomes = sum_by_period(income_rows)
    expenses = sum_by_period(expense_rows)
    unplanned = unplanned_all.group_by { |item| period_of(item.expense.date) }

    months.map do |month|
      key = month.strftime("%Y-%m")
      income = incomes[key]
      consumption = expenses[key]
      {
        month: key,
        income: income,
        consumption: consumption,
        savings: income - consumption,
        unplanned: (unplanned[key] || []).sum(0.to_d, &:subtotal)
      }
    end
  end

  def self.sum_by_period(rows)
    rows.each_with_object(Hash.new(0.to_d)) do |(date, amount), totals|
      totals[period_of(date)] += amount
    end
  end

  # Consumo de las categorías hoja del período, agrupado bajo su categoría principal. Cada fila
  # lleva su parte (%) del consumo total del período y, en las subcategorías, lo estimado.
  def self.by_category(leaves, expense_rows, planned_items, range_periods)
    period_rows = expense_rows.select { |(date, _amount, _category_id)| range_periods.include?(period_of(date)) }
    total = period_rows.sum(0.to_d) { |(_date, amount, _category_id)| amount }
    real_by_category = period_rows.each_with_object(Hash.new(0.to_d)) do |(_date, amount, category_id), sums|
      sums[category_id] += amount
    end
    planned_by_category = planned_items.select { |item| range_periods.include?(item.period) }
                                       .group_by(&:category_id)

    groups = {}
    leaves.each do |leaf|
      real = real_by_category[leaf.id]
      planned = (planned_by_category[leaf.id] || []).sum(0.to_d, &:subtotal)
      parent = leaf.parent || leaf
      group = (groups[parent.id] ||= { category: category_json(parent), total: 0.to_d, subcategories: [] })
      group[:total] += real
      next unless leaf.parent

      group[:subcategories] << {
        category: category_json(leaf), real: real, planned: planned,
        over_budget: planned > 0 && real > planned, percentage: percentage(real, total)
      }
    end

    groups.values.each do |group|
      group[:percentage] = percentage(group[:total], total)
      group[:subcategories].sort_by! { |sub| -sub[:real] }
    end
    groups.values.sort_by { |group| -group[:total] }
  end

  # Cada producto de la lista de gastos fijos contra lo que realmente se compró en el período.
  # Se emparejan por categoría y nombre (sin importar mayúsculas ni espacios). Muestra cantidad y
  # precio unitario planificados y reales, y separa la diferencia de plata en dos efectos:
  #   efecto cantidad = (cantidad real - cantidad planificada) * precio planificado
  #   efecto precio   = diferencia - efecto cantidad  (= (precio real - precio planificado) * cantidad real)
  # Así los dos efectos suman siempre la diferencia exacta. Los productos comprados que no estaban
  # planificados no van acá: son el gasto hormiga.
  def self.by_item(leaves, planned_items, expense_items, range_periods)
    categories = leaves.index_by(&:id)
    planned = planned_items.select { |item| range_periods.include?(item.period) && categories.key?(item.category_id) }
                           .group_by { |item| [ item.category_id, normalize(item.name) ] }
    real = expense_items.select { |item| range_periods.include?(period_of(item.expense.date)) }
                        .group_by { |item| [ item.expense.category_id, normalize(item.name) ] }

    rows = planned.map do |key, planned_list|
      item_row(categories[key.first], planned_list, real[key] || [])
    end
    rows.sort_by { |row| [ -row[:difference].abs, row[:name], row[:category][:id] ] }
  end

  def self.item_row(category, planned_list, real_list)
    planned_quantity = planned_list.sum(0.to_d) { |item| item.quantity || 0 }
    planned_total = planned_list.sum(0.to_d, &:subtotal)
    real_quantity = real_list.sum(0.to_d, &:quantity)
    real_total = real_list.sum(0.to_d, &:subtotal)
    difference = real_total - planned_total
    quantity_effect = item_quantity_effect(planned_quantity, real_quantity, planned_total)

    {
      category: category_json(category),
      name: planned_list.first.name,
      planned_quantity: planned_quantity, real_quantity: real_quantity,
      planned_unit_price: average_price(planned_total, planned_quantity),
      real_unit_price: average_price(real_total, real_quantity),
      planned_total: planned_total, real_total: real_total,
      difference: difference,
      quantity_effect: quantity_effect,
      price_effect: difference - quantity_effect,
      status: item_status(planned_total, real_total, real_quantity)
    }
  end

  # Si no se compró nada, todo lo planificado se ahorró (es cantidad). Si lo planificado no tenía
  # cantidad, no hay con qué medir el efecto cantidad y todo cae en precio.
  def self.item_quantity_effect(planned_quantity, real_quantity, planned_total)
    return -planned_total if real_quantity.zero?
    return 0.to_d if planned_quantity.zero?

    ((real_quantity - planned_quantity) * planned_total / planned_quantity).round(2)
  end

  def self.average_price(total, quantity)
    quantity.positive? ? (total / quantity).round(2) : 0.to_d
  end

  def self.item_status(planned_total, real_total, real_quantity)
    return "not_bought" if real_quantity.zero?
    return "over" if real_total > planned_total
    return "under" if real_total < planned_total

    "on_plan"
  end

  def self.unplanned_summary(items)
    by_vendor = items.group_by { |item| item.expense.vendor&.name || UNKNOWN_VENDOR }
                     .map { |vendor, rows| { vendor: vendor, total: rows.sum(0.to_d, &:subtotal) } }
                     .sort_by { |row| -row[:total] }

    {
      total: items.sum(0.to_d, &:subtotal),
      by_vendor: by_vendor,
      items: items.sort_by { |item| [ item.expense.date, item.id.to_i ] }.map do |item|
        {
          name: item.name, quantity: item.quantity, unit_price: item.unit_price,
          subtotal: item.subtotal, date: item.expense.date,
          category_id: item.expense.category_id, vendor: item.expense.vendor&.name || UNKNOWN_VENDOR
        }
      end
    }
  end

  def self.percentage(amount, total)
    total > 0 ? (amount.to_f * 100.0 / total.to_f).round(1) : 0
  end

  def self.category_json(category)
    { id: category.id, name: category.name }
  end

  private

  # Los meses del año que ya empezaron (todos, si es un año anterior).
  def months_of_year
    last_month = @year == @today.year ? @today.month : 12
    (1..last_month).map { |m| Date.new(@year, m, 1) }
  end

  def periods(months)
    self.class.periods(months)
  end

  def available_years
    first_date = [ @incomes.minimum(:date), @expenses.minimum(:date) ].compact.min
    first_year = first_date&.year || @today.year
    (first_year..@today.year).to_a.reverse
  end
end
