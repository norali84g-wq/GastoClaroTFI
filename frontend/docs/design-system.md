# Sistema visual

Estilo natural y cálido: **verde bosque, beige, tarjetas blancas con esquinas redondeadas y
sombras suaves.** La profundidad la dan una sombra tenue (`--shadow-card`) y bordes claros; los
bordes oscuros quedan solo en los controles (campos y botones secundarios), para que se vean sobre
el fondo (contraste de 3:1). Los degradados son suaves: un tinte verde o durazno en las tarjetas de resumen y en las
metas, y los velos verdes que dejan leer el texto sobre una foto. Nada de sombras duras ni de
degradados llamativos.

Los estilos son CSS plano, sin librerías:

- `src/styles/tokens.css`: todos los valores (color, tipografía, espaciado, radios, bordes).
- `src/index.css`: base, componentes y pantallas. Importa los tokens.

## Reglas

1. **Ningún color escrito a mano** fuera de `tokens.css`. Si hace falta uno nuevo, se agrega ahí
   primero y se verifica el contraste (4.5:1 para texto). Excepción: los colores de las
   ilustraciones SVG y de los gráficos (`CHART_COLORS`, `GoalArt`, `Logo`), que son parte de la
   imagen y usan los mismos valores de la paleta.
2. **Sombra suave y degradados tenues.** Solo `--shadow-card`; los degradados usan los tintes de la
   paleta (`--color-tint-green`, `--color-tint-peach`) y nunca compiten con el texto.
3. **Monoespaciada** (`--font-mono`) para montos, fechas, cantidades y rutas de API. En tablas,
   `td.numeric` y `<time>` ya la aplican; en otro lugar, la clase `.mono`.
4. Montos **alineados a la derecha** (`.numeric`).
5. Medidas de espaciado en múltiplos de 4px: `--space-1` (4px) a `--space-12` (48px).
6. Controles de **40px** de alto como mínimo; en teléfono y pantallas táctiles, `--control-height`
   sube solo a 44px.
7. El foco se ve siempre (`:focus-visible`, 3px). No se le quita el `outline` a nada interactivo.
8. El color nunca es la única señal: un error lleva texto, un ítem activo cambia también el peso.
9. Animación solo en transiciones breves de hover y foco y en la entrada de las barras de los
   gráficos (700ms); con `prefers-reduced-motion` no hay ninguna.
10. Pantallas nuevas: se arman con los componentes de abajo y tienen que funcionar en 390px sin
    desplazamiento horizontal.

## Tokens

| Token                                         | Valor                         | Uso                                       |
| --------------------------------------------- | ----------------------------- | ----------------------------------------- |
| `--color-text`                                | `#202923`                     | Texto principal                           |
| `--color-text-muted`                          | `#59665F`                     | Texto secundario                          |
| `--color-primary`                             | `#1F5B4A`                     | Botones, ítem activo, enlaces, foco       |
| `--color-primary-hover`                       | `#174738`                     | Hover del verde                           |
| `--color-border` / `--color-border-soft`      | `#E3E5DF`                     | Bordes de tarjetas y separadores de filas |
| `--color-border-control`                      | `#6E8277`                     | Borde de campos y botones secundarios     |
| `--color-fill`                                | `#EAE9E1`                     | Relleno neutro, hover, deshabilitado      |
| `--color-subdued`                             | `#F1F4EE`                     | Código, estado vacío                      |
| `--color-bg`                                  | `#F5F3ED`                     | Fondo de la aplicación                    |
| `--color-surface`                             | `#FFFFFF`                     | Tarjetas y paneles                        |
| `--color-accent`                              | `#D99A32`                     | Dorado: detalles, consejo, lema           |
| `--color-green-soft` / `-mid` / `-sage`       | `#DCEBE2` `#3F7D68` `#789889` | Verdes de apoyo                           |
| `--color-success` / `--color-success-bg`      | `#247A4B` / `#E8F4EC`         | Estados correctos                         |
| `--color-warning-bg` / `--color-warning-text` | `#FFF2D8` / `#8A5700`         | Avisos                                    |
| `--color-error` / `--color-error-bg`          | `#B42318` / `#FDEAE8`         | Errores                                   |
| `--color-sidebar-*`                           | verde oscuro `#174738`        | Barra lateral y saludo de Inicio          |

Tipografía: **Fraunces** (`--font-display`) para los títulos (h1, h2), el saludo y la marca;
**Libre Franklin** (`--font-sans`) para todo el texto e **IBM Plex Mono** (`--font-mono`) para los
números. Vienen de los paquetes `@fontsource/fraunces`,
`@fontsource/libre-franklin` y `@fontsource/ibm-plex-mono`, que `src/main.jsx` importa solo con los pesos que se usan, así que
no dependen de internet.

| Token                 | Tamaño | Uso                                          |
| --------------------- | ------ | -------------------------------------------- |
| `--font-size-eyebrow` | 10.5px | Línea en versales, encabezados de tabla      |
| `--font-size-label`   | 12px   | Etiquetas de campo                           |
| `--font-size-small`   | 12.5px | Ayudas, errores de campo, líneas de contexto |
| `--font-size-body`    | 14px   | Texto                                        |
| `--font-size-section` | 16px   | Títulos de sección (h2)                      |
| `--font-size-title`   | 22px   | Título de pantalla (h1)                      |
| `--font-size-figure`  | 28px   | Número de las tarjetas de resumen            |

Formas: `--radius-control` 10px (botones, campos, etiquetas), `--radius-card` 16px (tarjetas y
paneles), `--radius-pill` 999px (píldoras y barras de avance). `--border-width` 1px. `--shadow-card`
para la sombra suave de tarjetas.

Imágenes: la foto del ingreso está en `public/images/login-hero.webp`; las de las metas y del cierre
de Inicio van en `public/images/goals/` y `public/images/banner.webp` (rutas en
`src/config/constants.js`). Si falta alguna, se muestra su ilustración SVG. Formato WebP, livianas.

## Componentes

En `src/components/ui/`:

| Componente         | Uso                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------- |
| `PageHeader`       | Encabezado de pantalla: `eyebrow` (línea en versales, opcional) y `title` (el h1).    |
| `Button`           | `variant`: `primary` (por defecto), `secondary` o `link`. `isLoading` lo deshabilita. |
| `FormField`        | Etiqueta arriba, campo, ayuda y error debajo. `as="select"`, `type="checkbox"`.       |
| `FormAlert`        | Aviso arriba de un formulario. `tone`: `error` (por defecto) o `warning`.             |
| `ErrorMessage`     | Uno o varios errores, anunciados a lectores de pantalla.                              |
| `LoadingIndicator` | Indicador de carga con texto.                                                         |
| `EmptyState`       | Estado vacío: zona apagada con título, descripción y acción opcional.                 |
| `Toast`            | Aviso flotante: confirmación (se cierra sola) o error (queda hasta cerrarlo).         |
| `ConfirmButton`    | Botón para lo que no se deshace (borrar): pregunta antes, con el foco en Cancelar.    |

Clases para lo que no tiene componente:

| Clase                                 | Qué es                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `.page` / `.page--narrow`             | Contenedor de pantalla; `--narrow` es una tarjeta centrada.                                     |
| `.panel`                              | Tarjeta o panel: blanco, borde claro, radio 16px y sombra suave.                                |
| `.eyebrow`                            | Línea chica en versales.                                                                        |
| `.data-table`                         | Tabla: encabezado en versales, filas con línea de 1px.                                          |
| `.data-table--stack` / `--stack-wide` | Tabla que se apila en tarjetas cuando no entra (ver abajo).                                     |
| `.free-text`                          | Celda con texto libre del usuario: una palabra larga sin espacios se parte en vez de desbordar. |
| `.numeric`, `.mono`, `.muted`         | Alineado a la derecha / monoespaciada / texto secundario.                                       |
| `.badge`                              | Etiqueta chica (por ejemplo, «Fijo»).                                                           |
| `.summary-totals`, `.summary-total`   | Tarjetas de resumen: rótulo, número grande y línea de contexto.                                 |
| `.pill-tabs`, `.pill`                 | Píldoras de pestañas; la activa se marca con `aria-selected`, `aria-current` o `aria-pressed`.  |
| `.dropzone` / `.dropzone--active`     | Zona de carga de archivos: borde punteado, contenido centrado.                                  |
| `.visually-hidden`                    | Oculto a la vista, presente para lectores de pantalla.                                          |
| `.form__actions`                      | Botones al pie de un formulario (guardar, cancelar), uno al lado del otro mientras entren.      |
| `.row-actions`                        | Botones de una fila de tabla (editar, borrar), a la derecha y siempre uno al lado del otro.     |
| `.item-list`, `.item-fields`          | Grupo de ítems de un formulario (`fieldset`) y el recuadro de cada ítem, con su `legend`.       |
| `.item-removed`                       | Ítem marcado para quitar: recuadro apagado con el aviso y el botón Deshacer.                    |

Un campo con `readOnly` (como el monto que es la suma de los ítems) se ve con fondo apagado, pero
sigue en el orden de Tab para que se pueda leer.

## Responsive

- **Navegación.** Con sesión iniciada, barra lateral desde 56rem (896px); por debajo, barra arriba
  con la marca y los ítems en una fila que se acomoda si no entra. Sin sesión, siempre barra arriba.
- **Panel.** Listado y alta en dos columnas desde 80rem (1280px); por debajo, uno debajo del otro.
  La tabla de gastos lleva la columna de acciones y por eso usa `.data-table--stack-wide`: en el
  listado angosto de dos columnas se apila en tarjetas.
- **Cuotas.** Listado arriba y formulario debajo en todos los anchos: la tabla tiene seis columnas
  de datos y necesita el ancho completo. Usa `.data-table--stack-wide`. La primera cuota va como
  `09/2026` (`formatShortPeriod`) y no como «septiembre de 2026»: con montos de nueve cifras, ese
  ancho es el que deja lugar a los botones de cada fila sin desbordar la tabla en 1280px.
- **Tablas.** Las que pueden no entrar llevan `.data-table--stack` (se apila con menos de 34rem
  disponibles) o `.data-table--stack-wide` (menos de 46rem, para tablas con muchas columnas
  numéricas). Cada fila pasa a ser una tarjeta; cada celda necesita `data-label` con el nombre de
  su columna, y si tiene más de un elemento, se envuelve en un `<span>`. El corte depende del ancho
  del contenedor (container queries), no de la ventana: la misma tabla funciona en el panel angosto y
  a lo ancho. La celda de texto libre (como la descripción de un gasto) lleva `.free-text`: sin
  eso, una palabra larga sin espacios ensancha la tabla y esconde las columnas de la derecha.
- **Tarjetas de resumen.** Se acomodan solas (`auto-fit`): tres por fila si entran, si no, menos.
- **Aviso flotante (`Toast`).** Abajo a la derecha; en pantallas angostas, a lo ancho. Mientras se
  ve, la página reserva su alto al final (`--toast-space`) y el navegador mantiene el foco por encima
  de él, así que nunca tapa un control: importa sobre todo con los errores, que no se cierran solos.
- **Teléfono (menos de 40rem).** Márgenes laterales de 16px, controles de 44px y campos en 16px
  (para que el teléfono no haga zoom al escribir).

## Cómo se verifica

Antes de dar por terminada una pantalla:

- **Anchos.** Recorrerla en 320, 390, 768, 1280 y 1440px, con datos largos (montos de nueve cifras,
  nombres de categoría largos, una descripción sin espacios): nada cortado y sin desplazamiento
  horizontal de la página ni de las tablas.
- **Teclado.** Recorrerla solo con Tab y Shift+Tab: el primer Tab llega a «Saltar al contenido»,
  cada enlace, botón y campo se alcanza en el orden en que se lee, y el foco siempre se ve. En los
  campos de fecha y mes, el segundo Tab va al botón del calendario, que el navegador marca con su
  propio recuadro.
- **Etiquetas.** Cada campo tiene su `label` visible (con `FormField` sale solo).

Las pruebas de `src/App.test.jsx` (grupo «Teclado») cubren el orden de Tab y las etiquetas.
