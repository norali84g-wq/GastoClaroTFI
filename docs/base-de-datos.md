# Base de datos de GastoClaro

MySQL 8. Este documento explica cómo se protegen los datos, qué se indexó, cómo se administra el acceso y cómo se hace el backup. Cada punto corresponde a un tema de Bases de Datos I y II.

## 1. Restricciones (Bases de Datos II, unidad 1)

La base rechaza por sí sola los datos inválidos, además de las validaciones de Rails. Así un script, otra aplicación o un `INSERT` a mano no pueden dejar un monto negativo.

| Tipo | Dónde | Regla |
|------|-------|-------|
| `PRIMARY KEY` | todas las tablas | un `id` autoincremental |
| `FOREIGN KEY` | gastos, ingresos, presupuestos, cuotas, medios de pago, metas, etc. | cada registro apunta a un usuario, una categoría o un grupo que existe |
| `UNIQUE` | `users.user`, `users.email`, presupuesto por usuario + categoría + período, cuota por compra + número, alerta por presupuesto + umbral | evita duplicados |
| `NOT NULL` | montos, fechas, nombres | no se acepta un valor vacío |
| `CHECK` | ver la tabla de abajo | rango válido del número |

| Tabla | `CHECK` |
|-------|---------|
| `expenses`, `incomes`, `budgets` | `amount > 0` |
| `expense_items` | `quantity > 0` y `unit_price >= 0` |
| `installment_purchases` | `total_amount > 0`, `installments_count > 0` e `interest_rate` entre 0 y 100 |
| `installments` | `amount >= 0` |
| `payment_methods` | `monthly_fee >= 0` |
| `savings_goals` | `target_amount > 0` y `saved_amount >= 0` |
| `shopping_list_items` | `estimated_unit_price >= 0` y `quantity` nula o mayor a 0 |
| `family_groups` | `savings_percentage` entre 0 y 100 y `card_monthly_fee >= 0` |

Los tests que lo comprueban están en `backend/test/models/database_constraints_test.rb`.

## 2. Transacciones y ACID (unidad 2)

Copiar la lista de compras al mes siguiente (`ShoppingListItem.copy_pending`) corre dentro de una transacción: si falla la creación de un ítem, no queda ninguno copiado. Se copia todo o nada (atomicidad), y los datos quedan siempre consistentes.

## 3. Índices y consultas (unidad 3)

| Índice | Para qué consulta |
|--------|-------------------|
| `expenses (user_id, date)` | listar los consumos de un usuario por mes |
| `incomes (user_id, date)` | listar los ingresos de un usuario por mes |
| `expense_items (name)` | agrupar productos por nombre en la comparación mensual |
| `shopping_list_items (family_group_id, period)` | pedir la lista de compras de un mes |

Para ver el plan de ejecución y comprobar que se usa el índice, en `bin/rails dbconsole`:

```sql
EXPLAIN SELECT * FROM expenses WHERE user_id = 2 AND date BETWEEN '2026-11-01' AND '2026-11-30';
EXPLAIN SELECT name, SUM(quantity * unit_price) FROM expense_items GROUP BY name;
```

En la columna `key` tiene que aparecer el nombre del índice (`index_expenses_on_user_id_and_date`), no `NULL`.

## 4. Usuario de la aplicación con permisos mínimos (unidad 5)

La aplicación no debería conectarse como `root`. Se usan dos usuarios: uno para correr migraciones (cambia la estructura) y otro para la aplicación en producción (solo lee y escribe datos).

```sql
-- Usuario de la aplicación: solo puede leer y escribir datos.
CREATE USER 'gastoclaro_app'@'%' IDENTIFIED BY 'CAMBIAR_POR_UNA_CLAVE_LARGA';
GRANT SELECT, INSERT, UPDATE, DELETE ON `gastoclaro\_production%`.* TO 'gastoclaro_app'@'%';

-- Usuario de migraciones: puede cambiar la estructura, pero solo se usa al desplegar.
CREATE USER 'gastoclaro_migrator'@'%' IDENTIFIED BY 'CAMBIAR_POR_OTRA_CLAVE_LARGA';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES
  ON `gastoclaro\_production%`.* TO 'gastoclaro_migrator'@'%';

FLUSH PRIVILEGES;
```

El patrón `gastoclaro\_production%` cubre la base principal y las de caché y cola que usa Rails en producción (`gastoclaro_production_cache` y `gastoclaro_production_queue`). La clave no se escribe en el código: va en la variable de entorno `DB_PASSWORD` (ver `backend/config/database.yml`).

Para comprobar los permisos: `SHOW GRANTS FOR 'gastoclaro_app'@'%';`.

## 5. Backup y restauración (unidad 5)

**Backup** (con la base en Docker; guarda un archivo con la fecha):

```bash
docker compose exec -T db mysqldump -u root -proot --single-transaction --routines gastoclaro_development > backup-$(date +%F).sql
```

`--single-transaction` toma una copia consistente sin bloquear a los usuarios.

**Restauración** sobre una base vacía:

```bash
docker compose exec -T db mysql -u root -proot -e "DROP DATABASE IF EXISTS gastoclaro_development; CREATE DATABASE gastoclaro_development CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker compose exec -T db mysql -u root -proot gastoclaro_development < backup-2026-11-10.sql
```

**Cómo comprobar que la restauración funcionó:** correr `bin/rails runner 'puts Expense.count'` y comparar con la cantidad antes del backup.

En producción: el backup se hace todos los días, se guarda en un lugar distinto al del servidor, se conserva al menos 7 días y se prueba la restauración de vez en cuando (un backup que nunca se restauró no es una garantía).

## 6. NoSQL (unidad 4)

No se usa. Los datos tienen relaciones claras (usuario, gastos, categorías, cuotas) y se necesita ACID: un gasto no puede quedar a medias. Una base relacional es la elección correcta para este problema.
