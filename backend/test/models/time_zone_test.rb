require "test_helper"

# Argentina usa una sola hora: UTC-3. Estos tests fijan que "hoy" y el mes se calculen con esa hora
# y no con UTC, que a la noche ya está en el día siguiente.
class TimeZoneTest < ActiveSupport::TestCase
  test "la zona horaria de la app es la de Argentina" do
    assert_equal "Buenos Aires", Time.zone.name
    assert_equal(-3 * 3600, Time.zone.utc_offset)
  end

  test "a las 23:30 del último día del mes, en Argentina todavía es ese mes" do
    # 02:30 UTC del 1/11 son las 23:30 del 31/10 en Buenos Aires.
    travel_to Time.utc(2026, 11, 1, 2, 30) do
      assert_equal Date.new(2026, 10, 31), Date.current
      assert_equal "2026-10", Date.current.strftime("%Y-%m")
    end
  end

  test "pasada la medianoche argentina ya es el mes siguiente" do
    # 03:30 UTC del 1/11 son las 00:30 del 1/11 en Buenos Aires.
    travel_to Time.utc(2026, 11, 1, 3, 30) do
      assert_equal Date.new(2026, 11, 1), Date.current
    end
  end
end
