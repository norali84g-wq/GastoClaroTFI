# Un período es un mes con formato AAAA-MM ("2026-11"). Formato único para modelos, servicios y API.
module Period
  FORMAT = /\A\d{4}-(0[1-9]|1[0-2])\z/
  FORMAT_MESSAGE = "debe tener formato AAAA-MM".freeze

  def self.valid?(value)
    value.is_a?(String) && value.match?(FORMAT)
  end
end
