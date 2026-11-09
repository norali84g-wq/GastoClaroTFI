require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Gastoclaro
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # rails-i18n trae todos los idiomas; cargamos solo los que usamos.
    config.i18n.available_locales = [ :en, :es ]

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # Argentina usa una sola hora (UTC-3, sin horario de verano). En Rails ese huso se llama
    # "Buenos Aires". Define qué día y mes es "hoy" (Date.current) para presupuestos, cuotas y
    # estadísticas. En la base las horas se guardan igual en UTC.
    config.time_zone = "Buenos Aires"
    # config.eager_load_paths << Rails.root.join("extras")
  end
end
