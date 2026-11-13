# Correo de bienvenida que se envía al registrarse. El diseño y las imágenes vienen del paquete
# "GastoClaro-mail-bienvenida-Rails".
class WelcomeMailer < ApplicationMailer
  # La plantilla ya es un HTML completo: sin el layout genérico no queda un <html> dentro de otro.
  layout false

  IMAGENES = Rails.root.join("app/assets/images/gastoclaro_email")
  ARCHIVOS_INLINE = %w[gastoclaro-portada.jpg gastoclaro-chanchito.png].freeze

  # Cómo quiere ser llamada la persona: el apodo si lo eligió y, si no, su nombre de pila.
  # Sin ninguno de los dos, la plantilla saluda con "¡Hola!".
  def self.nombre_para_saludar(user)
    apodo = user.user.to_s.strip
    apodo = nil if apodo.blank? || apodo.include?("@") # sin apodo, el usuario es su mail
    (apodo&.upcase_first || user.first_name.to_s.strip.presence)
  end

  def bienvenida(user)
    @nombre = self.class.nombre_para_saludar(user)

    # Las imágenes viajan dentro del correo (CID): Gmail no muestra imágenes de localhost ni base64.
    ARCHIVOS_INLINE.each do |archivo|
      attachments.inline[archivo] = File.binread(IMAGENES.join(archivo))
    end

    mail(to: user.email, subject: "Te damos la bienvenida a GastoClaro")
  end
end
