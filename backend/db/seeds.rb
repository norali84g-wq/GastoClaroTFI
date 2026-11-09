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

  puts "Usuario de demostración -> usuario: demo / contraseña: demo1234"
end
