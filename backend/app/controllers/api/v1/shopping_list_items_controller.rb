class Api::V1::ShoppingListItemsController < Api::V1::BaseController
  PERIOD_FORMAT = /\A\d{4}-(0[1-9]|1[0-2])\z/

  before_action :set_shopping_list_item, only: %i[update destroy]

  def index
    items = visible_shopping_list_items.includes(:category).order(:period, :name, :id)
    items = items.where(period: params[:period]) if params[:period].present?
    items = filter_by_status(items)

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
  def copy
    from_period = params[:from_period].to_s
    to_period = params[:to_period].to_s
    errors = copy_errors(from_period, to_period)
    return render json: { errors: errors }, status: 422 if errors.any?

    copied = copy_pending_items(from_period, to_period)
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

  # status=pending trae los no comprados, status=purchased los comprados; sin status, todos.
  def filter_by_status(items)
    case params[:status]
    when "pending" then items.where(purchased: false)
    when "purchased" then items.where(purchased: true)
    else items
    end
  end

  def copy_errors(from_period, to_period)
    errors = []
    errors << { field: "from_period", message: "debe tener formato AAAA-MM" } unless from_period.match?(PERIOD_FORMAT)
    errors << { field: "to_period", message: "debe tener formato AAAA-MM" } unless to_period.match?(PERIOD_FORMAT)
    if errors.empty? && from_period == to_period
      errors << { field: "to_period", message: "debe ser distinto de from_period" }
    end
    errors
  end

  def copy_pending_items(from_period, to_period)
    pending = visible_shopping_list_items.where(period: from_period, purchased: false).order(:name, :id)

    ShoppingListItem.transaction do
      pending.filter_map do |item|
        already_there = visible_shopping_list_items.exists?(
          family_group_id: item.family_group_id, period: to_period, name: item.name
        )
        next if already_there

        item.family_group.shopping_list_items.create!(
          name: item.name, period: to_period, quantity: item.quantity,
          estimated_unit_price: item.estimated_unit_price, category_id: item.category_id
        )
      end
    end
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
