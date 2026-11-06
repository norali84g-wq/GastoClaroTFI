# GastoClaro · front-end

Front-end de GastoClaro (TP de Programación IV): aplicación de gastos personales que consume la
API REST en Ruby on Rails, que vive en otro repositorio.

## Sobre el proyecto

- **Trabajo:** TP2 de Programación IV (Tecnicatura Universitaria en Programación): integración de un back-end Rails con un front-end propio.
- **Temática:** gestión de gastos personales (ingresos, gastos con detalle por ítem y resumen mensual).
- **Integrantes:** Nico Ventureira y Norali Gorosito. **Modalidad:** grupal.
- **Autoría del back-end original:** Norali Gorosito (TP1 individual, evolucionado en este TP2).
- **Framework del front-end:** React 19, con Vite.
- **Back-end:** [norali84g-wq/gastoclaro](https://github.com/norali84g-wq/gastoclaro) (Ruby on Rails).
- **Contrato de la API:** [`api.md`](https://github.com/norali84g-wq/gastoclaro/blob/main/api.md), en el repositorio del back-end.

## Requisitos

- Node.js 22.22 o superior (probado con Node 24). Con `nvm use` se toma la versión de `.nvmrc`.

## Puesta en marcha

Para usar la aplicación hace falta tener el back-end corriendo en `http://localhost:3000` (instalación y ejecución en el README del back-end: `bin/rails db:setup` y `bin/rails server`). El back acepta pedidos desde `http://localhost:5173`, que es donde corre este front.

```bash
npm install
cp .env.example .env   # ajustá VITE_API_URL si tu API corre en otra dirección
npm run dev            # http://localhost:5173 (falla si el puerto está ocupado)
```

## Datos de prueba y credenciales de demostración

Con el back-end levantado y su base cargada (`bin/rails db:setup`, o `bin/rails db:seed` si ya existe), se puede entrar con:

| Usuario | Contraseña |
| ------- | ---------- |
| `demo`  | `demo1234` |

Es un usuario de demostración con ingresos y gastos de ejemplo, para que el panel muestre datos. No es una cuenta real, y el back-end solo lo crea fuera de producción. También se puede crear una cuenta nueva desde la pantalla de registro.

## Scripts

| Script                 | Qué hace                                   |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Servidor de desarrollo en el puerto 5173   |
| `npm run build`        | Build de producción en `dist/`             |
| `npm run lint`         | ESLint sin tolerar advertencias            |
| `npm run format`       | Formatea todo con Prettier                 |
| `npm run format:check` | Verifica el formato sin modificar archivos |
| `npm test`             | Corre las pruebas una vez (Vitest)         |
| `npm run test:watch`   | Pruebas en modo observación                |

Antes de cada commit, Husky corre lint-staged: ESLint y Prettier sobre los archivos en stage.

Las pruebas (`npm test`) usan respuestas simuladas de la API, así que no necesitan el back-end corriendo. La demostración sí usa la API real.

## Estructura

```
src/
  api/          solo habla con la API, no sabe nada de React
  hooks/        decide de dónde sale el dato y maneja los estados de carga y error
  pages/        las pantallas
  components/   componentes reutilizables; no saben de dónde viene el dato
  config/       constantes con nombre
  validation/   validaciones de formularios que no necesitan al servidor
  utils/        formato para mostrar (montos, fechas) y manejo de fechas, sin React
  locales/      todos los textos
  styles/       tokens del sistema visual (ver docs/design-system.md)
```

Reglas del proyecto:

- `src/api/tokenStorage.js` es el único archivo que toca `localStorage` (ESLint lo hace cumplir).
- Ningún texto visible se escribe en un componente: todo sale de `src/locales/es.json`.
- Nada de números sueltos: los límites viven en `src/config/constants.js`.
- Ninguna URL ni clave en el código: van en `.env` (que no se sube).
