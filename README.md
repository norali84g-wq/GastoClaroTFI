# GastoClaroTIF

🇪🇸 Español · [🇬🇧 English](README.en.md)

**Aplicación web progresiva (PWA) para el registro y análisis de gastos personales.**

Trabajo Final Integrador (TFI) — Tecnicatura Universitaria en Programación
UTN Facultad Regional La Plata · 2026

---

## ¿Qué es GastoClaro?

GastoClaro ayuda a saber **en qué se va la plata**. Parte de una premisa simple:

> **Ingreso = Consumo + Ahorro/Inversión**

El usuario arma un presupuesto mensual detallado, registra lo que realmente gasta y el sistema compara ambos: avisa cuando se está por pasar del presupuesto, pone en evidencia los gastos hormiga y muestra si un gasto subió por precio o por consumo. Los informes pueden expresarse en **moneda constante** (ajustados por IPC), para comparar meses sin que la inflación distorsione los números.

## Funcionalidades

| Módulo | Qué hace |
|---|---|
| Usuarios | Registro, inicio de sesión, recuperación de contraseña y perfil |
| Categorías | Rubros y subrubros personalizables, clasificados como necesidad, deseo o ahorro/inversión |
| Gastos | Alta, edición y baja de gastos, con ítems (cantidad y precio unitario), comercio, gasto fijo, canal de compra y foto del ticket |
| Compras en cuotas | Se carga el total y la cantidad de cuotas; el sistema reparte cada cuota en su mes y muestra las pendientes |
| Comercios | Navegación Panel → Categoría → Comercio → ítems, con totales en cada nivel |
| Ingresos | Registro de ingresos por período |
| Presupuesto | Presupuesto mensual por ítem y alertas al 80 % y al 100 % |
| Informes | Totales, % sobre el ingreso, balance Ingreso = Consumo + Ahorro, regla 50/30/20, comparativas y gráficos |
| Historial de precios | Variación de precio y cantidad por producto, mes a mes y entre comercios |
| Inflación personal | Cuánto subieron los precios de lo que compra cada usuario, comparado con el IPC |
| Gastos hormiga | Detección por umbral configurable, con consejos de educación financiera |
| Metas de ahorro | Monto y fecha objetivo, barra de progreso y mail de felicitación al cumplirlas |
| Moneda constante | Ajuste opcional de los informes por IPC (INDEC) |
| Exportación | Resúmenes en CSV y PDF |
| Back-office | Administración de índices IPC, rubros predefinidos y consejos financieros |

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Ruby on Rails (modo API) — API REST versionada `/api/v1` |
| Frontend | React + Vite, distribuido como PWA |
| Base de datos | MySQL 8 |
| Autenticación | bcrypt + JWT (usuario) · sesión (back-office) |
| Archivos | Active Storage (local en desarrollo, Cloudinary en demo) |
| Testing | RSpec · Vitest |
| Calidad | RuboCop · Brakeman |
| Infraestructura | Docker (MySQL local) · Render / Railway (demo) |
| Gestión | GitHub (código, PRs) · Trello (tareas) |

## Estructura del repositorio

```
GastoClaroTIF/
├── backend/          # API Rails
├── frontend/         # App React (PWA)
├── docs/             # DER, wireframes, contrato de la API, informes
├── docker-compose.yml
└── README.md
```

## Cómo levantar el proyecto

### Requisitos

- Ruby 3.3+ y Bundler
- Node.js 20+ y npm
- Docker (para MySQL) o MySQL 8 instalado
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/norali84g-wq/GastoClaroTIF.git
cd GastoClaroTIF
```

### 2. Levantar la base de datos

```bash
docker compose up -d db
```

### 3. Backend

```bash
cd backend
bundle install
cp .env.example .env          # completar las variables
bin/rails db:create db:migrate db:seed
bin/rails server              # http://localhost:3000
```

### 4. Frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api/v1
npm run dev                   # http://localhost:5173
```

### 5. Tests y calidad

```bash
# Backend
cd backend
bundle exec rspec
bundle exec rubocop
bundle exec brakeman

# Frontend
cd frontend
npm run test
```

## Forma de trabajo

### Ramas

| Rama | Uso |
|---|---|
| `main` | Versión estable. Nadie trabaja directo acá: todo entra por Pull Request. |
| `feature/issue-<número>-<descripción>` | Una rama por funcionalidad, creada desde `main` (ej. `feature/issue-12-budget`) |
| `fix/issue-<número>-<descripción>` | Corrección de errores |

### Flujo

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

### Mensajes de commit (en inglés)

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

## Documentación

- Propuesta del TFI → `docs/propuesta/`
- DER → `docs/der/`
- Wireframes → `docs/wireframes/`
- Contrato de la API (método, ruta, payload, respuesta) → `docs/api/`
- Tablero de tareas → [Trello](#) *(agregar enlace)*

## Equipo

| Integrante | Legajo | Rol |
|---|---|---|
| Gorosito Ledesma, Flavia Norali | 35586 | Líder técnica · Backend y base de datos |
| Zunino, Juan Carlos | 35414 | Frontend · Diseño UX |
| Ventureira, Nicolás Manuel | 35425 | Análisis funcional · Full stack |

**Tutor:** Ing. Sergio Antonini — Coordinador del TFI y Director de la carrera

---

UTN Facultad Regional La Plata · Tecnicatura Universitaria en Programación
