# Spec Delta

## Purpose

Describes the physical layout of chemical product warehouses: each warehouse and the shelves inside it, with the turnover zone and unit capacity that decide what each shelf can hold.

## ADDED Requirements

### Requirement: Create a warehouse
The system SHALL let a client create a warehouse with a code and a name. The code MUST be unique across all warehouses. The response SHALL return the created warehouse with its generated identifier.

#### Scenario: Warehouse created
- **WHEN** a client creates a warehouse with code `WH-01` and name `Main warehouse`
- **THEN** the system returns status 201 and the warehouse with a generated id, code `WH-01` and name `Main warehouse`

#### Scenario: Duplicate warehouse code
- **GIVEN** a warehouse with code `WH-01` exists
- **WHEN** a client creates another warehouse with code `WH-01`
- **THEN** the system returns status 409 and does not create the warehouse

#### Scenario: Missing name
- **WHEN** a client creates a warehouse without a name
- **THEN** the system returns status 400 with a message naming the `name` field

### Requirement: List and read warehouses
The system SHALL let a client list all warehouses and read one warehouse by id.

#### Scenario: List warehouses
- **GIVEN** two warehouses exist
- **WHEN** a client lists warehouses
- **THEN** the system returns status 200 and both warehouses

#### Scenario: Unknown warehouse
- **WHEN** a client reads a warehouse id that does not exist
- **THEN** the system returns status 404

### Requirement: Update a warehouse
The system SHALL let a client change a warehouse's name. Changing the code SHALL follow the same uniqueness rule as creation.

#### Scenario: Rename warehouse
- **GIVEN** warehouse `WH-01` exists
- **WHEN** a client changes its name to `North warehouse`
- **THEN** the system returns status 200 and the warehouse with name `North warehouse`

### Requirement: Delete a warehouse
The system SHALL let a client delete a warehouse only when it has no shelves.

#### Scenario: Delete empty warehouse
- **GIVEN** warehouse `WH-01` has no shelves
- **WHEN** a client deletes it
- **THEN** the system returns status 204 and the warehouse no longer exists

#### Scenario: Delete warehouse with shelves
- **GIVEN** warehouse `WH-01` has at least one shelf
- **WHEN** a client deletes it
- **THEN** the system returns status 409 and the warehouse still exists

### Requirement: Create a shelf in a warehouse
The system SHALL let a client create a shelf inside an existing warehouse with a code, a turnover zone (`HIGH`, `MEDIUM` or `LOW`) and a capacity in units. The code MUST be unique within its warehouse. The capacity MUST be a positive integer.

#### Scenario: Shelf created
- **GIVEN** warehouse `WH-01` exists
- **WHEN** a client creates shelf `A-01` in it with zone `HIGH` and capacity `500`
- **THEN** the system returns status 201 and the shelf with a generated id, its warehouse id, code `A-01`, zone `HIGH` and capacity `500`

#### Scenario: Same shelf code in two warehouses
- **GIVEN** warehouse `WH-01` has shelf `A-01`
- **WHEN** a client creates shelf `A-01` in warehouse `WH-02`
- **THEN** the system returns status 201

#### Scenario: Duplicate shelf code in one warehouse
- **GIVEN** warehouse `WH-01` has shelf `A-01`
- **WHEN** a client creates another shelf `A-01` in `WH-01`
- **THEN** the system returns status 409

#### Scenario: Invalid zone
- **WHEN** a client creates a shelf with zone `FAST`
- **THEN** the system returns status 400 with a message naming the `zone` field

#### Scenario: Non-positive capacity
- **WHEN** a client creates a shelf with capacity `0`
- **THEN** the system returns status 400 with a message naming the `capacity` field

#### Scenario: Unknown warehouse
- **WHEN** a client creates a shelf in a warehouse id that does not exist
- **THEN** the system returns status 404

### Requirement: List and read shelves
The system SHALL let a client list the shelves of a warehouse, optionally filtered by turnover zone, and read one shelf by id. Each shelf in a response SHALL include its current used units and free units.

#### Scenario: Filter shelves by zone
- **GIVEN** warehouse `WH-01` has shelves in zones `HIGH` and `LOW`
- **WHEN** a client lists shelves of `WH-01` with zone `HIGH`
- **THEN** the system returns only the `HIGH` shelves

#### Scenario: Shelf shows used and free units
- **GIVEN** shelf `A-01` has capacity `500` and holds `120` units in total
- **WHEN** a client reads shelf `A-01`
- **THEN** the response shows `usedUnits` `120` and `freeUnits` `380`

### Requirement: Update a shelf
The system SHALL let a client change a shelf's code, zone and capacity. The zone MUST NOT change while the shelf holds stock. The capacity MUST NOT drop below the units the shelf currently holds.

#### Scenario: Change zone of empty shelf
- **GIVEN** shelf `A-01` holds no stock
- **WHEN** a client changes its zone from `HIGH` to `LOW`
- **THEN** the system returns status 200 and the shelf has zone `LOW`

#### Scenario: Change zone of shelf with stock
- **GIVEN** shelf `A-01` holds stock
- **WHEN** a client changes its zone
- **THEN** the system returns status 409 and the zone does not change

#### Scenario: Capacity below current stock
- **GIVEN** shelf `A-01` holds `120` units
- **WHEN** a client sets its capacity to `100`
- **THEN** the system returns status 409 and the capacity does not change

### Requirement: Delete a shelf
The system SHALL let a client delete a shelf only when it holds no stock.

#### Scenario: Delete empty shelf
- **GIVEN** shelf `A-01` holds no stock
- **WHEN** a client deletes it
- **THEN** the system returns status 204

#### Scenario: Delete shelf with stock
- **GIVEN** shelf `A-01` holds stock
- **WHEN** a client deletes it
- **THEN** the system returns status 409 and the shelf still exists
