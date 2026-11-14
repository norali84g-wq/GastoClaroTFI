# GastoClaroTFI

**[🇪🇸 Español](#-español)** · **[🇬🇧 English](#-english)**

---

## 🇪🇸 Español

**Aplicación web progresiva (PWA) para el registro y análisis de gastos personales.**

Trabajo Final Integrador (TFI) — Tecnicatura Universitaria en Programación
UTN Facultad Regional La Plata · 2026 · **Grupo 4**

---

### ¿Qué es GastoClaro?

GastoClaro ayuda a saber **en qué se va la plata**. Parte de una premisa simple:

> **Ingreso = Consumo + Ahorro/Inversión**

El usuario arma un presupuesto mensual detallado, registra lo que realmente gasta y el sistema compara ambos: avisa cuando se está por pasar del presupuesto, pone en evidencia los gastos hormiga y muestra si un gasto subió por precio o por consumo. Como mejora a futuro, los informes podrán expresarse en **moneda constante** (ajustados por IPC), para comparar meses sin que la inflación distorsione los números.

### El problema

Cada vez más familias argentinas no llegan a pagar lo que deben:

- La mora de las familias con los bancos llegó al **12,9 %** en julio de 2026, la más alta en unos 20 años. *(BCRA)*
- En tarjetas de crédito es del **13,1 %** y en préstamos personales, del **15,9 %**. Hay **6,3 millones** de personas atrasadas en sus pagos.
- Tras una inflación de **211,4 %** en 2023 *(INDEC)*, en 2026 los salarios registrados siguen por debajo de los precios.
- El IPC se basa en una canasta de consumo de 2004-05: cada persona vive una **inflación distinta** según lo que compra.

Las planillas y los Excel se terminan abandonando, y las apps que circulan son globales: no están pensadas para la realidad económica del país.

**GastoClaro no es una app de gastos más.** Compara tu presupuesto con lo que realmente gastás, te muestra cuánto subió cada cosa que comprás por precio y cuánto por cantidad (base de tu **inflación personal**) y te avisa **antes** de que tengas que endeudarte.

👉 **[Conocé el análisis completo del problema y sus fuentes](docs/analisis-del-problema.md)**

### Funcionalidades

Lo que ya está implementado en esta entrega:

| Módulo | Qué hace |
|---|---|
| Usuarios | Registro, inicio de sesión y perfil. El administrador gestiona usuarios, los activa o desactiva y atiende los mensajes de soporte |
| Categorías | Rubros y subrubros personalizables. Se pueden desactivar conservando el historial |
| Gastos | Alta, edición y baja de gastos, con ítems (cantidad y precio unitario), comercio, gasto fijo y canal de compra. El panel de administración permite adjuntar la foto o el PDF del comprobante |
| Compras en cuotas | Se carga el total, la cantidad de cuotas y el interés; el sistema calcula cada cuota con interés, la reparte en su mes y muestra las pendientes |
| Mantenimiento de tarjeta | Monto fijo mensual, editable, que se suma una sola vez al total del mes de las cuotas |
| Ingresos | Registro de ingresos por período |
| Presupuesto y alertas | Presupuesto mensual por categoría, con alertas al 80 % y al 100 % y un consejo de educación financiera en cada alerta |
| Estadísticas | Totales y comparativas por categoría, subcategoría e ítem |
| Comparación mensual | Compara dos meses por categoría y producto y separa cuánto subió por precio y cuánto por cantidad |
| Lista de compras | Ítems planificados por mes con precio estimado, marcados como comprados y copia de los pendientes a otro mes |
| Gastos hormiga | Detección de compras chicas y repetidas que no estaban planificadas |
| Metas de ahorro | Monto y fecha objetivo, con seguimiento del progreso y mail de felicitación al cumplirlas |
| Soporte | Formulario de consultas, con aviso por mail al equipo |

### Trabajo futuro

Quedó fuera de esta entrega y se plantea como mejora:

| Mejora | Descripción |
|---|---|
| Recuperación de contraseña | Enlace de restablecimiento por mail con Action Mailer, manteniendo el inicio de sesión con JWT |
| Inicio de sesión con Google | Alternativa al registro con usuario y contraseña |
| Inflación personal | Un porcentaje propio de cada usuario, calculado con lo que realmente compra y comparado con el IPC oficial (INDEC) |
| Moneda constante | Mostrar los montos de distintos meses en pesos de hoy, ajustados por IPC, también por producto |
| Exportación | Resúmenes en CSV (se abre en Excel) y PDF |
| Regla 50/30/20 | Como consejo de ahorro para educación financiera |
| Moneda extranjera | Gastos en dólares con cotización editable |
| Carga por voz | Registro de consumos y de la lista de compras con asistente de voz |
| Analítica y monitoreo | Google Analytics y Sentry; despliegue público con HTTPS y validación de la instalación de la PWA |

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Ruby on Rails (modo API) — API REST versionada `/api/v1` |
| Frontend | React + Vite, distribuido como PWA |
| Base de datos | MySQL 8 |
| Autenticación | bcrypt + JWT (usuario) · sesión (back-office) |
| Archivos | Active Storage (local en desarrollo, Cloudinary en demo) |
| Testing | Minitest · Vitest |
| Calidad | RuboCop · Brakeman |
| Infraestructura | Docker (MySQL local) · Render / Railway (demo) |
| Gestión | GitHub (código, PRs) · Trello (tareas) |

### Estructura del repositorio

```
GastoClaroTFI/
├── backend/          # API Rails
├── frontend/         # App React (PWA)
├── docs/             # DER, wireframes, contrato de la API, informes
├── docker-compose.yml
└── README.md
```

### Cómo levantar el proyecto

#### Requisitos

- Ruby 3.4 y Bundler
- Node.js 20+ y npm
- Docker (para MySQL) o MySQL 8 instalado
- Git

#### 1. Clonar el repositorio

```bash
git clone https://github.com/norali84g-wq/GastoClaroTFI.git
cd GastoClaroTFI
```

#### 2. Levantar la base de datos

```bash
docker compose up -d db
```

#### 3. Backend

```bash
cd backend
bundle install                # con el MySQL de docker compose no hace falta configurar nada (ver backend/README.md)
bin/rails db:create db:migrate db:seed
bin/rails server              # http://localhost:3000
```

#### 4. Frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api/v1
npm run dev                   # http://localhost:5173
```

#### 5. Tests y calidad

```bash
# Backend
cd backend
bin/rails test
bin/rubocop
bin/brakeman

# Frontend
cd frontend
npm run test
```

### Forma de trabajo

#### Ramas

| Rama | Uso |
|---|---|
| `main` | Versión estable. Nadie trabaja directo acá: todo entra por Pull Request. |
| `feature/issue-<número>-<descripción>` | Una rama por funcionalidad, creada desde `main` (ej. `feature/issue-12-budget`) |
| `fix/issue-<número>-<descripción>` | Corrección de errores |

#### Flujo

1. Tomar una tarjeta en Trello (o un issue en GitHub) y moverla a **En curso**.
2. Crear la rama desde `main` actualizado:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/issue-12-budget
   ```
3. Hacer commits chicos y descriptivos.
4. Subir la rama y abrir un **Pull Request hacia `main`**:
   ```bash
   git push -u origin feature/issue-12-budget
   ```
5. **Otro integrante revisa y aprueba** antes de mergear. Nadie aprueba su propio PR.
6. Mergear, borrar la rama y mover la tarjeta a **Hecho**.

#### Mensajes de commit (en inglés)

Los **commits y los nombres de ramas se escriben en inglés**. Formato: `tipo: descripción corta`

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `docs` | Documentación |
| `test` | Tests |
| `refactor` | Mejora de código sin cambiar comportamiento |
| `chore` | Configuración, dependencias |

Ejemplos:
- `feat: add budget alert at 80%`
- `fix: correct installment split for 12-month purchases`
- `docs: update API contract for expenses`

### Antecedentes

El backend de GastoClaro se apoya en un desarrollo previo de la autora, realizado en la cursada de la TUP ([`norali84g-wq/gastoclaro`](https://github.com/norali84g-wq/gastoclaro)), que se adopta como base técnica del TFI y se amplía en este repositorio con presupuestos con alertas, informes por período, intereses en compras en cuotas y migración a MySQL. El frontend se construye a partir de [`ventureiranm/gastoClaro-front`](https://github.com/ventureiranm/gastoClaro-front). El historial de commits de este repositorio distingue la base incorporada del trabajo desarrollado para el TFI.

### Documentación

- Análisis del problema → [`docs/analisis-del-problema.md`](docs/analisis-del-problema.md)
- DER → `docs/der/`
- Wireframes → `docs/wireframes/`
- Contrato de la API (método, ruta, payload, respuesta) → `docs/api/`
- Tablero de tareas → [Trello](https://trello.com/b/XiNaTxy8/tif-gastoclaro)

### Equipo

| Integrante | Legajo | Rol |
|---|---|---|
| Gorosito Ledesma, Flavia Norali | 35586 | Líder técnica · Backend y base de datos |
| Zunino, Juan Carlos | 35414 | Frontend · Diseño UX |
| Ventureira, Nicolás Manuel | 35425 | Análisis funcional · Full stack |

**Tutor:** Ing. Sergio Antonini — Coordinador del TFI y Director de la carrera

---

UTN Facultad Regional La Plata · Tecnicatura Universitaria en Programación

### Ejecutar con Docker

Requisito: tener Docker con Compose instalado.

1. Copiar las variables de entorno y completarlas:
   ```bash
   cp .env.example .env
   ```
   `RAILS_MASTER_KEY` es la clave de `backend/config/master.key` (se la pedís al equipo; no se sube al repo).
2. Construir y levantar todo:
   ```bash
   docker compose up -d --build
   ```
3. Abrir la app en http://localhost:8080 (la API queda en http://localhost:3000 y MySQL en el puerto 3306).

Para apagar: `docker compose down` (los datos se conservan). Para borrar también los datos: `docker compose down -v`.

Los puertos 3000, 3306 y 8080 tienen que estar libres. Para ejecutar sin Docker, ver `backend/README.md` y `frontend/README.md`.

---

## 🇬🇧 English

**Progressive Web App (PWA) for tracking and analyzing personal expenses.**

Final Integrative Project (TFI) — Programming Technician Degree (TUP)
UTN Facultad Regional La Plata, Argentina · 2026 · **Group 4**

---

### What is GastoClaro?

GastoClaro helps people understand **where their money goes**. It is built on a simple premise:

> **Income = Consumption + Savings/Investment**

Users plan a detailed monthly budget, record what they actually spend, and the system compares both: it warns them before they exceed the budget, highlights small recurring expenses ("ant expenses"), and shows whether an expense increased because of price or because of consumption. As future work, reports will be able to be expressed in **constant currency** (adjusted by the national CPI), so months can be compared without inflation distorting the numbers.

### The problem

More and more Argentine households cannot keep up with their debts:

- Household loan delinquency reached **12.9%** in July 2026, the highest in about 20 years. *(Central Bank of Argentina)*
- It is **13.1%** on credit cards and **15.9%** on personal loans. **6.3 million** people are behind on their payments.
- After **211.4%** inflation in 2023 *(INDEC)*, registered wages are still below prices in 2026.
- The CPI is based on a 2004-05 consumption basket: each person experiences a **different inflation** depending on what they buy.

Spreadsheets end up abandoned, and the apps available are global: they are not designed for the country's economic reality.

**GastoClaro is not just another expense app.** It compares your budget with what you actually spend, shows how much each item you buy went up because of price and how much because of quantity (the basis of your **personal inflation**), and warns you **before** you need to borrow.

👉 **[Read the full problem analysis and its sources (in Spanish)](docs/analisis-del-problema.md)**

### Features

What is already implemented in this delivery:

| Module | What it does |
|---|---|
| Users | Sign up, log in and profile. The administrator manages users, activates or deactivates them and handles support messages |
| Categories | Customizable categories and subcategories. They can be deactivated while keeping their history |
| Expenses | Create, edit and delete expenses, with line items (quantity and unit price), store, fixed expense flag and purchase channel. The admin panel allows attaching a photo or PDF of the receipt |
| Installment purchases | Enter the total, number of installments and interest; the system computes each installment with interest, assigns it to its month and shows the remaining ones |
| Card maintenance fee | Fixed monthly amount, editable, added once to the month's installments total |
| Income | Income records per period |
| Budget and alerts | Monthly budget per category, with alerts at 80% and 100% and a financial education tip in each alert |
| Statistics | Totals and comparisons by category, subcategory and item |
| Monthly comparison | Compares two months by category and product and splits the change into price effect and quantity effect |
| Shopping list | Planned items per month with estimated price, marked as purchased, with pending items copied to another month |
| Ant expenses | Detection of small, repeated purchases that were not planned |
| Savings goals | Target amount and date, with progress tracking and a congratulation email when reached |
| Support | Contact form, with an email notice to the team |

### Future work

Left out of this delivery and planned as improvements:

| Improvement | Description |
|---|---|
| Password recovery | Reset link sent by email with Action Mailer, keeping JWT login |
| Sign in with Google | Alternative to username and password sign-up |
| Personal inflation | Each user's own percentage, computed from what they actually buy and compared with the official CPI (INDEC) |
| Constant currency | Show amounts from different months in today's pesos, adjusted by CPI, also per product |
| Export | Summaries in CSV (opens in Excel) and PDF |
| 50/30/20 rule | As a saving tip for financial education |
| Foreign currency | Expenses in US dollars with an editable exchange rate |
| Voice input | Recording expenses and the shopping list with a voice assistant |
| Analytics and monitoring | Google Analytics and Sentry; public deployment with HTTPS and PWA installation checks |

### Tech stack

| Layer | Technology |
|---|---|
| Backend | Ruby on Rails (API mode) — versioned REST API `/api/v1` |
| Frontend | React + Vite, delivered as a PWA |
| Database | MySQL 8 |
| Authentication | bcrypt + JWT (users) · session (back-office) |
| File storage | Active Storage (local in development, Cloudinary for the demo) |
| Testing | Minitest · Vitest |
| Code quality | RuboCop · Brakeman |
| Infrastructure | Docker (local MySQL) · Render / Railway (demo) |
| Project management | GitHub (code, PRs) · Trello (tasks) |

### Repository structure

```
GastoClaroTFI/
├── backend/          # Rails API
├── frontend/         # React app (PWA)
├── docs/             # ERD, wireframes, API contract, reports
├── docker-compose.yml
└── README.md
```

### Getting started

#### Requirements

- Ruby 3.4 and Bundler
- Node.js 20+ and npm
- Docker (for MySQL) or MySQL 8 installed locally
- Git

#### 1. Clone the repository

```bash
git clone https://github.com/norali84g-wq/GastoClaroTFI.git
cd GastoClaroTFI
```

#### 2. Start the database

```bash
docker compose up -d db
```

#### 3. Backend

```bash
cd backend
bundle install                # with the docker compose MySQL there is nothing to configure (see backend/README.md)
bin/rails db:create db:migrate db:seed
bin/rails server              # http://localhost:3000
```

#### 4. Frontend

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api/v1
npm run dev                   # http://localhost:5173
```

#### 5. Tests and code quality

```bash
# Backend
cd backend
bin/rails test
bin/rubocop
bin/brakeman

# Frontend
cd frontend
npm run test
```

### Workflow

#### Branches

| Branch | Purpose |
|---|---|
| `main` | Stable version. Nobody commits directly here: everything goes in through a Pull Request. |
| `feature/issue-<number>-<description>` | One branch per feature, created from `main` (e.g. `feature/issue-12-budget`) |
| `fix/issue-<number>-<description>` | Bug fixes |

#### Flow

1. Pick a card in Trello (or a GitHub issue) and move it to **In progress**.
2. Create the branch from an up-to-date `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/issue-12-budget
   ```
3. Make small, descriptive commits.
4. Push the branch and open a **Pull Request into `main`**:
   ```bash
   git push -u origin feature/issue-12-budget
   ```
5. **Another team member reviews and approves** before merging. Nobody approves their own PR.
6. Merge, delete the branch and move the card to **Done**.

#### Commit messages

**Commits and branch names are written in English.** Format: `type: short description`

| Type | Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `test` | Tests |
| `refactor` | Code improvement without changing behavior |
| `chore` | Configuration, dependencies |

Examples:
- `feat: add budget alert at 80%`
- `fix: correct installment split for 12-month purchases`
- `docs: update API contract for expenses`

### Background

The GastoClaro backend builds on a previous development by the author, carried out during the TUP program ([`norali84g-wq/gastoclaro`](https://github.com/norali84g-wq/gastoclaro)), adopted as the technical baseline of the TFI and extended in this repository with budgets with alerts, period reports, interest on installment purchases and migration to MySQL. The frontend is built from [`ventureiranm/gastoClaro-front`](https://github.com/ventureiranm/gastoClaro-front). This repository's commit history distinguishes the incorporated baseline from the work developed for the TFI.

### Documentation

- Problem analysis (Spanish) → [`docs/analisis-del-problema.md`](docs/analisis-del-problema.md)
- ERD → `docs/der/`
- Wireframes → `docs/wireframes/`
- API contract (method, route, payload, response) → `docs/api/`
- Task board → [Trello](https://trello.com/b/XiNaTxy8/tif-gastoclaro)

### Team

| Member | Student ID | Role |
|---|---|---|
| Gorosito Ledesma, Flavia Norali | 35586 | Technical lead · Backend and database |
| Zunino, Juan Carlos | 35414 | Frontend · UX design |
| Ventureira, Nicolás Manuel | 35425 | Functional analysis · Full stack |

**Advisor:** Ing. Sergio Antonini — TFI Coordinator and Program Director

---

UTN Facultad Regional La Plata · Tecnicatura Universitaria en Programación

### Run with Docker

Requirement: Docker with Compose installed.

1. Copy `.env.example` to `.env` and fill it in. `RAILS_MASTER_KEY` is the key in `backend/config/master.key` (ask the team; it is never committed).
2. Build and start everything with `docker compose up -d --build`.
3. Open the app at http://localhost:8080 (API at http://localhost:3000, MySQL on port 3306).

To stop: `docker compose down` (data is kept). To also delete the data: `docker compose down -v`.

Ports 3000, 3306 and 8080 must be free. To run without Docker, see `backend/README.md` and `frontend/README.md`.
