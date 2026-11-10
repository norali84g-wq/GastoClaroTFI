class User < ApplicationRecord
  PASSWORD_MIN_LENGTH = 8

  has_secure_password

  belongs_to :family_group
  has_many :expenses, dependent: :destroy
  has_many :incomes, dependent: :destroy
  has_many :budgets, dependent: :destroy
  has_many :payment_methods, dependent: :destroy

  normalizes :user, with: ->(value) { value.to_s.strip.downcase }
  # Un email vacío se guarda como NULL: el índice único de MySQL acepta varios NULL pero no varios ''.
  normalizes :email, with: ->(email) { email.strip.downcase.presence }

  normalizes :first_name, :last_name, with: ->(value) { value.to_s.strip.squish.presence }

  validates :user, presence: true, uniqueness: true
  validates :first_name, :last_name, length: { maximum: 60 }, allow_nil: true
  validate :birth_date_in_the_past
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: true, allow_blank: true
  validates :email, presence: true, on: :registration
  validates :password, length: { minimum: PASSWORD_MIN_LENGTH }, on: :registration
  validates :password_confirmation, presence: true, on: :registration

  # Invalida todos los tokens emitidos para este usuario (se usa en el logout).
  def revoke_tokens!
    increment!(:token_version)
  end

  private

  # La fecha de nacimiento es opcional, pero si viene tiene que ser pasada y razonable.
  def birth_date_in_the_past
    return if birth_date.blank?

    errors.add(:birth_date, "no es válida") if birth_date >= Date.current || birth_date.year < 1900
  end
end
