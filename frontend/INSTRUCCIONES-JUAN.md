# Instrucciones para Juan

Esta tanda reemplaza la carpeta del ZIP 1 y conserva sus funciones. Si el PR del ZIP 1 sigue abierto, actualizá su rama y sumá un commit. Si todavía no abriste el PR, podés usar directamente esta tanda con el procedimiento desde `main`. Si el ZIP 1 ya se mergeó, partí del `main` actualizado en una rama de seguimiento, por ejemplo `feature/frontend-completion`. Evitá sobrescribir correcciones hechas después del ZIP 1. Compará las carpetas primero.

## 1. Preparar la rama

Abrí **Git Bash** en la raíz de `GastoClaroTFI`. Revisá que no haya cambios pendientes antes de cambiar de rama.

```bash
git status --short
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feature/frontend
```

Si la rama ya existe y corresponde a este PR, usá `git switch feature/frontend`. Si hay una carpeta `frontend/` con trabajo previo, revisá el contenido y guardá una copia antes de extraer.

## 2. Extraer el ZIP

En Windows, clic derecho sobre el ZIP → **Extraer todo**. Como destino elegí la carpeta raíz `GastoClaroTFI` y revisá que quede `GastoClaroTFI/frontend/package.json`. Si Windows agrega una carpeta con el nombre del ZIP, mové su carpeta `frontend/` al lugar indicado.

Alternativa en Git Bash, desde la raíz del repo. Ajustá el nombre del archivo a la tanda que descargaste.

```bash
unzip ~/Downloads/GastoClaro-frontend-ZIP2.zip -d .
cd frontend
cp .env.example .env
```

En PowerShell, el equivalente para la copia es `Copy-Item .env.example .env`. Abrí `.env` en el editor y confirmá la URL con `/api/v1` al final.

## 3. Levantar Rails y MySQL

Si el contrato ya está en `main`, usá esa versión de Rails. Si aún falta alguno de los dos PR, abrí otro checkout para el backend y conservá tu rama de front en la carpeta original. En Git Bash, desde la raíz:

```bash
git fetch origin
git worktree add --detach ../GastoClaroTFI-api origin/feature/medios-de-pago-cuotas
cd ../GastoClaroTFI-api
```

Si ya tenés ese checkout, reutilizalo y verificá su commit. En la raíz del checkout elegido, con Docker Desktop iniciado, seguí el [README de Rails](../backend/README.md). Con Ruby 3.4.10 y Bundler instalados:

```bash
docker compose up -d db
cd backend
bundle install
bundle exec rails db:create db:migrate db:seed
FRONTEND_URL=http://localhost:5173 bundle exec rails server
```

En PowerShell, seteá el origen con `$env:FRONTEND_URL = 'http://localhost:5173'` antes de levantar Rails. Si tu instalación de Ruby está en WSL, ejecutá ahí los comandos de Rails y usá el mismo checkout de backend. Si los seeds nuevos todavía no están, registrá una cuenta ficticia y pedile a Norali que cargue una categoría global con `tracks_installments: true` por el back-office o la consola.

## 4. Verificar el frontend

En una segunda terminal, entrá a `GastoClaroTFI/frontend`:

```bash
npm ci
npm run lint
npm test
npm run build
npm run hooks:install
npm run dev
```

Probá el recorrido del checklist. Guardá una captura o video con datos ficticios para el PR. Antes de compilar para otro entorno, revisá `VITE_API_URL` y el origen admitido por Rails.

## 5. Commit, push y PR

Desde la raíz del repo:

```bash
git status --short
git add -- frontend/
git update-index --chmod=+x frontend/.githooks/pre-commit
git diff --cached --stat
git diff --cached --name-only
git commit -m "feat: add the GastoClaro frontend"
git push -u origin feature/frontend
```

Revisá que el área preparada contenga solo archivos del front y que `.env`, `node_modules/`, `dist/` y el ZIP queden fuera. En GitHub, creá el issue y abrí el PR con base `main` usando [GITHUB.md](GITHUB.md). Reemplazá `N` por el número real y agregá a Nico como revisor. Si actualizás el mismo PR con el ZIP 2, usá `feat: add budgets payment methods and PWA support` y hacé push de la misma rama.

## Si algo falla

| Problema                              | Qué revisar                                                                                                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` falla                        | Revisá `node -v`, que estés en `frontend/`, el acceso al registro npm y que tengas el `package-lock.json` de esta tanda.                                               |
| Rails no arranca o no llega a MySQL   | Revisá `docker compose ps`, las variables de base y la salida de `db:migrate`. No borres volúmenes para resolverlo sin revisar qué contienen.                          |
| La API no conecta                     | Confirmá que Rails esté levantado, que la URL incluya `/api/v1` y que CORS permita el origen exacto de Vite.                                                           |
| Cuotas, medios o presupuestos dan 404 | Verificá el commit del backend, la rama de referencia y los PR #21 y #24. Si la ruta existe, verificá el usuario dueño del recurso.                                    |
| No aparecen categorías para cuotas    | Confirmá que el listado de categorías tenga al menos una con `tracks_installments: true`.                                                                              |
| Falla el hook                         | Revisá los archivos preparados, ejecutá `npm run format` en `frontend/` y volvé a preparar los archivos corregidos. Si ya hay hooks del repo, coordiná la integración. |
| GitHub rechaza el push                | Verificá tus permisos y el nombre de rama. Si hay cambios remotos, coordiná antes de actualizarla.                                                                     |
| La PWA no se ofrece para instalar     | En ZIP 2, probá el build servido en localhost o HTTPS y revisá manifest, service worker e iconos. La opción depende del navegador.                                     |
