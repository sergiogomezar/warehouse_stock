# Spec Delta

## Purpose

Keeps the catalog of chemical products the warehouse stores, including each product's turnover class, which decides the shelf zone the product may be placed in.

## ADDED Requirements

### Requirement: Create a product
The system SHALL let a client create a product with a SKU, a name, a unit of measure and a turnover class (`HIGH`, `MEDIUM` or `LOW`). The SKU MUST be unique across all products.

#### Scenario: Product created
- **WHEN** a client creates a product with SKU `CHEM-0001`, name `Sodium hydroxide 25kg`, unit `BAG` and turnover `HIGH`
- **THEN** the system returns status 201 and the product with a generated id and the given fields

#### Scenario: Duplicate SKU
- **GIVEN** a product with SKU `CHEM-0001` exists
- **WHEN** a client creates another product with SKU `CHEM-0001`
- **THEN** the system returns status 409 and does not create the product

#### Scenario: Invalid turnover
- **WHEN** a client creates a product with turnover `VERY_HIGH`
- **THEN** the system returns status 400 with a message naming the `turnover` field

### Requirement: List and read products
The system SHALL let a client list products, optionally filtered by turnover class, and read one product by id.

#### Scenario: Filter products by turnover
- **GIVEN** products with turnover `HIGH`, `MEDIUM` and `LOW` exist
- **WHEN** a client lists products with turnover `LOW`
- **THEN** the system returns only the `LOW` products

#### Scenario: Unknown product
- **WHEN** a client reads a product id that does not exist
- **THEN** the system returns status 404

### Requirement: Update a product
The system SHALL let a client change a product's SKU, name, unit and turnover class. SKU changes SHALL follow the uniqueness rule. The turnover class MUST NOT change while the product has stock on any shelf.

#### Scenario: Rename product
- **GIVEN** product `CHEM-0001` exists
- **WHEN** a client changes its name
- **THEN** the system returns status 200 and the product has the new name

#### Scenario: Change turnover of product without stock
- **GIVEN** product `CHEM-0001` has no stock on any shelf
- **WHEN** a client changes its turnover from `HIGH` to `MEDIUM`
- **THEN** the system returns status 200 and the product has turnover `MEDIUM`

#### Scenario: Change turnover of product with stock
- **GIVEN** product `CHEM-0001` has stock on a shelf
- **WHEN** a client changes its turnover
- **THEN** the system returns status 409 and the turnover does not change

### Requirement: Delete a product
The system SHALL let a client delete a product only when it has no stock on any shelf and no recorded movements.

#### Scenario: Delete unused product
- **GIVEN** product `CHEM-0001` has no stock and no movements
- **WHEN** a client deletes it
- **THEN** the system returns status 204

#### Scenario: Delete product with history
- **GIVEN** product `CHEM-0001` has recorded movements
- **WHEN** a client deletes it
- **THEN** the system returns status 409 and the product still exists
