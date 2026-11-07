# GastoClaro — Backend

API REST y back-office de **GastoClaro**, una aplicación para registrar y analizar gastos personales: ingresos, gastos con detalle de productos, compras en cuotas, lista de compras, metas de ahorro y estadísticas. Es el back-end del Trabajo Final Integrador (TFI) de la Tecnicatura Universitaria en Programación, UTN Facultad Regional La Plata (Grupo 4).

**Stack:** Ruby 3.4.10, Rails 8.1, MySQL 8 (en Docker), Puma, Hotwire (Turbo + Stimulus) e importmap para el back-office.

## Sobre el proyecto

- **Trabajo:** TFI de la Tecnicatura Universitaria en Programación (UTN FRLP).
- **Integrantes:** Gorosito Ledesma Flavia Norali (back-end y base de datos), Zunino Juan Carlos (front-end) y Ventureira Nicolás Manuel (análisis funcional y QA).
- **Tutor:** Ing. Sergio Antonini.
- **Front-end:** React. Se documenta en el [README de la raíz](../README.md).
- **Contrato de la API:** [`docs/api/api.md`](../docs/api/api.md).

## Índice

1. [Requisitos e instalación](#requisitos-e-instalación)
2. [Datos de prueba](#datos-de-prueba)
3. [Back-office](#back-office-panel-de-administración)
4. [API v1](#api-v1)
5. [Modelo de datos](#modelo-de-datos)
6. [Calidad y tests](#calidad-y-tests)
7. [Evolución futura](#evolución-futura)

## Requisitos e instalación

**Requisitos:** Git, Docker y [mise](https://mise.jdx.dev/) para manejar la versión de Ruby (el proyecto declara `ruby-3.4.10` en `.ruby-version`).

```bash
git clone https://github.com/norali84g-wq/GastoClaroTFI.git
cd GastoClaroTFI

docker compose up -d db          # levanta MySQL 8 (contenedor gastoclaro_db)

cd backend
mise install ruby@3.4.10         # instala la versión de Ruby del proyecto
bundle install                   # instala las gemas
cp .env.example .env             # variables de conexión a la base
bin/rails db:create db:migrate db:seed
bin/rails server                 # http://localhost:3000
```

Si `ruby -v` no muestra 3.4.10, ejecutá los comandos con `mise exec -- <comando>` o activá mise en tu shell (`eval "$(mise activate bash)"`).

**Variables de entorno** (`backend/.env`, plantilla en `.env.example`):

| Variable | Para qué sirve |
|----------|----------------|
| `DB_HOST`, `DB_PORT` | Dónde está MySQL (por defecto `127.0.0.1:3306`) |
| `DB_USERNAME`, `DB_PASSWORD` | Usuario y contraseña de la base (coinciden con `docker-compose.yml`) |
| `DB_NAME`, `DB_NAME_TEST` | Base de desarrollo y base de tests |
| `FRONTEND_URL` | Origen (o lista separada por comas) desde el que el front puede llamar a la API (CORS). Si el front corre en otro puerto: `FRONTEND_URL=http://localhost:5174 bin/rails server` |

**Antes de desplegar:** en `config/deploy.yml` la variable `FRONTEND_URL` está comentada. Hay que descomentarla y poner la URL real del front.

## Datos de prueba

`bin/rails db:seed` carga los datos de `db/seeds.rb` y se puede correr más de una vez sin duplicar nada.

| Usuario | Contraseña | Qué es |
|---------|------------|--------|
| `admin` | `admin1234` | Administrador. Entra al back-office y a la API. |
| `demo` | `demo1234` | Usuario común de demostración, con ingresos y gastos de ejemplo. Solo se crea fuera de producción. |

> **Solo para desarrollo.** Estas credenciales están en el repositorio y no son de cuentas reales. Cambiá las contraseñas o eliminá los usuarios antes de publicar.

## Back-office (panel de administración)

- **URL:** <http://localhost:3000/admin/login>
- **Acceso:** solo usuarios con el flag `admin` (por ejemplo `admin` / `admin1234`).
- **Secciones** (rutas bajo `/admin`): panel principal, gastos, ingresos, categorías, compras en cuotas, comercios, metas de ahorro, usuarios, lista de compras, ahorro y estadísticas.

## API v1

La API usa JSON y todas sus rutas cuelgan de `/api/v1`. **El contrato completo está en [`docs/api/api.md`](../docs/api/api.md)**; ahí están las rutas, campos, validaciones, permisos y errores. Este README no lo repite para que no queden dos versiones.

Lo básico:

1. `POST /api/v1/login` con `user` y `password` devuelve un `token` (JWT) y cuándo vence. En cada pedido protegido se envía `Authorization: Bearer <TOKEN>`. El token dura 24 horas y `DELETE /api/v1/logout` lo invalida antes.
2. Cada usuario ve solo sus propios gastos e ingresos. El administrador ve los de todos.
3. Los errores tienen siempre la misma forma: `{ "errors": [ { "field": "...", "message": "..." } ] }`.

Endpoints destacados de las últimas funciones:

- `GET /api/v1/statistics/monthly_comparison`: compara dos meses por categoría y producto, separando el efecto del precio y el de la cantidad.
- `GET /api/v1/shopping_list_items?status=pending|purchased` y `POST /api/v1/shopping_list_items/copy`: lista de compras con ítems comprados y copia de los pendientes al mes siguiente.
- `GET /api/v1/installment_purchases/monthly_total`: total de un mes (cuotas con interés más el mantenimiento mensual de la tarjeta, que se suma una sola vez).
- `GET` y `PATCH /api/v1/installment_settings`: mantenimiento mensual de la tarjeta (valor del grupo, editable).

### Documentación interactiva (Swagger UI)

Con el servidor levantado, abrí <http://localhost:3000/api-docs>. Para probar un endpoint protegido: ejecutá `POST /login`, copiá el `token`, tocá **Authorize** y pegalo (sin escribir `Bearer`). La especificación está en [`swagger/v1/openapi.yaml`](swagger/v1/openapi.yaml) y el test `test/docs/openapi_spec_test.rb` avisa si una ruta de la API no está documentada.

## Modelo de datos

Un **grupo familiar** (`FamilyGroup`) agrupa usuarios, metas de ahorro, compras en cuotas y la lista de compras. Los gastos e ingresos pertenecen a cada usuario.

```
FamilyGroup ──< User ──< Income
     │            └────< Expense >── Category (con padre/subcategorías)
     │                    │  └────── Vendor (opcional)
     │                    └──< ExpenseItem
     ├──< SavingsGoal
     ├──< InstallmentPurchase >── Category, Vendor (opcional)
     └──< ShoppingListItem >── Category

FinancialTip, ReferenceIndex: tablas independientes.
```

| Modelo | Qué representa |
|--------|----------------|
| `FamilyGroup` | Grupo familiar, con su porcentaje de ahorro objetivo y el mantenimiento mensual de la tarjeta (`card_monthly_fee`) |
| `User` | Usuario del grupo, con contraseña, `token_version` para invalidar tokens y flag `admin` |
| `Income` | Ingreso de un usuario |
| `Expense` | Gasto con categoría, comercio opcional, canal de compra, indicador de gasto fijo y comprobante adjunto |
| `ExpenseItem` | Producto de un gasto: nombre, cantidad, unidad y precio unitario |
| `Category` | Categoría de gasto, con padre opcional |
| `Vendor` | Comercio donde se compra |
| `SavingsGoal` | Meta de ahorro: monto objetivo, ahorrado y fecha límite |
| `InstallmentPurchase` | Compra en cuotas (1 a 48) con interés total en %: calcula el total con interés, la cuota, los períodos y las cuotas restantes |
| `ShoppingListItem` | Ítem de la lista de compras de un mes, con precio estimado y estado comprado |
| `FinancialTip` | Consejo financiero |
| `ReferenceIndex` | Índice de referencia (nombre, período y valor) |

## Calidad y tests

```bash
bin/rails test      # pruebas automatizadas
bin/rubocop         # estilo del código
bin/brakeman        # análisis de seguridad
```

Las pruebas cubren los endpoints de la API v1, los modelos, parte del back-office y los mailers. No hay tests de sistema (navegador).

## Evolución futura

Ideas planeadas que **no están implementadas**:

- **Lectura automática de tickets (OCR):** sacar una foto del comprobante y cargar solo el comercio, la fecha y los ítems.
- **Comparación de precios entre comercios:** con el precio por ítem y el comercio de cada compra, comparar el mismo producto en distintos lugares.
- **Carga de gastos por chat:** registrar un gasto escribiendo un mensaje en lenguaje natural.
- **Tarjetas de crédito:** intereses cuando se financia el resumen.
