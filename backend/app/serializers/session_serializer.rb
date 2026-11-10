# Arma la respuesta de login y registro: el token, cuándo vence y los datos del usuario.
class SessionSerializer
  def self.call(user)
    expires_at = AuthToken::EXPIRATION.from_now
    {
      token: AuthToken.encode(user, expires_at),
      expires_at: expires_at.utc.iso8601, # siempre en UTC ("Z"), como dice el contrato de la API
      user: UserSerializer.call(user)
    }
  end
end
