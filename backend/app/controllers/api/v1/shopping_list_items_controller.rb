class Api::V1::ShoppingListItemsController < Api::V1::BaseController
  # Valor de ?status => valor de purchased que trae.
  STATUS_FILTERS = { "pending" => false, "purchased" => true }.freeze

  before_action :set_shopping_list_item, only: %i[update destroy]

  def index
    if params[:status].present? && !STATUS_FILTERS.key?(params[:status])
      return render_error("debe ser pending o purchased", status: :unprocessable_entity, field: "status")
    end

    items = visible_shopping_list_items.includes(:category).order(:period, :name, :id)
    items = items.where(period: params[:period]) if params[:period].present?
    items = items.where(purchased: STATUS_FILTERS[params[:status]]) if params[:status].present?

    render json: items.map { |item| shopping_list_item_json(item) }
  end

  def create
    item = current_user.family_group.shopping_list_items.new(shopping_list_item_params)

    if item.save
      render json: shopping_list_item_json(item), status: :created
    else
      render_record_errors(item)
    end
  end

  def update
    if @shopping_list_item.update(shopping_list_item_params)
      render json: shopping_list_item_json(@shopping_list_item)
    else
      render_record_errors(@shopping_list_item)
    end
  end

  def destroy
    @shopping_list_item.destroy!
    head :no_content
  end

  # Copia los ítems pendientes de un mes a otro, sin duplicar los que ya están en el mes destino.
  # Actúa siempre sobre el grupo familiar del usuario, también si es admin: es una escritura masiva
  # y no debe tocar los datos de otros grupos.
  def copy
    from_period = params[:from_period].to_s
    to_period = params[:to_period].to_s
    errors = copy_errors(from_period, to_period)
    return render json: { errors: errors }, status: :unprocessable_entity if errors.any?

    copied = ShoppingListItem.copy_pending(current_user.family_group, from: from_period, to: to_period)
    render json: copied.map { |item| shopping_list_item_json(item) }, status: :created
  end

  private

  # Solo se puede tocar un ítem visible para el usuario: el de su grupo familiar, o cualquiera si es
  # admin. Si no existe o es de otro grupo, find lanza RecordNotFound y la API responde 404.
  def set_shopping_list_item
    @shopping_list_item = visible_shopping_list_items.find(params[:id])
  end

  def shopping_list_item_params
    params.permit(:name, :period, :quantity, :estimated_unit_price, :category_id, :purchased)
  end

  def copy_errors(from_period, to_period)
    errors = []
    errors << { field: "from_period", message: Period::FORMAT_MESSAGE } unless Period.valid?(from_period)
    errors << { field: "to_period", message: Period::FORMAT_MESSAGE } unless Period.valid?(to_period)
    if errors.empty? && from_period == to_period
      errors << { field: "to_period", message: "debe ser distinto de from_period" }
    end
    errors
  end

  # El subtotal no se guarda: se calcula cada vez (cantidad × precio unitario estimado).
  def shopping_list_item_json(item)
    {
      id: item.id,
      name: item.name,
      period: item.period,
      quantity: item.quantity,
      estimated_unit_price: item.estimated_unit_price,
      subtotal: item.subtotal,
      purchased: item.purchased,
      category: item.category && { id: item.category.id, name: item.category.name }
    }
  end
end
