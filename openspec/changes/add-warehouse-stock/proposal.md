# Proposal

## Why

The application is a fresh NestJS starter with no domain logic. It needs a first module to manage a chemical products warehouse: its shelves, the products stored there, and how much of each product sits on each shelf. Product turnover (high, medium, low) must decide where a product can be placed, so fast-moving products stay on the shelves meant for them.

## What Changes

- Add warehouses and their shelves. Each shelf belongs to one warehouse, has a turnover zone (`HIGH`, `MEDIUM`, `LOW`) and a capacity in units.
- Add a product catalog. Each product has a unique SKU, a name, a unit of measure and a turnover class (`HIGH`, `MEDIUM`, `LOW`).
- Add stock per shelf and product, changed through movements: receive, withdraw and transfer.
- Enforce placement rules: a product can only be stocked on a shelf whose zone matches its turnover class, and a shelf can never hold more units than its capacity.
- Record every stock movement in an append-only history.
- Add stock queries filtered by warehouse, shelf, product and turnover, plus a per-warehouse summary grouped by turnover.
- Add PostgreSQL persistence through TypeORM, configured from environment variables.
- Add request validation with Zod through `StandardSchemaValidationPipe`.

Out of scope for this change:

- Chemical safety rules (hazard classes, incompatible products, safety data sheets). The project is a practice project and does not need them.
- Authentication and authorization.
- Lots, batches and expiry dates.
- Automatic reclassification of turnover from movement history.

## Capabilities

### New Capabilities

- `warehouse-layout`: Warehouses and their shelves, including each shelf's turnover zone and capacity.
- `product-catalog`: Chemical products with SKU, name, unit of measure and turnover class.
- `stock-management`: Stock levels per shelf and product, stock movements (receive, withdraw, transfer), placement rules by turnover and capacity, movement history and stock reports.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- New code under `src/` for the three capabilities, registered in `src/app.module.ts`.
- New dependencies: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config`, `zod`.
- New environment variables for the database connection, documented in a `.env.example` file.
- New HTTP API endpoints under `/warehouses`, `/shelves`, `/products` and `/stock`.
- A PostgreSQL database is required to run the app and the e2e tests.
- The starter `AppController` / `AppService` "Hello World" endpoint stays unchanged.
