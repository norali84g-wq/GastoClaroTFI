# Requerimientos — Historias de usuario y requerimientos no funcionales

**Proyecto:** PWA de gestión de gastos personales
**Nombre de la aplicación:** GastoClaro
**Carrera:** Tecnicatura Universitaria en Programación — UTN FRLP
**Equipo:** Juan Zunino · Flavia Norali Gorosito Ledesma · Nicolás Manuel Ventureira
**Versión:** 2.0 — alcance reducido a uso personal y stack actualizado
**Fecha:** 20/10/2026
**Estado:** en revisión (PR abierto en la rama `docs/user-stories`)

---

## 1. Propósito de este documento

Este documento define **qué tiene que hacer el sistema** y **cómo se tiene que comportar**, antes de empezar a desarrollar. Es la fuente única para tres cosas:

1. Las tarjetas del tablero de Trello (una historia de usuario, una tarjeta).
2. El diseño de las pruebas (cada criterio de aceptación es un caso de prueba).
3. La sección de requerimientos del informe final.

Si algo no está acá, no está en el alcance. Si hay que agregarlo, se agrega acá primero y se versiona el documento.

### Cómo leerlo

- **HU-XX** — Historia de usuario. Describe una funcionalidad desde la perspectiva de quien la usa.
- **RNF-XX** — Requerimiento no funcional. Describe una cualidad del sistema (rendimiento, seguridad, usabilidad), no una función.
- **Criterios de aceptación** — Condiciones verificables. La historia está terminada cuando se cumplen todas.
- **Prioridad** — Alta, Media o Baja (ver sección 5).

> ⚠️ **La numeración cambió en la v2.0.** Al reducirse el alcance se renumeraron todas las historias y los módulos, de modo que quedan corridos y sin huecos. Un identificador de la v1.1 **no** apunta a la misma historia en esta versión. La tabla de equivalencia está al final de la sección 8: hay que usarla para actualizar las tarjetas de Trello, los casos de prueba y cualquier acta anterior que mencione un HU.

---

## 2. Alcance

### Qué incluye

Una aplicación web progresiva (PWA) instalable que permite a una persona registrar y analizar **sus propios** gastos e ingresos, incluyendo el seguimiento de consumos con tarjeta de crédito y compras en cuotas, presupuestos con alertas, metas de ahorro, informes por período y herramientas de análisis (gastos hormiga, regla 50/30/20 e inflación personal).

### Principio de diseño: mobile-first

La aplicación se piensa **primero para el celular**; tablet y escritorio se resuelven adaptando la misma interfaz (ver RNF-01 y RNF-02). Es lo que muestra la encuesta de relevamiento (10 respuestas anónimas): 6 personas la usarían desde el celular, 3 desde ambos dispositivos y 1 desde la PC. Es decir, 9 de 10 incluyen el celular.

### Qué no incluye (fuera de alcance)

- **Uso compartido entre varias personas.** La aplicación es de uso individual: no hay grupos familiares, cuentas compartidas ni gastos divididos entre miembros. Cada cuenta ve únicamente sus propios datos.
- Integración automática con bancos, billeteras virtuales o tarjetas (no se importan resúmenes ni se consultan saldos reales).
- Pagos reales: la aplicación registra, no ejecuta transacciones.
- Aplicaciones nativas para iOS o Android (la instalación se resuelve como PWA).
- Gestión de inversiones, préstamos otorgados o criptomonedas.
- Multi-moneda: todos los montos se registran en pesos argentinos (ARS).

### Restricciones técnicas

- **Back-end:** Ruby on Rails, exponiendo una API REST.
- **Front-end:** React, empaquetado como PWA instalable.
- **Base de datos:** MySQL.

---

## 3. Actores del sistema

| Actor | Descripción |
|---|---|
| **Visitante** | Persona sin cuenta. Solo puede registrarse o iniciar sesión. |
| **Usuario** | Persona con cuenta. Gestiona sus propios datos y sus propios registros. |

> El sistema **no tiene un rol de administrador**: no existe un back-office ni una cuenta con acceso a los datos de otras personas. Cada usuario administra únicamente lo suyo.

---

## 4. Glosario del dominio

Términos que se usan a lo largo del documento con un significado preciso.

| Término | Definición operativa |
|---|---|
| **Movimiento** | Un gasto o un ingreso. |
| **Gasto hormiga** | Gasto de monto bajo y frecuencia alta que individualmente parece irrelevante pero acumulado pesa. El umbral de monto es configurable por el usuario. |
| **Compra en cuotas** | Compra cuyo importe total se divide en N pagos mensuales. Cada cuota impacta el mes en que se paga, no el mes de la compra. |
| **Período de tarjeta** | Intervalo entre dos cierres consecutivos de una tarjeta. Determina en qué resumen cae cada consumo. |
| **Fecha de cierre** | Día del mes en que la tarjeta cierra el resumen. Un consumo posterior al cierre cae en el período siguiente. |
| **Regla 50/30/20** | Criterio de distribución del ingreso: 50 % necesidades, 30 % deseos, 20 % ahorro. |
| **Inflación personal** | Variación porcentual del gasto propio entre dos períodos, medida sobre la canasta real del usuario. No es el IPC general. |
| **Moneda constante** | Expresión de montos históricos ajustados por un índice de precios, para poder comparar períodos distintos sin que la inflación distorsione la lectura. |
| **Compromiso futuro** | Suma de las cuotas aún no pagadas que impactarán en meses siguientes. |

---

## 5. Criterio de priorización

| Prioridad | Significado |
|---|---|
| **Alta** | Sin esto el sistema no cumple su propósito. Forma parte del MVP y se desarrolla primero. |
| **Media** | Aporta valor diferencial. Se desarrolla una vez estable el MVP. |
| **Baja** | Mejora deseable. Entra si el cronograma lo permite. |

> ✅ **Ajustadas según la encuesta (v1.1).** Las prioridades de la v1.0 eran una propuesta del equipo basada en dependencias técnicas y en el núcleo funcional de la propuesta aprobada. En la v1.1 se contrastaron con los resultados de la encuesta de relevamiento (10 respuestas). El criterio aplicado y los cambios están en la sección 9. La v2.0 no modificó prioridades: solo retiró historias del alcance.

---

## 6. Historias de usuario

### M1 · Cuentas y acceso

---

#### HU-01 · Registro de usuario
**Prioridad:** Alta · **Actor:** Visitante

> Como visitante, quiero crear una cuenta con mi correo electrónico y una contraseña, para poder empezar a registrar mis movimientos.

**Criterios de aceptación**
- El formulario pide nombre, correo electrónico, contraseña y confirmación de contraseña.
- El correo electrónico debe tener formato válido y no estar registrado previamente; si lo está, el sistema lo informa sin revelar datos de la cuenta existente.
- La contraseña debe tener al menos 8 caracteres.
- La contraseña y su confirmación deben coincidir.
- Al registrarse correctamente, el usuario queda autenticado y accede a la pantalla principal.
- La cuenta nueva se crea con el conjunto de categorías predefinidas (HU-06).

---

#### HU-02 · Inicio de sesión
**Prioridad:** Alta · **Actor:** Visitante

> Como usuario registrado, quiero iniciar sesión con mi correo y contraseña, para acceder a mis datos.

**Criterios de aceptación**
- Con credenciales correctas, el sistema devuelve un token de sesión y redirige a la pantalla principal.
- Con credenciales incorrectas, muestra un mensaje genérico ("correo o contraseña incorrectos") sin indicar cuál de los dos falló.
- Tras 5 intentos fallidos consecutivos desde el mismo origen, el sistema bloquea nuevos intentos durante 5 minutos.
- La sesión permanece activa entre visitas mientras el token no haya expirado.

---

#### HU-03 · Cierre de sesión
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero cerrar sesión, para que nadie más pueda ver mis datos desde ese dispositivo.

**Criterios de aceptación**
- Al cerrar sesión, el token se invalida en el servidor.
- Cualquier pedido posterior con ese token es rechazado.
- Los datos almacenados localmente para el uso sin conexión se eliminan del dispositivo.

---

#### HU-04 · Recuperación de contraseña
**Prioridad:** Media · **Actor:** Visitante

> Como usuario que olvidó su contraseña, quiero recibir un enlace por correo para restablecerla, para recuperar el acceso a mi cuenta.

**Criterios de aceptación**
- El usuario ingresa su correo y el sistema responde siempre con el mismo mensaje, exista o no la cuenta.
- Si la cuenta existe, se envía un correo con un enlace de un solo uso.
- El enlace expira a las 2 horas de generado.
- Al restablecer la contraseña se invalidan todas las sesiones abiertas de esa cuenta.

---

#### HU-05 · Edición del perfil
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero editar mi nombre y cambiar mi contraseña, para mantener mis datos actualizados.

**Criterios de aceptación**
- El usuario puede modificar su nombre.
- Para cambiar la contraseña debe ingresar la contraseña actual.
- El correo electrónico no se puede modificar en esta versión (decisión registrada en la sección 9).

---

### M2 · Categorías

---

#### HU-06 · Categorías predefinidas
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario nuevo, quiero que el sistema ya traiga categorías cargadas, para poder empezar a registrar gastos sin configurar nada.

**Criterios de aceptación**
- Al crear la cuenta se cargan al menos: Alimentos, Transporte, Vivienda, Servicios, Salud, Educación, Ocio, Indumentaria, Otros.
- Cada categoría predefinida trae asignada una clasificación 50/30/20 por defecto (HU-45).
- El usuario puede editarlas o eliminarlas como cualquier categoría propia.

---

#### HU-07 · Alta de categoría propia
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero crear mis propias categorías, para clasificar los gastos según mi forma de organizarme.

**Criterios de aceptación**
- El alta pide nombre, color y clasificación 50/30/20.
- El nombre es obligatorio y no puede repetirse entre las categorías del usuario.
- Las categorías de un usuario no son visibles para ningún otro.

---

#### HU-08 · Edición y baja de categorías
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero editar o eliminar una categoría, para mantener mi clasificación ordenada.

**Criterios de aceptación**
- Se pueden modificar nombre, color y clasificación 50/30/20.
- Al eliminar una categoría que tiene movimientos asociados, el sistema advierte cuántos son y ofrece reasignarlos a otra categoría.
- Si el usuario no reasigna, los movimientos quedan sin categoría y aparecen marcados como "sin clasificar".

---

#### HU-09 · Subcategorías
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero agrupar categorías en subcategorías, para analizar con más detalle sin llenar la lista principal.

**Criterios de aceptación**
- Una categoría puede tener subcategorías; una subcategoría no puede tener subcategorías propias (un solo nivel de anidamiento).
- Los informes permiten ver los totales agrupados por categoría padre o desagregados por subcategoría.

---

#### HU-10 · Reordenamiento de categorías
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero ordenar las categorías que más uso al principio de la lista, para cargar gastos más rápido.

**Criterios de aceptación**
- El usuario puede fijar hasta 5 categorías como favoritas.
- Las favoritas aparecen primero en el formulario de carga rápida.

---

### M3 · Gastos e ingresos

---

#### HU-11 · Carga rápida de un gasto
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero cargar un gasto en pocos toques desde el celular, para registrarlo en el momento y no olvidármelo.

**Criterios de aceptación**
- El formulario mínimo requiere monto y categoría; la fecha viene precargada con el día de hoy.
- La descripción es opcional.
- El monto debe ser mayor a cero y admite hasta dos decimales.
- La operación completa se puede realizar en menos de 30 segundos (ver RNF-01).
- Al guardar, el gasto aparece inmediatamente en el listado de movimientos.

---

#### HU-12 · Carga de un gasto con todos sus datos
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero registrar un gasto indicando todos sus datos, para que los informes reflejen la realidad con precisión.

**Criterios de aceptación**
- Campos disponibles: monto, categoría, fecha, descripción, medio de pago (efectivo, débito, transferencia o tarjeta de crédito), nota y comprobante.
- Si el medio de pago es tarjeta de crédito, se debe elegir una tarjeta registrada (HU-19) y el gasto se imputa al período correspondiente (HU-21).
- La fecha no puede ser posterior al día de hoy.

---

#### HU-13 · Adjuntar comprobante
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero adjuntar la foto del ticket a un gasto, para poder consultarlo después sin guardar papeles.

**Criterios de aceptación**
- Se admiten archivos JPG, PNG y PDF de hasta 5 MB.
- Se puede tomar la foto directamente desde la cámara del dispositivo.
- El comprobante se puede ver y descargar desde el detalle del gasto.
- El comprobante se puede reemplazar o eliminar sin borrar el gasto.

---

#### HU-14 · Registro de un ingreso
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero registrar mis ingresos, para saber cuánto entra además de cuánto gasto.

**Criterios de aceptación**
- Campos: monto, fecha, descripción y origen (sueldo, honorarios, venta, otro).
- El monto debe ser mayor a cero.
- La fecha no puede ser posterior al día de hoy.

---

#### HU-15 · Movimientos recurrentes
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero marcar un gasto o un ingreso como recurrente, para no tener que cargarlo todos los meses.

**Criterios de aceptación**
- Al marcarlo como recurrente se indica la frecuencia (mensual, bimestral, trimestral o anual) y, opcionalmente, una fecha de fin.
- El sistema genera automáticamente el movimiento en cada período correspondiente.
- El movimiento generado se puede editar o eliminar individualmente sin afectar a la serie.
- El usuario puede dar de baja la recurrencia sin borrar los movimientos ya generados.

---

#### HU-16 · Listado y búsqueda de movimientos
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero ver y filtrar mis movimientos, para encontrar rápido lo que busco.

**Criterios de aceptación**
- El listado muestra fecha, descripción, categoría y monto, ordenado por fecha descendente.
- Filtros disponibles: rango de fechas, categoría, medio de pago, tipo (gasto o ingreso) y rango de monto.
- Búsqueda por texto sobre la descripción.
- El listado se pagina cada 50 registros.
- Se muestra el total de los movimientos que cumplen el filtro aplicado.

---

#### HU-17 · Edición y baja de un movimiento
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero corregir o eliminar un movimiento que cargué mal, para que mis números sean confiables.

**Criterios de aceptación**
- Se pueden modificar todos los campos del movimiento.
- La eliminación pide confirmación.
- Al modificar o eliminar un movimiento se recalculan los presupuestos, las metas de ahorro y los informes afectados.

---

#### HU-18 · Carga de un gasto sin conexión
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero cargar un gasto aunque no tenga señal, para no perder el registro cuando estoy en un lugar sin cobertura.

**Criterios de aceptación**
- Sin conexión, el formulario de carga sigue disponible y el gasto se guarda localmente.
- El movimiento pendiente de sincronizar aparece en el listado con una marca visible.
- Al recuperar la conexión, el sistema sincroniza automáticamente y quita la marca.
- Si la sincronización falla, el movimiento no se pierde y el sistema informa el error.

---

### M4 · Tarjetas de crédito

---

#### HU-19 · Alta de una tarjeta
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero registrar mis tarjetas de crédito, para poder imputar los consumos al resumen que corresponde.

**Criterios de aceptación**
- Campos: alias, banco o emisor, últimos cuatro dígitos (opcional), día de cierre, día de vencimiento y límite de compra (opcional).
- El día de cierre y el de vencimiento son números del 1 al 31.
- **El sistema no almacena el número completo de la tarjeta ni el código de seguridad.**

---

#### HU-20 · Edición y baja de una tarjeta
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero editar o dar de baja una tarjeta, para mantener actualizados mis medios de pago.

**Criterios de aceptación**
- Se pueden modificar todos los campos de la tarjeta.
- Una tarjeta con consumos asociados no se elimina: se marca como inactiva y deja de aparecer en el formulario de carga.
- Los consumos históricos de una tarjeta inactiva siguen visibles en los informes.

---

#### HU-21 · Imputación de un consumo al período correcto
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero que cada consumo con tarjeta caiga en el resumen que corresponde según la fecha de cierre, para saber cuánto voy a pagar realmente este mes.

**Criterios de aceptación**
- Un consumo con fecha anterior o igual al día de cierre se imputa al resumen del período en curso.
- Un consumo posterior al cierre se imputa al resumen del período siguiente.
- El sistema muestra, al cargar el consumo, en qué resumen va a caer.

---

#### HU-22 · Resumen de tarjeta
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero ver el resumen de cada tarjeta, para saber cuánto tengo que pagar y qué lo compone.

**Criterios de aceptación**
- El resumen muestra: período, fecha de vencimiento, total a pagar, consumos del período y cuotas que impactan en él.
- Se puede navegar a períodos anteriores y al siguiente.
- El total distingue consumos del período de cuotas de compras anteriores.

---

#### HU-23 · Marcar un resumen como pagado
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero marcar el resumen como pagado, para llevar el control de lo que ya saldé.

**Criterios de aceptación**
- Se registra la fecha de pago y el monto abonado.
- Si el monto abonado es menor al total, el resumen queda marcado como pago parcial y muestra el saldo pendiente.
- Un resumen pagado se distingue visualmente de uno pendiente.

---

#### HU-24 · Alerta de vencimiento de tarjeta
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero que me avise antes de que venza el pago de la tarjeta, para no pagar intereses por olvido.

**Criterios de aceptación**
- El sistema avisa 3 días antes del vencimiento de cada tarjeta con resumen impago.
- El aviso se muestra en la pantalla principal y, si el usuario lo habilitó, se envía por correo.
- La cantidad de días de anticipación es configurable por el usuario.
- Un resumen ya marcado como pagado no genera aviso.

---

### M5 · Compras en cuotas

---

#### HU-25 · Registro de una compra en cuotas
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero registrar una compra en cuotas una sola vez, para que el sistema me reparta el gasto en los meses que correspondan.

**Criterios de aceptación**
- Campos: descripción, monto total, cantidad de cuotas, fecha de compra, tarjeta y categoría.
- La cantidad de cuotas debe ser un entero mayor a 1.
- Al guardar, el sistema genera automáticamente las N cuotas con su monto y su mes de imputación.
- **Si el monto total no es divisible exactamente, la diferencia de redondeo se suma a la última cuota y el sistema lo informa.** La suma de las N cuotas debe ser siempre igual al monto total.
- La primera cuota se imputa según la fecha de cierre de la tarjeta (HU-21).

---

#### HU-26 · Seguimiento de cuotas pendientes
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero ver cuántas cuotas me faltan de cada compra, para saber cuándo me libero de ese pago.

**Criterios de aceptación**
- El listado muestra cada compra en cuotas con: descripción, monto total, cuota actual sobre total (por ejemplo, 3 de 12), monto de la cuota y mes de la última.
- Las compras ya canceladas se pueden consultar en un listado aparte.
- Desde la compra se accede al detalle de cada cuota y a su estado.

---

#### HU-27 · Compromiso futuro
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero ver cuánto ya tengo comprometido en los próximos meses, para no comprometerme de más al comprar algo nuevo.

**Criterios de aceptación**
- Se muestra el total comprometido por cada uno de los próximos 12 meses.
- El detalle de cada mes lista qué compras lo componen.
- El compromiso se muestra también como porcentaje del ingreso promedio mensual del usuario.

---

#### HU-28 · Baja o corrección de una compra en cuotas
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero corregir o eliminar una compra en cuotas que cargué mal, para que mis proyecciones no queden desfasadas.

**Criterios de aceptación**
- Al modificar el monto total o la cantidad de cuotas, el sistema recalcula las cuotas aún no pagadas y conserva las ya pagadas.
- Al eliminar la compra, se eliminan todas sus cuotas pendientes y el sistema advierte cuántas son.
- Las cuotas ya imputadas a resúmenes cerrados no se eliminan automáticamente: el sistema advierte y pide confirmación expresa.

---

#### HU-29 · Simulación de una compra en cuotas
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero simular una compra en cuotas antes de hacerla, para ver cómo me impactaría en los próximos meses.

**Criterios de aceptación**
- El usuario ingresa monto y cantidad de cuotas sin guardar nada.
- El sistema muestra el monto de la cuota y cómo quedaría el compromiso futuro de cada mes con esa compra incluida.
- La simulación no modifica ningún dato.

---

### M6 · Presupuestos y alertas

---

#### HU-30 · Definición de un presupuesto mensual general
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero fijar cuánto quiero gastar por mes en total, para tener una referencia contra la cual medirme.

**Criterios de aceptación**
- Se define un monto para un mes determinado.
- El monto debe ser mayor a cero.
- No puede haber más de un presupuesto general por mes.
- El presupuesto se puede copiar al mes siguiente con un solo paso.

---

#### HU-31 · Presupuesto por categoría
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero fijar un tope por categoría, para controlar los rubros en los que se me va la mano.

**Criterios de aceptación**
- Se puede definir un presupuesto por categoría para un mes determinado.
- No puede haber más de un presupuesto por combinación de categoría y mes.
- El sistema advierte si la suma de los presupuestos por categoría supera el presupuesto general.

---

#### HU-32 · Seguimiento del presupuesto
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero ver cuánto llevo gastado contra lo presupuestado, para saber si voy bien o mal antes de que termine el mes.

**Criterios de aceptación**
- Por cada presupuesto se muestra: monto presupuestado, gastado, disponible y porcentaje de uso.
- El indicador cambia de color al superar el 80 % y al superar el 100 %.
- Se muestra el ritmo de gasto: si al día de hoy el consumo proyectado al cierre del mes excede el presupuesto, el sistema lo señala.

---

#### HU-33 · Alertas de presupuesto
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero que me avise cuando estoy por pasarme del presupuesto, para poder frenar a tiempo.

**Criterios de aceptación**
- El sistema avisa al alcanzar el 80 % y al superar el 100 % de un presupuesto.
- El umbral de la primera alerta es configurable por el usuario.
- La alerta se muestra en la pantalla principal y al guardar el gasto que dispara el umbral.
- Cada alerta se emite una sola vez por presupuesto y por umbral alcanzado.

---

#### HU-34 · Historial de presupuestos
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero consultar cómo me fue con los presupuestos de meses anteriores, para fijar metas más realistas.

**Criterios de aceptación**
- Se puede consultar el resultado de cualquier mes anterior con presupuesto definido.
- Se muestra en cuántos de los últimos 6 meses se respetó el presupuesto.

---

### M7 · Gastos hormiga

---

#### HU-35 · Configuración del umbral
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero definir a partir de qué monto considero que un gasto es hormiga, para que el análisis se ajuste a mi realidad.

**Criterios de aceptación**
- El usuario define un monto umbral; por debajo de él, un gasto se considera hormiga.
- Existe un valor por defecto, modificable en cualquier momento.
- Al cambiar el umbral, los análisis se recalculan sobre todo el historial.

---

#### HU-36 · Análisis de gastos hormiga
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero ver cuánto se me va en gastos chicos, para tomar conciencia de lo que individualmente no parece nada.

**Criterios de aceptación**
- Se muestra, para el período seleccionado: cantidad de gastos hormiga, monto total y porcentaje que representan sobre el gasto total.
- Se listan los gastos hormiga agrupados por descripción similar, ordenados por monto acumulado.
- Se muestra la evolución del total de gastos hormiga en los últimos 6 meses.

---

#### HU-37 · Proyección de ahorro
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero ver cuánto ahorraría en un año si dejara de hacer un gasto hormiga recurrente, para evaluar si me conviene cambiarlo.

**Criterios de aceptación**
- Sobre un grupo de gastos hormiga recurrentes, el sistema proyecta el ahorro anual estimado.
- La proyección indica explícitamente que es una estimación basada en la frecuencia observada en los últimos 3 meses.

---

### M8 · Informes y estadísticas

---

#### HU-38 · Resumen de la pantalla principal
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero ver de un vistazo cómo vengo este mes, para saber si tengo que preocuparme sin ponerme a analizar nada.

**Criterios de aceptación**
- Muestra, para el mes en curso: total de gastos, total de ingresos, saldo disponible sobre el presupuesto y variación respecto del mes anterior.
- Muestra los últimos 5 movimientos.
- Muestra los próximos vencimientos de tarjeta dentro de los 15 días.
- Muestra las alertas de presupuesto activas.

---

#### HU-39 · Informe por categoría
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero ver en qué categorías se me va la plata, para saber dónde ajustar.

**Criterios de aceptación**
- Muestra el total por categoría para el período seleccionado, ordenado de mayor a menor.
- Cada categoría muestra su monto, su porcentaje sobre el total y su variación respecto del período anterior.
- Al seleccionar una categoría se accede al listado de sus movimientos.
- Incluye representación gráfica.

---

#### HU-40 · Período seleccionable
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero elegir el período que quiero analizar, para no estar limitado al mes calendario.

**Criterios de aceptación**
- Períodos predefinidos: mes en curso, mes anterior, últimos 3 meses, últimos 6 meses, año en curso.
- Además se puede indicar un rango de fechas personalizado.
- El período seleccionado se mantiene al navegar entre los distintos informes.

---

#### HU-41 · Gasto como porcentaje del ingreso
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero ver qué porcentaje de lo que gano se me va en cada categoría, para dimensionar mis gastos en relación con lo que entra.

**Criterios de aceptación**
- Se muestra el gasto total del período como porcentaje de los ingresos del mismo período.
- Se muestra el mismo porcentaje desagregado por categoría.
- Si no hay ingresos registrados en el período, el sistema lo informa en lugar de mostrar un porcentaje sin sentido.

---

#### HU-42 · Evolución mensual
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero ver cómo evolucionaron mis gastos mes a mes, para identificar tendencias.

**Criterios de aceptación**
- Muestra el total de gastos e ingresos de los últimos 12 meses.
- Se puede filtrar la evolución por una o varias categorías.
- Incluye representación gráfica.

---

#### HU-43 · Comparación de períodos
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero comparar dos períodos lado a lado, para entender qué cambió.

**Criterios de aceptación**
- El usuario elige dos períodos cualesquiera.
- Se muestran los totales de ambos y la diferencia absoluta y porcentual.
- Se muestra el detalle por categoría de ambos períodos.
- La comparación puede expresarse en moneda constante (HU-49).

---

#### HU-44 · Exportación de informes
**Prioridad:** Media · **Actor:** Usuario

> Como usuario, quiero exportar mis movimientos y mis informes, para guardarlos o trabajarlos por fuera del sistema.

**Criterios de aceptación**
- Se puede exportar el listado de movimientos del período en formato CSV.
- Se puede exportar el informe visible en formato PDF.
- El archivo exportado indica el período y la fecha de generación.

---

### M9 · Regla 50/30/20

> Prioridad ajustada en v1.1: HU-45 y HU-46 suben a **Alta**. La regla 50/30/20 quedó 4.ª en la encuesta (29 de 50 puntos), a solo 3 puntos del 3.° puesto. Ver sección 9.

---

#### HU-45 · Clasificación de categorías
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero clasificar cada categoría como necesidad, deseo o ahorro, para que el sistema pueda medir mi distribución.

**Criterios de aceptación**
- Cada categoría tiene exactamente una clasificación: Necesidad, Deseo o Ahorro.
- Las categorías predefinidas vienen con una clasificación sugerida, modificable.
- Una categoría sin clasificar se cuenta aparte y el sistema lo informa en el análisis.

---

#### HU-46 · Análisis de la distribución
**Prioridad:** Alta · **Actor:** Usuario

> Como usuario, quiero ver cómo se reparte mi plata entre necesidades, deseos y ahorro, para compararme con la regla 50/30/20.

**Criterios de aceptación**
- Muestra el porcentaje real de cada grupo sobre el ingreso del período y el porcentaje de referencia (50/30/20).
- Muestra la diferencia en puntos porcentuales entre lo real y la referencia.
- El ahorro se calcula como la diferencia entre el ingreso y el gasto total, más lo registrado explícitamente en categorías de ahorro.
- Si el período no tiene ingresos registrados, el análisis no se muestra y el sistema explica por qué.

---

#### HU-47 · Ajuste de los porcentajes de referencia
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero cambiar los porcentajes de referencia, para adaptar la regla a mi situación.

**Criterios de aceptación**
- El usuario puede modificar los tres porcentajes.
- La suma de los tres debe ser exactamente 100.
- Se puede restablecer la referencia original 50/30/20 en un paso.

---

### M10 · Inflación personal y moneda constante

> Prioridad ajustada en v1.1: HU-48, HU-49 y HU-50 bajan a **Baja**. La inflación personal quedó última en la encuesta (18 de 50 puntos, 11 menos que la 4.ª). Sigue en el alcance, pero se construye al final. Ver sección 9.

---

#### HU-48 · Cálculo de la inflación personal
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero saber cuánto aumentó mi propia canasta de gastos, para entender si gasto más porque consumo más o porque todo está más caro.

**Criterios de aceptación**
- Se calcula la variación porcentual del gasto entre dos períodos consecutivos para las categorías con gasto en ambos.
- Se muestra la variación general y la desagregada por categoría.
- Se muestra la comparación contra el índice de precios de referencia cargado en el sistema (HU-50).
- El cálculo indica explícitamente sobre qué categorías se hizo y cuáles quedaron excluidas por no tener gasto en ambos períodos.

---

#### HU-49 · Informes en moneda constante
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero poder ver los informes ajustados por inflación, para comparar períodos distintos sin que los números me engañen.

**Criterios de aceptación**
- **El ajuste es opcional y se activa o desactiva en cada informe mediante un control visible.** Es una decisión del usuario, no un comportamiento impuesto por el sistema.
- Con el ajuste activo, los montos históricos se expresan en pesos del período más reciente del informe.
- El informe indica con claridad que los valores están ajustados y contra qué índice y período base.
- Con el ajuste desactivado, los montos se muestran tal como fueron registrados.
- La preferencia del usuario se recuerda por tipo de informe.

---

#### HU-50 · Carga del índice de precios
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero que el sistema tenga cargado el índice de inflación, para que los ajustes se calculen sobre datos reales.

**Criterios de aceptación**
- El sistema almacena un índice mensual de precios con su período y su valor.
- El índice se puede cargar manualmente mes a mes.
- El sistema informa hasta qué mes tiene datos cargados.
- Si se solicita un informe ajustado para un período sin índice cargado, el sistema lo informa en lugar de estimar.

---

#### HU-51 · Evolución del gasto en moneda constante
**Prioridad:** Baja · **Actor:** Usuario

> Como usuario, quiero ver mi evolución de gastos ajustada por inflación, para saber si realmente gasto más que antes.

**Criterios de aceptación**
- La evolución mensual (HU-42) admite el modo de moneda constante.
- Se pueden superponer la serie nominal y la serie ajustada en un mismo gráfico.

---

### M11 · Metas de ahorro

> ⚠️ **Módulo pendiente de redacción.** Incorporado al alcance en la v2.0 a pedido del equipo. Las historias las aporta el equipo y se numerarán a partir de **HU-52**. Hasta entonces, este módulo no tiene historias ni criterios de aceptación, y sus tarjetas de Trello no se pueden crear.
>
> Al incorporarlas habrá que revisar además: HU-17 (recálculo de metas al editar un movimiento, ya previsto), HU-45 y HU-46 (relación entre el ahorro deducido de la regla 50/30/20 y el ahorro declarado en una meta) y los totales de la sección 8.

---

## 7. Requerimientos no funcionales

### Usabilidad

| ID | Requerimiento | Criterio de verificación | Prioridad |
|---|---|---|---|
| **RNF-01** | Cargar un gasto desde el celular debe tomar menos de 30 segundos, contados desde abrir la aplicación hasta confirmar el guardado. | Prueba cronometrada con 5 usuarios reales sobre un dispositivo móvil; al menos 4 deben lograrlo. | Alta |
| **RNF-02** | La interfaz debe estar diseñada para pantalla de celular en primer lugar y adaptarse a tablet y escritorio. | Verificación visual en anchos de 360, 768 y 1280 píxeles sin desbordes ni scroll horizontal. | Alta |
| **RNF-03** | Todos los textos, mensajes, formatos de fecha y de número deben estar en español de Argentina. | Fechas en formato dd/mm/aaaa; separador de miles con punto y decimal con coma. | Alta |
| **RNF-04** | Los mensajes de error deben indicar qué pasó y qué puede hacer el usuario, sin mostrar detalles técnicos. | Revisión de los mensajes de error de todos los formularios. | Media |
| **RNF-05** | Las áreas táctiles deben medir al menos 44 por 44 píxeles y el contraste de texto debe cumplir la relación 4.5:1. | Auditoría con herramienta de accesibilidad sobre las pantallas principales. | Media |

### Rendimiento

| ID | Requerimiento | Criterio de verificación | Prioridad |
|---|---|---|---|
| **RNF-06** | La pantalla principal debe cargar en menos de 3 segundos sobre una conexión 3G simulada. | Medición con herramientas de desarrollo del navegador. | Alta |
| **RNF-07** | El 95 % de las respuestas de la API debe resolverse en menos de 500 milisegundos, con una base de 10.000 movimientos. | Prueba de carga con datos generados. | Media |
| **RNF-08** | Los listados de movimientos deben paginarse y no cargar más de 50 registros por vez. | Revisión de los pedidos a la API. | Alta |

### Disponibilidad y funcionamiento sin conexión

| ID | Requerimiento | Criterio de verificación | Prioridad |
|---|---|---|---|
| **RNF-09** | La aplicación debe ser instalable como PWA en Android, iOS y escritorio. | Instalación efectiva en al menos un dispositivo de cada plataforma. | Alta |
| **RNF-10** | Sin conexión, la aplicación debe permitir consultar los datos ya descargados y cargar movimientos nuevos. | Prueba en modo avión. | Media |
| **RNF-11** | Los movimientos cargados sin conexión deben sincronizarse automáticamente al recuperarla, sin intervención del usuario y sin duplicarse. | Prueba de corte y restablecimiento de conexión con 3 movimientos pendientes. | Media |

### Seguridad

| ID | Requerimiento | Criterio de verificación | Prioridad |
|---|---|---|---|
| **RNF-12** | Cada usuario debe ver únicamente sus propios movimientos. Ningún endpoint debe devolver datos de otra cuenta. | Prueba de acceso cruzado: pedir con el token del usuario A un recurso del usuario B debe devolver 404. | Alta |
| **RNF-13** | Las contraseñas deben almacenarse con un algoritmo de hash de un solo sentido con sal (bcrypt). Nunca en texto plano ni cifradas de forma reversible. | Inspección de la tabla de usuarios. | Alta |
| **RNF-14** | La autenticación debe hacerse con un **token opaco guardado en una tabla de sesiones** del servidor, con fecha de expiración, enviado en el encabezado de autorización. No se usan tokens autocontenidos tipo JWT: la sesión debe poder revocarse del lado del servidor eliminando su registro. | Prueba con token vencido y prueba de revocación: tras cerrar sesión, el mismo token debe devolver 401. | Alta |
| **RNF-15** | Toda la comunicación entre el cliente y el servidor debe viajar sobre HTTPS. | Verificación del certificado en el entorno desplegado. | Alta |
| **RNF-16** | El sistema no debe almacenar números completos de tarjeta ni códigos de seguridad. | Revisión del modelo de datos. | Alta |
| **RNF-17** | Las entradas del usuario deben validarse en el servidor, independientemente de la validación del cliente. | Prueba enviando datos inválidos directamente a la API. | Alta |
| **RNF-18** | El tratamiento de datos personales debe ajustarse a la Ley 25.326 de Protección de los Datos Personales. | Revisión del documento de política de privacidad del sistema. | Media |

### Mantenibilidad y calidad

| ID | Requerimiento | Criterio de verificación | Prioridad |
|---|---|---|---|
| **RNF-19** | El back-end debe seguir la organización por capas de Rails: controladores delgados, modelos con las validaciones del dominio y objetos de servicio para la lógica de negocio que cruza varios modelos. Ningún controlador debe contener cálculos del dominio. | Revisión de la estructura del proyecto; los cálculos de presupuesto, cuotas e inflación deben vivir en objetos de servicio. | Alta |
| **RNF-20** | La lógica de negocio debe estar cubierta por pruebas automatizadas con una cobertura mínima del 70 %. | Informe de cobertura de la herramienta de pruebas. | Alta |
| **RNF-21** | La API debe estar documentada con OpenAPI y ser consultable desde una interfaz web. La especificación se genera a partir de las pruebas de la API, para que no se desactualice respecto del código. | Acceso a la documentación en el entorno desplegado y verificación de que se regenera al correr la suite de pruebas. | Media |
| **RNF-22** | Los montos deben almacenarse como **enteros en centavos**, nunca como punto flotante. La conversión a pesos se hace solo al mostrarlos. | Revisión del esquema de la base de datos: las columnas de monto deben ser enteras. | Alta |
| **RNF-23** | Todas las fechas deben manejarse en la zona horaria America/Argentina/Buenos_Aires. | Prueba de carga de un movimiento a las 23:30 y verificación de la fecha asignada. | Alta |
| **RNF-24** | El despliegue debe ser reproducible a partir del repositorio y su documentación, sin pasos manuales no documentados. | Un integrante que no desarrolló el módulo debe poder levantarlo siguiendo el README. | Media |

---

## 8. Matriz de historias

| ID | Historia | Módulo | Prioridad |
|---|---|---|---|
| HU-01 | Registro de usuario | M1 | Alta |
| HU-02 | Inicio de sesión | M1 | Alta |
| HU-03 | Cierre de sesión | M1 | Alta |
| HU-04 | Recuperación de contraseña | M1 | Media |
| HU-05 | Edición del perfil | M1 | Media |
| HU-06 | Categorías predefinidas | M2 | Alta |
| HU-07 | Alta de categoría propia | M2 | Alta |
| HU-08 | Edición y baja de categorías | M2 | Media |
| HU-09 | Subcategorías | M2 | Baja |
| HU-10 | Reordenamiento de categorías | M2 | Baja |
| HU-11 | Carga rápida de un gasto | M3 | Alta |
| HU-12 | Carga de un gasto con todos sus datos | M3 | Alta |
| HU-13 | Adjuntar comprobante | M3 | Media |
| HU-14 | Registro de un ingreso | M3 | Alta |
| HU-15 | Movimientos recurrentes | M3 | Media |
| HU-16 | Listado y búsqueda de movimientos | M3 | Alta |
| HU-17 | Edición y baja de un movimiento | M3 | Alta |
| HU-18 | Carga de un gasto sin conexión | M3 | Media |
| HU-19 | Alta de una tarjeta | M4 | Alta |
| HU-20 | Edición y baja de una tarjeta | M4 | Media |
| HU-21 | Imputación de un consumo al período correcto | M4 | Alta |
| HU-22 | Resumen de tarjeta | M4 | Alta |
| HU-23 | Marcar un resumen como pagado | M4 | Media |
| HU-24 | Alerta de vencimiento de tarjeta | M4 | Media |
| HU-25 | Registro de una compra en cuotas | M5 | Alta |
| HU-26 | Seguimiento de cuotas pendientes | M5 | Alta |
| HU-27 | Compromiso futuro | M5 | Media |
| HU-28 | Baja o corrección de una compra en cuotas | M5 | Media |
| HU-29 | Simulación de una compra en cuotas | M5 | Baja |
| HU-30 | Definición de un presupuesto mensual general | M6 | Alta |
| HU-31 | Presupuesto por categoría | M6 | Alta |
| HU-32 | Seguimiento del presupuesto | M6 | Alta |
| HU-33 | Alertas de presupuesto | M6 | Alta |
| HU-34 | Historial de presupuestos | M6 | Baja |
| HU-35 | Configuración del umbral de gasto hormiga | M7 | Media |
| HU-36 | Análisis de gastos hormiga | M7 | Media |
| HU-37 | Proyección de ahorro | M7 | Baja |
| HU-38 | Resumen de la pantalla principal | M8 | Alta |
| HU-39 | Informe por categoría | M8 | Alta |
| HU-40 | Período seleccionable | M8 | Alta |
| HU-41 | Gasto como porcentaje del ingreso | M8 | Alta |
| HU-42 | Evolución mensual | M8 | Media |
| HU-43 | Comparación de períodos | M8 | Media |
| HU-44 | Exportación de informes | M8 | Media |
| HU-45 | Clasificación de categorías 50/30/20 | M9 | Alta |
| HU-46 | Análisis de la distribución | M9 | Alta |
| HU-47 | Ajuste de los porcentajes de referencia | M9 | Baja |
| HU-48 | Cálculo de la inflación personal | M10 | Baja |
| HU-49 | Informes en moneda constante | M10 | Baja |
| HU-50 | Carga del índice de precios | M10 | Baja |
| HU-51 | Evolución del gasto en moneda constante | M10 | Baja |

**Totales:** 51 historias de usuario — 25 de prioridad alta, 16 de prioridad media, 10 de prioridad baja. 24 requerimientos no funcionales.

> Los totales **no incluyen** el módulo M11 (metas de ahorro), cuyas historias están pendientes de redacción. Hay que recalcular esta sección cuando se incorporen.

### Equivalencia con la versión 1.1

La v2.0 renumeró todo. Esta tabla permite rastrear cualquier referencia anterior.

| Módulo en la v2.0 | Era | Historias: v1.1 → v2.0 |
|---|---|---|
| M1 · Cuentas y acceso | M1 | HU-01 a HU-05 (sin cambios) |
| M2 · Categorías | M3 | HU-12 a HU-16 → HU-06 a HU-10 |
| M3 · Gastos e ingresos | M4 | HU-17 a HU-23 → HU-11 a HU-17 · HU-25 → HU-18 |
| M4 · Tarjetas de crédito | M5 | HU-26 a HU-31 → HU-19 a HU-24 |
| M5 · Compras en cuotas | M6 | HU-32 a HU-36 → HU-25 a HU-29 |
| M6 · Presupuestos y alertas | M7 | HU-37 a HU-41 → HU-30 a HU-34 |
| M7 · Gastos hormiga | M8 | HU-42 a HU-44 → HU-35 a HU-37 |
| M8 · Informes y estadísticas | M9 | HU-45 a HU-51 → HU-38 a HU-44 |
| M9 · Regla 50/30/20 | M10 | HU-52 a HU-54 → HU-45 a HU-47 |
| M10 · Inflación personal | M11 | HU-55 a HU-58 → HU-48 a HU-51 |
| M11 · Metas de ahorro | — | módulo nuevo, desde HU-52 |

**Historias retiradas del alcance en la v2.0.** Sus números de la v1.1 ahora corresponden a otras historias, así que no alcanza con borrar la tarjeta: hay que revisar toda referencia al número viejo.

| Era (v1.1) | Historia | Motivo |
|---|---|---|
| HU-06 a HU-11 | Módulo de grupo familiar: creación, invitación, aceptación, baja y salida de miembros, cambio de ámbito | La aplicación pasa a ser de uso individual. |
| HU-24 | Gasto compartido entre miembros | Requiere varios usuarios sobre el mismo gasto. |

---

## 9. Supuestos y decisiones pendientes

### Supuestos adoptados

1. **Cada cuota impacta el mes en que se paga**, no el mes de la compra. El informe de un mes refleja lo que efectivamente se desembolsa en ese mes.
2. **La diferencia de redondeo de una compra en cuotas va en la última cuota**, de modo que la suma de las cuotas siempre iguale el monto total.
3. **Un solo nivel de anidamiento** en las categorías: existen categorías y subcategorías, pero no sub-subcategorías.
4. **El ahorro de la regla 50/30/20 se deduce**: se calcula como ingreso menos gasto total, más lo registrado explícitamente en categorías de ahorro.
5. **Todos los montos se expresan en pesos argentinos.** No hay conversión de monedas.

### Decisiones pendientes

| # | Decisión | A resolver con |
|---|---|---|
| 1 | Historias del módulo M11 (metas de ahorro): las aporta el equipo. Hasta recibirlas, el módulo está declarado pero vacío. | Equipo |
| 2 | Origen del índice de precios: carga manual, archivo importable o consumo de una fuente externa. HU-50 asume carga manual como piso. | Equipo |
| 3 | Si el usuario puede cambiar su correo electrónico y cómo se valida el cambio (HU-05). | Equipo |
| 4 | Si las alertas se envían por correo electrónico, por notificaciones push, o ambas (HU-24, HU-33). Las notificaciones push en iOS tienen limitaciones en PWA. | Equipo |
| 5 | Política de retención: qué pasa con los datos de un usuario que elimina su cuenta. | Equipo y tutor |
| 6 | Transferencias de Mercado Pago: un encuestado las nombra como lo más difícil de controlar. La integración con billeteras virtuales está fuera de alcance; definir si se contempla alguna ayuda para cargarlas más rápido o si queda como trabajo futuro. | Equipo |

### Ajuste por la encuesta (aplicado en v1.1)

**Base:** encuesta anónima en Google Forms, 11 preguntas, 10 respuestas recibidas entre el 17 y el 18/10/2026. Es una muestra pequeña y no aleatoria (concentrada en personas de 25 a 34 años que trabajan en relación de dependencia), por lo que sirve para ordenar prioridades, no para generalizar.

**Resultado del ranking de funciones.** Cada persona ordenó las 5 funciones del 1.° al 5.° puesto; 5 puntos por cada 1.° puesto, 4 por cada 2.°, y así hasta 1 punto por cada 5.° (máximo posible: 50). Los cinco puntajes suman 150, que es el total repartible con 10 respuestas (10 × 15 puntos).

| Función | Historias | 1.° puesto | Puntaje | Prioridad resultante |
|---|---|---|---|---|
| Control de cuotas de tarjeta | M4 y M5 | 4 de 10 | 37 | Alta (sin cambios) |
| Presupuesto con alertas | M6 | 1 de 10 | 34 | Alta (sin cambios) |
| Informes por categoría | HU-39 a HU-41 | 2 de 10 | 32 | Alta (sin cambios) |
| Regla 50/30/20 | M9 | 2 de 10 | 29 | **Alta** (HU-45 y HU-46 suben de Media) |
| Inflación personal | M10 | 1 de 10 | 18 | **Baja** (HU-48, HU-49 y HU-50 bajan de Media) |

**Criterio aplicado**

1. Las cuatro funciones más valoradas (de 29 a 37 puntos) son prioridad Alta. La inflación personal queda claramente última (11 puntos por debajo de la cuarta) y pasa a Baja: sigue en el alcance, pero se construye al final.
2. Informes por categoría (32) y regla 50/30/20 (29) están casi empatadas: la diferencia es de 3 puntos con 10 respuestas, por lo que la encuesta no permite afirmar un orden entre ellas. Dentro de la prioridad Alta se construyen en este orden: control de cuotas, presupuesto con alertas, regla 50/30/20 e informes por categoría.
3. La encuesta no preguntó por las funciones de prioridad Baja que no figuran en el ranking (subcategorías, reordenamiento, simulación, historial de presupuestos, proyección de ahorro). Sin evidencia en contra, se mantienen en el alcance como Baja.
4. El resto de las prioridades no cambia: dependen de necesidades técnicas (cuentas, categorías, carga de movimientos) que sostienen a las funciones más valoradas.

**Otros datos de la encuesta que respaldan el diseño**

- 9 de 10 puntuaron con 4 o 5 su preocupación por no saber en qué se les va la plata (promedio 4,6 sobre 5).
- Nadie registra sus gastos con una app: 3 usan Excel, 3 papel o cuaderno, 1 las notas del celular y 3 no los registran. Esto respalda la carga rápida (HU-11 y RNF-01).
- 7 de 10 compran en cuotas con tarjeta, pero solo 5 de 10 saben el monto exacto que pagan por mes (respalda HU-22, HU-25 y HU-26).
- Solo 1 de 10 midió sus gastos hormiga y 2 de las 4 respuestas abiertas los nombran como lo más difícil de controlar (respalda M7).

---

## 10. Control de versiones del documento

| Versión | Fecha | Autor | Cambios |
|---|---|---|---|
| 1.0 | 17/10/2026 | Nicolás Ventureira | Versión inicial para revisión del equipo. |
| 1.1 | 19/10/2026 | Nicolás Ventureira | *(los identificadores de esta fila son los de la numeración vigente en la v1.1)* Prioridades ajustadas según la encuesta (10 respuestas): HU-52 y HU-53 suben a Alta; HU-55, HU-56 y HU-57 bajan a Baja. Se explicita el principio mobile-first. Se corrigen los totales de la sección 8 (decían 22 Media y 9 Baja). Nueva decisión pendiente (transferencias de Mercado Pago). |
| 2.0 | 20/10/2026 | Nicolás Ventureira | **Alcance reducido a uso individual:** se retiran las siete historias de grupo familiar y gasto compartido (HU-06 a HU-11 y HU-24 de la v1.1); se elimina el concepto de ámbito de todas las historias, del glosario y de los actores. **Renumeración completa** de historias y módulos, sin huecos: tabla de equivalencia al final de la sección 8. **Stack actualizado** a Ruby on Rails, React y MySQL: afecta las restricciones técnicas (sección 2) y RNF-14 (token en tabla de sesiones, no JWT), RNF-19 (capas de Rails), RNF-21 (OpenAPI generado desde las pruebas) y RNF-22 (montos en centavos). Se incorpora el módulo M11, metas de ahorro, pendiente de redacción. HU-25: el redondeo va en la última cuota. Nombre de la aplicación definido (GastoClaro): se cierra la decisión pendiente 1. Totales de la sección 8 recalculados: 51 historias. |
