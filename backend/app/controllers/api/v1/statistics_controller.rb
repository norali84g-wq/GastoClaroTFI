class Api::V1::StatisticsController < Api::V1::BaseController
  FIRST_YEAR = 2000

  # Estadísticas de un año (`?year=AAAA`, por defecto el actual) o de un mes de ese año
  # (`?month=1..12`, opcional): consumo, ahorro y gasto hormiga mes a mes, consumo por categoría y
  # detalle del gasto hormiga. Cada usuario ve las suyas; el admin, las de todos.
  def show
    year = parse_year
    return if performed?

    month = parse_month
    return if performed?

    render json: StatisticsReport.new(
      year: year, month: month, incomes: visible_incomes, expenses: visible_expenses,
      shopping_items: visible_shopping_list_items
    ).as_json
  end

  # Compara dos meses (`?from=AAAA-MM&to=AAAA-MM`; por defecto el mes actual contra el anterior):
  # diferencia por categoría y por producto, separando lo que se debe al precio y a la cantidad.
  def monthly_comparison
    to_period = params[:to].to_s.presence || Date.current.strftime("%Y-%m")
    from_period = params[:from].to_s.presence || (previous_period(to_period) if Period.valid?(to_period))
    errors = comparison_errors(from_period, to_period)
    return render json: { errors: errors }, status: :unprocessable_entity if errors.any?

    render json: MonthlyComparison.new(
      from_period: from_period, to_period: to_period, expenses: visible_expenses
    ).as_json
  end

  private

  # Informa juntos los errores de los dos meses. Si `to` es inválido y `from` no vino, `from` no se
  # puede calcular: solo se informa `to`.
  def comparison_errors(from_period, to_period)
    errors = []
    errors << { field: "from", message: api_t("invalid_period") } if from_period && !Period.valid?(from_period)
    errors << { field: "to", message: api_t("invalid_period") } unless Period.valid?(to_period)
    if errors.empty? && from_period == to_period
      errors << { field: "to", message: "debe ser distinto de from" }
    end
    errors
  end

  def previous_period(period)
    Date.strptime("#{period}-01", "%Y-%m-%d").prev_month.strftime("%Y-%m")
  end

  def parse_year
    return Date.current.year if params[:year].blank?

    year = Integer(params[:year].to_s, 10, exception: false)
    return year if year && year.between?(FIRST_YEAR, Date.current.year)

    render_error(api_t("invalid_year"), status: :unprocessable_entity, field: "year")
    nil
  end

  def parse_month
    return nil if params[:month].blank?

    month = Integer(params[:month].to_s, 10, exception: false)
    return month if month && month.between?(1, 12)

    render_error(api_t("invalid_month"), status: :unprocessable_entity, field: "month")
    nil
  end
end
