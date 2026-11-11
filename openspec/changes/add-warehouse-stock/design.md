# Design

## Context

The repo is the NestJS 12 starter: ESM (`"type": "module"`, relative imports end in `.js`), Express adapter, Vitest for unit (`*.spec.ts`) and e2e (`vitest.config.e2e.ts`) tests, oxlint, pnpm. It has no database, config or validation library yet. See `proposal.md` for motivation and `specs/` for the required behavior.

The rules that drive the design are all in `specs/stock-management/spec.md`: placement by turnover zone, shelf capacity across all products, no negative stock, and consistency under concurrent movements.

## Goals / Non-Goals

**Goals:**

- Keep stock invariants (zone match, capacity, non-negative quantity) correct under concurrent requests, enforced in one place.
- Keep each capability in its own Nest module with a clear dependency direction.
- Make the business rules unit-testable without a database, and the HTTP contract e2e-testable against a real PostgreSQL.

**Non-Goals:**

- Pagination, sorting options and full-text search on lists.
- Soft deletes or audit of who made a change (there is no authentication).
- Caching or read replicas.

## Decisions

### 1. Module layout

```
src/
  common/
    turnover.ts            # Turnover enum: HIGH | MEDIUM | LOW, shared Zod schema
    database-errors.ts     # maps Postgres unique/FK violations to Nest exceptions
  config/
    env.ts                 # Zod schema for environment variables
  database/
    data-source.ts         # TypeORM DataSource for the migration CLI
    migrations/            # generated migrations
  warehouses/              # warehouse-layout capability: Warehouse, Shelf
  products/                # product-catalog capability: Product
  stock/                   # stock-management capability: StockItem, StockMovement
```

Each folder holds its entities, Zod schemas, service, controller, module and `*.spec.ts` files.

`StockModule` imports `WarehousesModule` and `ProductsModule`. The reverse checks ("shelf holds stock", "product has stock or movements") are needed by the warehouse and product services. To avoid a circular module import, those modules register the `StockItem` and `StockMovement` entities read-only through their own `TypeOrmModule.forFeature(...)` and run only `exists` / `sum` queries on them. Writes to stock happen only in `StockService`.

Alternative considered: `forwardRef` between modules. Rejected because circular providers are harder to test and reason about.

### 2. Persistence: PostgreSQL with TypeORM

- `@nestjs/typeorm` + `typeorm` + `pg`, configured with `TypeOrmModule.forRootAsync` reading from `ConfigService`.
- One `DATABASE_URL` environment variable, validated at startup by a Zod schema in `ConfigModule.forRoot({ validate })`.
- `synchronize: false`. The schema is created by TypeORM migrations, run with the TypeORM CLI against `src/database/data-source.ts`. Migrations cannot use Nest DI, so `data-source.ts` reads `process.env` directly.
- `autoLoadEntities: true`; every entity is registered through `forFeature`, so none is missed.

Tables (UUID primary keys, `created_at` / `updated_at` where useful):

| Table | Key columns and constraints |
| --- | --- |
| `warehouses` | `code` unique, `name` |
| `shelves` | `warehouse_id` FK (RESTRICT), `code`, `zone` enum, `capacity` int `CHECK > 0`, unique (`warehouse_id`, `code`) |
| `products` | `sku` unique, `name`, `unit` varchar, `turnover` enum |
| `stock_items` | PK (`shelf_id`, `product_id`), both FK (RESTRICT), `quantity` int `CHECK > 0` |
| `stock_movements` | `type` enum (`RECEIVE`, `WITHDRAW`, `TRANSFER`), `product_id` FK, `from_shelf_id` / `to_shelf_id` nullable FK, `quantity` int `CHECK > 0`, `note` nullable, `created_at`; indexes on `product_id`, `from_shelf_id`, `to_shelf_id`, `created_at` |

A `stock_items` row is deleted when its quantity reaches zero, which gives "zero entries do not appear" without filtering. `stock_movements` also has a `CHECK` that the shelf columns match the type (receive: only `to`; withdraw: only `from`; transfer: both, different).

Used units of a shelf are computed with `SUM(quantity)` over `stock_items`, not stored on the shelf. Alternative considered: a denormalized `used_units` column on `shelves`. Rejected for now: one more value to keep in sync, and the sum is cheap with the composite primary key.

Turnover uses one Postgres enum type shared by `shelves.zone` and `products.turnover`, so both always have the same values.

### 3. Concurrency: pessimistic row locks in one transaction

Each movement runs in a single `DataSource.transaction`:

1. Lock the affected shelf rows with `SELECT ... FOR UPDATE` (`lock: { mode: 'pessimistic_write' }`). For a transfer, lock both shelves in ascending id order to avoid deadlocks.
2. Lock the product row with `FOR SHARE`, so its turnover cannot change mid-movement.
3. Read current stock and the shelf's used units, check the zone, capacity and available-quantity rules.
4. Upsert or delete the `stock_items` rows and insert the `stock_movements` row.

Shelf updates (zone, capacity) and product turnover updates lock the same rows `FOR UPDATE` before checking "holds stock", so they serialize with movements.

The `CHECK` constraints are a backstop: a bug that skips a rule fails at the database instead of storing bad data.

Alternatives considered:
- `SERIALIZABLE` isolation with retry on serialization failure. Correct, but needs retry logic and gives less clear errors.
- Optimistic locking with a version column on the shelf. Needs retries under contention, which is normal for a busy shelf.

### 4. Validation with Zod

`zod` schemas per request body and query, applied with `@Body({ schema })` / `@Query({ schema })` and a global `StandardSchemaValidationPipe` registered in `main.ts` (and in the e2e app setup). DTO types come from `z.infer`. Route ids use `@Param('id', { schema: z.uuid() })`. This follows the project guidance in `AGENTS.md` and avoids `class-validator` decorators.

### 5. Error mapping

| Situation | Status |
| --- | --- |
| Invalid input (schema) | 400 (pipe default) |
| Id not found | 404 `NotFoundException` |
| Uniqueness or "in use" conflicts (duplicate code/SKU, delete or zone/turnover change while stock exists) | 409 `ConflictException` |
| Movement breaks a stock rule (zone mismatch, over capacity, not enough stock) | 422 `UnprocessableEntityException` |

Services check rules explicitly and throw the Nest exception with a clear message. `database-errors.ts` also maps Postgres `23505` (unique) and `23503` (FK) to 409, to cover races between the check and the insert.

### 6. HTTP API

| Method and path | Purpose |
| --- | --- |
| `POST/GET /warehouses`, `GET/PATCH/DELETE /warehouses/:id` | warehouse CRUD |
| `GET /warehouses/:id/summary` | summary by turnover |
| `POST/GET /warehouses/:id/shelves` (`?zone=`) | create and list shelves in a warehouse |
| `GET/PATCH/DELETE /shelves/:id` | read, update, delete a shelf |
| `POST/GET /products` (`?turnover=`), `GET/PATCH/DELETE /products/:id` | product CRUD |
| `POST /stock/receive`, `POST /stock/withdraw`, `POST /stock/transfer` | movements |
| `GET /stock` (`?warehouseId=&shelfId=&productId=&turnover=`) | stock levels |
| `GET /stock/movements` (`?productId=&shelfId=&type=&from=&to=`) | movement history |

The summary endpoint lives in `StockModule` (its controller declares the `warehouses/:id/summary` route), because it reads stock data.

### 7. Testing

- Unit tests (`*.spec.ts`, Vitest): services with repositories mocked through `getRepositoryToken(Entity)` and `vi.fn()`. They cover each rule and each error status.
- E2E tests (`test/*.e2e-spec.ts`): the full app against a real PostgreSQL, with migrations run before the suite and tables truncated between tests. They cover the HTTP contract and the concurrent-withdrawal scenario.
- A `docker-compose.yml` with a `postgres` service gives a local database for development and e2e runs.

## Risks / Trade-offs

- [Lock contention on a busy shelf serializes its movements] → Acceptable for warehouse traffic. Locks are held only for a few short queries.
- [Read-only `StockItem` access from the warehouse and product modules couples them to the stock table] → Limited to `exists` / `sum` queries in one place per service. Revisit if the stock schema changes often.
- [Computing used units with `SUM` on every movement] → Fine at this scale; add a denormalized column later if it shows up in profiling.
- [E2E tests need a running PostgreSQL] → `docker-compose.yml` plus a documented `TEST_DATABASE_URL`. Unit tests do not need a database.
- [The installed NestJS 12 APIs may differ from older docs] → Follow the docs indexed at https://docs.nestjs.com/llms.txt as `AGENTS.md` asks.

## Migration Plan

1. Start PostgreSQL (`docker compose up -d`) and set `DATABASE_URL` in `.env` from `.env.example`.
2. Run the initial migration with the TypeORM CLI.
3. Start the app.

Rollback: revert the initial migration with the TypeORM CLI. It drops only the new tables and enum types. The starter endpoint is not affected.

## Open Questions

- Default page size for list endpoints once pagination is added. Lists are unpaginated in this change, and pagination can be added later as optional query parameters without breaking clients.
