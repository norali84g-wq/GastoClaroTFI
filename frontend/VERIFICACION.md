# Verificación y supuestos · ZIP 2

## Ejecutado en el entorno de preparación

- `npm ci` con caché local de npm, `npm run lint`, `npm test` y `npm run build`.
- 6 pruebas del cliente HTTP con respuestas simuladas.
- Manifest, service worker y archivos PNG de 192 y 512 comprobados en la salida del build.

## Pendiente contra Rails real y navegador

- Registro, sesión, logout, permisos de una cuota ajena, persistencia de consumos y pagos, y total mensual con MySQL y seeds reales.
- Comprobación visual a 390 px y con zoom al 200 %.
- Asociación y desasociación real de medios de pago, duplicados y disparo de alertas, e instalación y caché de PWA en navegador compatible.

## Supuestos del contrato

- `feature/medios-de-pago-cuotas` es la referencia hasta el merge de #21 y #24. El futuro cambio de `family_group` preserva las rutas y respuestas que usa el front.
- JWT y expiración llegan en `token` y `expires_at`. El registro devuelve una sesión. Rails envía los errores en `errors[]`.
- Las categorías son globales. Para compras en cuotas, el front exige `tracks_installments === true` y necesita al menos una categoría habilitada.
- El listado de consumos incluye `expense_items`; se bloquean edición y borrado de los consumos con ítems en este corte. El importe que se muestra es el que devuelve Rails.
- El total mensual usa `period` y `consumption` de `/dashboard`. La API devuelve montos en texto decimal. Los campos que se envían como montos son números.
- La bienvenida usa una ilustración SVG provisoria. Quedan por incorporar los originales de Figma que entregue Juan.
- Se envía `payment_method_id: null` al quitar una asociación. Los importes y alertas de presupuesto los calcula Rails. Los iconos PWA son provisorios.
