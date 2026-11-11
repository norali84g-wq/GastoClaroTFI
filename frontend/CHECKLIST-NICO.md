# Checklist de Nico · ZIP 2

Anotá fecha, navegador, sistema operativo y commit de Rails. Marcá **pasa**, **falla** o **pendiente** por cada punto. Los casos de presupuestos, medios de pago y PWA se ejecutan desde ZIP 2.

## Instalación y pruebas

- [ ] Instalación limpia con `npm ci`. Confirmar que el PR incluye el lockfile.
- [ ] `npm run lint`, `npm test` y `npm run build` ejecutados. Registrar salidas.
- [ ] Ver las pruebas automatizadas de login, alta de consumo y pago de cuota.

## Recorrido con Rails real

- [ ] Desde Bienvenida, registrar una cuenta ficticia, ingresar, recargar, cerrar sesión y verificar que una ruta privada vuelva al login.
- [ ] Con esa cuenta, listar categorías globales, crear un consumo simple, encontrarlo por mes, editarlo y borrarlo. Verificar un consumo con ítems si hay datos y comprobar que se muestra su importe y no se ofrece edición.
- [ ] Crear otro consumo del mes y verificar que el total de Inicio se actualice.
- [ ] En cuotas, verificar que se ofrezcan únicamente categorías con `tracks_installments: true`. Crear una compra, abrir su detalle, pagar una cuota, recargar, volver a abrir el detalle y confirmar el estado.
- [ ] ZIP 2: crear, editar y borrar un medio de pago. Asociarlo a un consumo y a una compra. Probar también un consumo sin medio, quitar un medio de un consumo existente y revisar el efecto de borrar un medio asociado.
- [ ] ZIP 2: crear un presupuesto, registrar un gasto que alcance el umbral y verificar gastado, saldo, alerta y resumen del mismo período en Inicio.

## Errores y permisos

- [ ] Login incorrecto muestra el error. Registro duplicado muestra un error de Rails.
- [ ] Probar vencimiento de sesión. Para el camino de `401` también sirve revocar el token desde otro inicio de sesión de la misma cuenta y volver a consultar.
- [ ] Desde otra cuenta común, intentar consultar cuotas y enviar un PATCH a la compra/cuota ajena. Verificar que Rails rechace el pedido y que el estado de la cuota original no cambie.
- [ ] ZIP 2: duplicar un presupuesto de la misma categoría y mes y verificar el error.
- [ ] Interrumpir Rails y verificar aviso y reintento de consulta.

## Pantalla y PWA

- [ ] Escritorio, 390 px y zoom al 200 %. Revisar menú, labels, foco por teclado, botones y mensajes sin solapamientos ni desplazamiento horizontal de la página.
- [ ] ZIP 2: servir el build en localhost o HTTPS. Abrir una ruta interna al recargar.
- [ ] ZIP 2: manifest e iconos 192 y 512 presentes. Registrar el service worker, instalar en un navegador compatible y abrir la aplicación instalada.
- [ ] ZIP 2: después de usar la API, revisar Cache Storage y confirmar que solo hay archivos estáticos del frontend. Guardar evidencia con datos ficticios.

Adjuntar el resultado al PR antes de aprobar. Si hay fallas, incluir pasos de reproducción y resultado esperado.
