family_group = FamilyGroup.find_or_create_by!(name: "Familia Gorosito") do |fg|
  fg.savings_percentage = 10
end

User.find_or_create_by!(user: "admin") do |u|
  u.password = "admin1234"
  u.family_group = family_group
  u.admin = true
end

puts "Admin creado -> usuario: admin / contraseña: admin1234"

# Categorías de ejemplo (las del contrato de la API, docs/api/api.md).
supermercado = Category.find_or_create_by!(name: "Supermercado")
limpieza = Category.find_or_create_by!(name: "Limpieza")
# Categoría que admite compras en cuotas (tracks_installments), para la demo de cuotas.
electrodomesticos = Category.find_or_create_by!(name: "Electrodomésticos") do |c|
  c.tracks_installments = true
end
# Más categorías para la demo. "Indumentaria" admite compras en cuotas.
transporte = Category.find_or_create_by!(name: "Transporte")
salud = Category.find_or_create_by!(name: "Salud")
ocio = Category.find_or_create_by!(name: "Ocio")
indumentaria = Category.find_or_create_by!(name: "Indumentaria") do |c|
  c.tracks_installments = true
end

# Datos de demostración: un usuario de prueba con ingresos y gastos para que el panel muestre algo.
# No es una cuenta real y no se crea en producción. Se pueden volver a correr sin duplicar nada.
unless Rails.env.production?
  demo_family = FamilyGroup.find_or_create_by!(name: "Personal - demo") do |fg|
    fg.savings_percentage = 10
  end

  demo = User.find_or_create_by!(user: "demo") do |u|
    u.email = "demo@example.com"
    u.password = "demo1234"
    u.family_group = demo_family
  end

  today = Date.current
  last_month = today.prev_month

  [ [ today, "Sueldo" ], [ last_month, "Sueldo (mes anterior)" ] ].each do |date, description|
    Income.find_or_create_by!(user: demo, description: description) do |income|
      income.amount = 450_000
      income.date = date
    end
  end

  [
    { date: today, category: supermercado, description: "Compra semanal",
      items: [ [ "Leche", 2, 1800.5 ], [ "Arroz", 1, 9500 ] ] },
    { date: today, category: limpieza, description: "Productos de limpieza", amount: 25_000 },
    { date: last_month, category: supermercado, description: "Compra del mes anterior", amount: 38_000 }
  ].each do |data|
    next if Expense.exists?(user: demo, description: data[:description])

    expense = Expense.new(user: demo, category: data[:category], date: data[:date],
                          description: data[:description], amount: data[:amount])
    data[:items]&.each do |name, quantity, unit_price|
      expense.expense_items.build(name: name, quantity: quantity, unit_price: unit_price)
    end
    expense.save!
  end

  # Medio de pago con mantenimiento mensual (se suma una vez al mes si hay cuotas).
  visa = PaymentMethod.find_or_create_by!(user: demo, name: "Visa") do |m|
    m.monthly_fee = 2_500
  end

  # Presupuesto de Supermercado del mes: lo gastado (~13.100) queda por encima del 80 % de 15.000,
  # así que la demo muestra una alerta de presupuesto.
  mes_actual = today.strftime("%Y-%m")
  presupuesto = Budget.find_or_create_by!(user: demo, category: supermercado, period: mes_actual) do |b|
    b.amount = 15_000
  end
  BudgetAlertChecker.for_budget(presupuesto)

  # Compra en cuotas que empezó hace dos meses: las dos primeras cuotas ya están pagas y el resto no.
  unless InstallmentPurchase.exists?(family_group: demo_family, description: "Heladera")
    compra = InstallmentPurchase.create!(
      family_group: demo_family, category: electrodomesticos, payment_method: visa,
      description: "Heladera", total_amount: 600_000, installments_count: 12,
      interest_rate: 0, first_period: today.prev_month(2).strftime("%Y-%m")
    )
    compra.installments.where(number: [ 1, 2 ]).update_all(paid: true)
  end

  # ------------------------------------------------------------------------------------------
  # Datos de demostración ampliados: seis meses de historia para ver todas las pantallas.
  # ------------------------------------------------------------------------------------------
  mastercard = PaymentMethod.find_or_create_by!(user: demo, name: "Mastercard") do |m|
    m.monthly_fee = 2_000
  end

  # Día `n` del mes de hace `back` meses (en el mes actual nunca pasa de hoy).
  fecha = lambda do |back, n|
    d = today.prev_month(back).beginning_of_month + (n - 1)
    back.zero? ? [ d, today ].min : d
  end

  # Ingresos de los meses anteriores y un trabajo extra este mes.
  (2..6).each do |back|
    mes = today.prev_month(back)
    Income.find_or_create_by!(user: demo, description: "Sueldo #{mes.strftime('%m/%Y')}") do |income|
      income.amount = 450_000 - (back * 10_000)
      income.date = mes.beginning_of_month
    end
  end
  Income.find_or_create_by!(user: demo, description: "Trabajo extra") do |income|
    income.amount = 50_000
    income.date = fecha.call(0, 15)
  end

  crear_gasto = lambda do |description:, category:, date:, amount: nil, items: nil, fixed: false,
                           channel: :presencial, payment_method: nil|
    next if Expense.exists?(user: demo, description: description)

    expense = Expense.new(user: demo, category: category, date: date, description: description,
                          amount: amount, is_fixed: fixed, purchase_channel: channel,
                          payment_method_id: payment_method&.id)
    items&.each do |name, quantity, unit_price|
      expense.expense_items.build(name: name, quantity: quantity, unit_price: unit_price)
    end
    expense.save!
  end

  # Historia de los últimos seis meses: algo de cada categoría, con variaciones entre meses.
  (1..6).each do |back|
    etiqueta = today.prev_month(back).strftime("%m/%Y")
    crear_gasto.call(description: "Supermercado #{etiqueta}", category: supermercado,
                     date: fecha.call(back, 5), amount: 30_000 + (back * 1_500))
    crear_gasto.call(description: "Transporte #{etiqueta}", category: transporte,
                     date: fecha.call(back, 10), amount: 16_000 + (back * 900))
    crear_gasto.call(description: "Salud #{etiqueta}", category: salud,
                     date: fecha.call(back, 14), amount: back.even? ? 12_000 : 7_500)
    crear_gasto.call(description: "Ocio #{etiqueta}", category: ocio,
                     date: fecha.call(back, 20), amount: 8_000 + (back * 700))
    crear_gasto.call(description: "Netflix #{etiqueta}", category: ocio, date: fecha.call(back, 3),
                     amount: 9_999, fixed: true)
  end

  # Este mes: más movimientos para que las categorías y las alertas se vean.
  crear_gasto.call(description: "Farmacia Central", category: salud, date: fecha.call(0, 8),
                   amount: 12_600, payment_method: mastercard)
  crear_gasto.call(description: "YPF", category: transporte, date: fecha.call(0, 12),
                   amount: 20_000, payment_method: visa)
  crear_gasto.call(description: "Netflix", category: ocio, date: fecha.call(0, 5),
                   amount: 9_999, fixed: true)
  crear_gasto.call(description: "Almuerzo con amigas", category: ocio, date: fecha.call(0, 18),
                   amount: 5_400, channel: :delivery)

  # Presupuestos: Transporte llega al 80 % y Ocio pasa el 100 %, así que la demo muestra las dos alertas.
  [
    [ today, transporte, 25_000 ],
    [ today, ocio, 15_000 ],
    [ today.prev_month, supermercado, 40_000 ]
  ].each do |fecha_presupuesto, categoria, monto|
    budget = Budget.find_or_create_by!(user: demo, category: categoria,
                                       period: fecha_presupuesto.strftime("%Y-%m")) do |b|
      b.amount = monto
    end
    BudgetAlertChecker.for_budget(budget)
  end

  # Metas de ahorro.
  {
    "Viaje a la Patagonia" => [ 500_000, 249_550, today.next_month(6) ],
    "Fondo de emergencia" => [ 200_000, 80_000, today.next_month(10) ]
  }.each do |name, (target, saved, deadline)|
    SavingsGoal.find_or_create_by!(family_group: demo_family, name: name) do |goal|
      goal.target_amount = target
      goal.saved_amount = saved
      goal.deadline = deadline
    end
  end

  # Lista de compras: este mes (con algunos comprados) y un mes anterior con pendientes para copiar.
  [
    [ today, "Leche", supermercado, 4, 1_300, true ],
    [ today, "Arroz", supermercado, 2, 1_900, true ],
    [ today, "Detergente", limpieza, 1, 4_100, false ],
    [ today, "Aceite", supermercado, 2, 4_800, false ],
    [ today.prev_month, "Yerba", supermercado, 1, 6_200, false ],
    [ today.prev_month, "Fideos", supermercado, 3, 1_500, false ],
    [ today.prev_month, "Jabón", limpieza, 2, 2_500, true ]
  ].each do |mes, name, categoria, cantidad, precio, comprado|
    ShoppingListItem.find_or_create_by!(family_group: demo_family, period: mes.strftime("%Y-%m"),
                                        name: name) do |item|
      item.category = categoria
      item.quantity = cantidad
      item.estimated_unit_price = precio
      item.purchased = comprado
    end
  end

  # Segunda compra en cuotas, con interés, ya con la primera cuota paga.
  unless InstallmentPurchase.exists?(family_group: demo_family, description: "Zapatillas")
    zapatillas = InstallmentPurchase.create!(
      family_group: demo_family, category: indumentaria, payment_method: mastercard,
      description: "Zapatillas", total_amount: 59_000, installments_count: 6,
      interest_rate: 18, first_period: today.prev_month.strftime("%Y-%m")
    )
    zapatillas.installments.where(number: 1).update_all(paid: true)
  end

  puts "Usuario de demostración -> usuario: demo / contraseña: demo1234"
end
