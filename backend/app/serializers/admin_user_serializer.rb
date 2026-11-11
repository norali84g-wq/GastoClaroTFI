# Lo que el administrador ve de cada usuario: datos de la cuenta y de uso. No incluye el DNI, la
# fecha de nacimiento ni ningún monto: el admin administra la app, no mira las finanzas de nadie.
class AdminUserSerializer
  # `stats` trae los conteos de todos los usuarios, calculados una sola vez (ver .stats_for).
  def self.call(user, stats)
    {
      id: user.id, user: user.user, email: user.email, admin: user.admin, active: user.active,
      first_name: user.first_name, last_name: user.last_name, created_at: user.created_at,
      expenses_count: stats[:expenses].fetch(user.id, 0),
      last_expense_on: stats[:last_expense].fetch(user.id, nil),
      support_messages_count: stats[:messages].fetch(user.id, 0),
      pending_support_messages_count: stats[:pending].fetch(user.id, 0)
    }
  end

  def self.stats_for
    {
      expenses: Expense.group(:user_id).count,
      last_expense: Expense.group(:user_id).maximum(:date),
      messages: SupportMessage.group(:user_id).count,
      pending: SupportMessage.where(attended: false).group(:user_id).count
    }
  end
end
