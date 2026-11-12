# Tasks

## 1. Setup: dependencies, config and database

- [x] 1.1 Add `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config` and `zod` with pnpm, and verify `pnpm install` and `pnpm build` succeed
- [x] 1.2 Add `docker-compose.yml` with a `postgres` service and `.env.example` with `DATABASE_URL` and `TEST_DATABASE_URL`, and verify `docker compose up -d` starts a database that accepts connections
- [x] 1.3 Add `src/config/env.ts` (Zod schema for env vars) and register `ConfigModule.forRoot({ isGlobal: true, validate })` in `AppModule`, and verify the app fails fast with a clear message when `DATABASE_URL` is missing
- [x] 1.4 Register `TypeOrmModule.forRootAsync` (`synchronize: false`, `autoLoadEntities: true`) from `ConfigService`, and verify `pnpm start:dev` connects to the local database
- [x] 1.5 Register the global `StandardSchemaValidationPipe` in `src/main.ts`, and verify the existing `GET /` e2e test still passes
- [x] 1.6 Add `src/database/data-source.ts` and `migration:generate` / `migration:run` / `migration:revert` scripts in `package.json`, and verify `pnpm migration:run` runs with no migrations and exits 0
- [x] 1.7 Add an e2e helper in `test/` that builds the app with the same global pipe, runs migrations against `TEST_DATABASE_URL` and truncates tables between tests, and verify `pnpm test:e2e` passes

## 2. Shared types and schema

- [x] 2.1 Add `src/common/turnover.ts` (enum and Zod schema for `HIGH`/`MEDIUM`/`LOW`) with a unit test that rejects other values
- [x] 2.2 Add `src/common/database-errors.ts` mapping Postgres `23505` and `23503` to `ConflictException`, with unit tests for both codes and for passing other errors through
- [x] 2.3 Add the `Warehouse`, `Shelf`, `Product`, `StockItem` and `StockMovement` entities with the columns, enums, FKs, unique and `CHECK` constraints from design.md, and verify `pnpm build` succeeds
- [x] 2.4 Generate the initial migration, review it for every constraint in design.md, and verify `pnpm migration:run` then `pnpm migration:revert` both succeed on an empty database

## 3. Product catalog (`specs/product-catalog`)

- [ ] 3.1 Add Zod schemas for create, update and list-filter of products, with unit tests for valid input and each invalid field
- [ ] 3.2 Implement `ProductsService` (create, list with turnover filter, get, update, delete) including the SKU uniqueness, "no turnover change with stock" and "no delete with stock or movements" rules, and verify unit tests with mocked repositories cover each rule and status
- [ ] 3.3 Implement `ProductsController` and `ProductsModule` under `/products`, register the module in `AppModule`, and verify e2e tests cover every scenario in `specs/product-catalog/spec.md` that does not need stock
- [ ] 3.4 Document the product endpoints in `README.md` with one example request each, and verify the examples run against `pnpm start:dev`

## 4. Warehouse layout (`specs/warehouse-layout`)

- [ ] 4.1 Add Zod schemas for warehouses and shelves (create, update, zone filter; capacity positive integer), with unit tests for valid input and each invalid field
- [ ] 4.2 Implement `WarehousesService` (CRUD, code uniqueness, "no delete with shelves"), and verify unit tests cover each rule and status
- [ ] 4.3 Implement `ShelvesService` (create in warehouse, list with zone filter, get with `usedUnits`/`freeUnits`, update, delete) including "no zone change with stock", "capacity not below used units" and "no delete with stock or movements", locking the shelf row on update, and verify unit tests cover each rule and status
- [ ] 4.4 Implement the controllers for `/warehouses`, `/warehouses/:id/shelves` and `/shelves/:id` and `WarehousesModule`, register it in `AppModule`, and verify e2e tests cover every scenario in `specs/warehouse-layout/spec.md` that does not need stock
- [ ] 4.5 Document the warehouse and shelf endpoints in `README.md`, and verify the examples run against `pnpm start:dev`

## 5. Stock management (`specs/stock-management`)

- [ ] 5.1 Add Zod schemas for receive, withdraw and transfer (positive integer quantity, optional note, transfer source different from target) and for the stock and movement list filters, with unit tests for each invalid case
- [ ] 5.2 Implement receive in `StockService` inside one transaction with shelf `FOR UPDATE` and product `FOR SHARE` locks, zone and capacity checks, upsert of the stock row and a `RECEIVE` movement, and verify unit tests cover success, zone mismatch, over capacity, exact fill and unknown ids
- [ ] 5.3 Implement withdraw (available-quantity check, delete the row at zero, `WITHDRAW` movement), and verify unit tests cover partial, full and over-withdrawal
- [ ] 5.4 Implement transfer (lock both shelves in ascending id order, source quantity, target zone and capacity checks, one `TRANSFER` movement), and verify unit tests cover success, zone mismatch, over capacity and insufficient source stock
- [ ] 5.5 Implement stock level and movement history queries with all filters (movements newest first), and verify unit tests cover each filter
- [ ] 5.6 Implement the warehouse summary by turnover (all three classes, zeros when empty), and verify a unit test covers a warehouse with one `HIGH` shelf
- [ ] 5.7 Implement `StockController` (`/stock/receive`, `/stock/withdraw`, `/stock/transfer`, `GET /stock`, `GET /stock/movements`, `GET /warehouses/:id/summary`) and `StockModule`, register it in `AppModule`, and verify e2e tests cover every scenario in `specs/stock-management/spec.md`
- [ ] 5.8 Add the e2e test for two concurrent withdrawals of `8` from a shelf holding `10`, and verify exactly one returns 201, the other 422, and the shelf ends with `2`
- [ ] 5.9 Add e2e tests for the stock-dependent scenarios of the other specs (zone change and delete of a shelf with stock, capacity below stock, turnover change and delete of a product with stock or movements), and verify they pass
- [ ] 5.10 Document the stock endpoints, error statuses and placement rules in `README.md`, and verify the examples run against `pnpm start:dev`

## 6. Integration checks

- [ ] 6.1 Run `pnpm lint`, `pnpm test` and `pnpm test:e2e` on a fresh database, and verify all pass
- [ ] 6.2 Run `openspec validate add-warehouse-stock --strict`, and verify it reports no errors
