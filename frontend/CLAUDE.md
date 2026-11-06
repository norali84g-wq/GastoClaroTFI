# GastoClaro · front-end

Front-end en React (Vite) de una aplicación de gastos personales que consume una API REST en Rails
que vive en otro repositorio. Puesta en marcha, scripts y estructura en `README.md`.

## Reglas del proyecto

- `src/api/` solo habla con la API; `src/hooks/` decide de dónde sale el dato y maneja carga y
  error; `src/components/` no sabe de dónde viene el dato; `src/pages/` son las pantallas.
- `src/api/tokenStorage.js` es el único archivo que toca `localStorage` (ESLint lo hace cumplir).
- Ningún texto visible se escribe en un componente: todo sale de `src/locales/es.json`.
- Nada de números sueltos: los límites viven en `src/config/constants.js`.
- Ninguna URL ni clave en el código: van en `.env`.
- Las pruebas consultan por rol, etiqueta o texto, nunca por clase CSS.
- Antes de dar algo por terminado: `npm run lint`, `npm test` y `npm run build`.
- Commits en inglés con prefijo (`feat:`, `fix:`, `test:`, `style:`, `docs:`), nunca en `main`.

## Estilo visual

Toda pantalla sigue el sistema descrito en [`docs/design-system.md`](docs/design-system.md). Lo
mínimo:

- Colores, tipografías, espaciado, radios y bordes salen de `src/styles/tokens.css`. Ningún color
  escrito a mano en otro archivo; si hace falta uno nuevo, se agrega a los tokens primero.
- Nada de sombras ni degradados: bordes oscuros de 1.5px, radio 6px en controles y 8px en tarjetas.
- Montos, fechas, cantidades y rutas de API en monoespaciada; montos alineados a la derecha.
- Se usan los componentes de `src/components/ui/` (`PageHeader`, `Button`, `FormField`, …) y las
  clases documentadas antes de inventar estilos nuevos. Sin librerías de estilos.
- Foco siempre visible, controles de 40px (44px en táctil), y cada pantalla usable en 390px de
  ancho sin desplazamiento horizontal.
