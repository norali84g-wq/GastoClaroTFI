# GastoClaro · Frontend · ZIP 2

Esta tanda incluye todo lo de la tanda 1, más presupuestos y alertas, medios de pago, selectores opcionales, resumen de presupuestos y PWA. El código vive en `src/`. La configuración y los textos de pantalla están separados de la lógica.

## Backend de referencia

Para implementar se leyeron las rutas, `docs/api/api.md` y `backend/swagger/v1/openapi.yaml` de `feature/medios-de-pago-cuotas`. Usá esa rama hasta que los PR #21 y #24 estén mergeados. Después verificá contra `main`. Anotá el commit de Rails con `git rev-parse HEAD`.

## Instalación y verificación

Requiere Node 22.13 o superior, npm y la API levantada. Copiá `.env.example` a `.env`. `VITE_API_URL` es la URL completa de la API, incluido `/api/v1`. El ejemplo apunta a Rails local. Reiniciá Vite o repetí el build al cambiarla.

```bash
npm ci
npm run lint
npm test
npm run build
npm run dev
```

Abrí `http://localhost:5173`. Rails debe autorizar ese origen vía `FRONTEND_URL`. Para revisar la salida de producción, cerrá Vite y corré `npm run preview -- --port 5173 --strictPort`. Si alojás la salida, configurá HTTPS, la URL de Rails en el build y la redirección de las rutas internas al `index.html`. El front espera estar en la raíz del dominio.

Las pruebas automáticas usan `node:test` y simulan las respuestas del cliente HTTP. La validación de la interfaz y de permisos se hace con Rails según el checklist. Para habilitar el pre-commit de este clon, ejecutá `npm run hooks:install` desde `frontend/`. Revisa la versión preparada de los archivos. Si el repo ya tiene un hook, integrá ambos antes de cambiar la configuración.

- [Instrucciones para Juan](INSTRUCCIONES-JUAN.md)
- [Checklist de Nico](CHECKLIST-NICO.md)
- [Texto del issue y del PR](GITHUB.md)
- [Resultado y supuestos](VERIFICACION.md)
