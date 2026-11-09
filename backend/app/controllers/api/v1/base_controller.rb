class Api::V1::BaseController < ActionController::API
  # Idioma de los mensajes de la API. Se usa solo acá, sin tocar el idioma del back-office.
  API_LOCALE = :es
  # Campo que se informa cuando el error no es de un campo en particular.
  BASE_FIELD = "base".freeze

  around_action :use_api_locale
  before_action :authenticate_user!

  rescue_from ActiveRecord::RecordNotFound do
    render_error(api_t("not_found"), status: :not_found)
  end

  private

  def use_api_locale(&)
    I18n.with_locale(API_LOCALE, &)
  end

  def authenticate_user!
    token = request.headers["Authorization"]&.split(" ")&.last
    @current_user = AuthToken.user_from(token) if token.present?
    render_error(api_t("unauthorized"), status: :unauthorized) unless @current_user
  end

  def current_user
    @current_user
  end

  # Corta con 403 si el usuario no es administrador.
  def require_admin!
    render_error(api_t("forbidden"), status: :forbidden) unless current_user.admin?
  end

  # El admin ve los datos de todos. Un usuario común ve solo los suyos.
  def visible_expenses
    current_user.admin? ? Expense.all : current_user.expenses
  end

  def visible_incomes
    current_user.admin? ? Income.all : current_user.incomes
  end

  # Los presupuestos y sus alertas son de cada usuario. El admin ve los de todos.
  def visible_budgets
    current_user.admin? ? Budget.all : current_user.budgets
  end

  # Los medios de pago son de cada usuario. El admin ve los de todos.
  def visible_payment_methods
    current_user.admin? ? PaymentMethod.all : current_user.payment_methods
  end

  # payment_method_id es opcional; si se envía tiene que ser un valor simple y un medio de pago
  # visible para el usuario. Se busca con `id:` para que nunca se interprete como SQL.
  # Si el registro ya tenía ese mismo medio de pago, se acepta aunque sea de otro usuario: las compras
  # en cuotas son del grupo familiar, y otro integrante tiene que poder editarlas sin cambiar la tarjeta.
  def payment_method_valido?(record)
    payment_method_id = params[:payment_method_id]
    return true if payment_method_id.blank?
    return false unless payment_method_id.is_a?(String) || payment_method_id.is_a?(Integer)
    return true if record.persisted? && payment_method_id.to_s == record.payment_method_id_in_database.to_s

    visible_payment_methods.exists?(id: payment_method_id)
  end

  # Las metas de ahorro y las compras en cuotas pertenecen al grupo familiar del usuario.
  # El admin ve las de todos.
  def visible_savings_goals
    current_user.admin? ? SavingsGoal.all : current_user.family_group.savings_goals
  end

  def visible_installment_purchases
    current_user.admin? ? InstallmentPurchase.all : current_user.family_group.installment_purchases
  end

  def visible_shopping_list_items
    current_user.admin? ? ShoppingListItem.all : current_user.family_group.shopping_list_items
  end

  # Formato único de errores: { "errors": [ { "field": "...", "message": "..." } ] }

  # Un solo mensaje general (401, 403, 404...). El campo es "base".
  def render_error(message, status:, field: BASE_FIELD)
    render json: { errors: [ { field: field, message: message } ] }, status: status
  end

  # Errores de validación de un registro (422), uno por campo.
  def render_record_errors(record)
    errors = record.errors.map { |error| { field: error_field(record, error), message: error.message } }
    render json: { errors: errors }, status: :unprocessable_entity
  end

  # Un error de asociación (category) se informa con su clave foránea (category_id),
  # que es el nombre del campo que envía el front.
  def error_field(record, error)
    reflection = record.class.reflect_on_association(error.attribute)
    reflection&.belongs_to? ? reflection.foreign_key.to_s : error.attribute.to_s
  end

  # Traduce un mensaje de la API en el idioma de la API, incluso fuera del around_action.
  def api_t(key)
    I18n.t("api.errors.#{key}", locale: API_LOCALE)
  end
end
