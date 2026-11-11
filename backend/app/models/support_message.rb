# Consulta que un usuario le manda al equipo desde el perfil. Se guarda para que el administrador
# la vea y se avisa por mail al equipo (ver SupportMailer).
class SupportMessage < ApplicationRecord
  MAX_PER_HOUR = 5

  belongs_to :user

  normalizes :subject, with: ->(value) { value.to_s.strip.squish }
  normalizes :message, with: ->(value) { value.to_s.strip }

  validates :subject, presence: true, length: { maximum: 120 }
  validates :message, presence: true, length: { maximum: 2000 }
  validate :not_too_many_recent, on: :create

  private

  # Freno simple contra el spam: se cuenta en la base porque el caché de la API no persiste.
  def not_too_many_recent
    return unless user

    recent = user.support_messages.where(created_at: 1.hour.ago..).count
    errors.add(:base, "Mandaste muchos mensajes seguidos. Probá de nuevo en un rato.") if recent >= MAX_PER_HOUR
  end
end
