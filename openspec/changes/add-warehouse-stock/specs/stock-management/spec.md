# Spec Delta

## Purpose

Tracks how many units of each chemical product sit on each shelf, changes those quantities only through recorded movements, and enforces placement by turnover zone and shelf capacity.

## ADDED Requirements

### Requirement: Receive stock onto a shelf
The system SHALL let a client receive a positive integer quantity of a product onto a shelf. The shelf's stock for that product SHALL increase by the quantity, and the system SHALL record a `RECEIVE` movement.

#### Scenario: Receive into empty shelf
- **GIVEN** product `CHEM-0001` has turnover `HIGH` and shelf `A-01` has zone `HIGH`, capacity `500` and no stock
- **WHEN** a client receives `100` units of `CHEM-0001` onto `A-01`
- **THEN** the system returns status 201, shelf `A-01` holds `100` units of `CHEM-0001`, and a `RECEIVE` movement of `100` exists

#### Scenario: Receive adds to existing stock
- **GIVEN** shelf `A-01` holds `100` units of `CHEM-0001`
- **WHEN** a client receives `50` more units of `CHEM-0001` onto `A-01`
- **THEN** shelf `A-01` holds `150` units of `CHEM-0001`

#### Scenario: Non-positive quantity
- **WHEN** a client receives quantity `0` or a negative quantity
- **THEN** the system returns status 400 with a message naming the `quantity` field

#### Scenario: Unknown shelf or product
- **WHEN** a client receives stock with a shelf id or product id that does not exist
- **THEN** the system returns status 404 and records no movement

### Requirement: Placement matches turnover zone
The system MUST reject any receive or transfer that would place a product on a shelf whose zone differs from the product's turnover class. A rejected operation MUST NOT change stock or record a movement.

#### Scenario: Zone mismatch on receive
- **GIVEN** product `CHEM-0002` has turnover `LOW` and shelf `A-01` has zone `HIGH`
- **WHEN** a client receives `10` units of `CHEM-0002` onto `A-01`
- **THEN** the system returns status 422 with a message stating the product turnover and the shelf zone, and stock does not change

#### Scenario: Zone mismatch on transfer
- **GIVEN** shelf `A-01` (zone `HIGH`) holds `CHEM-0001` (turnover `HIGH`) and shelf `C-01` has zone `LOW`
- **WHEN** a client transfers `CHEM-0001` from `A-01` to `C-01`
- **THEN** the system returns status 422 and neither shelf's stock changes

### Requirement: Shelf capacity is never exceeded
The system MUST reject any receive or transfer that would make the total units on the target shelf, across all products, exceed the shelf's capacity. A rejected operation MUST NOT change stock or record a movement.

#### Scenario: Receive over capacity
- **GIVEN** shelf `A-01` has capacity `500` and holds `450` units in total
- **WHEN** a client receives `60` units onto `A-01`
- **THEN** the system returns status 422 with a message stating the free units `50`, and stock does not change

#### Scenario: Receive fills shelf exactly
- **GIVEN** shelf `A-01` has capacity `500` and holds `450` units in total
- **WHEN** a client receives `50` units onto `A-01`
- **THEN** the system returns status 201 and shelf `A-01` holds `500` units in total

### Requirement: Withdraw stock from a shelf
The system SHALL let a client withdraw a positive integer quantity of a product from a shelf. The quantity MUST NOT exceed the units of that product on that shelf. The system SHALL record a `WITHDRAW` movement.

#### Scenario: Withdraw part of stock
- **GIVEN** shelf `A-01` holds `100` units of `CHEM-0001`
- **WHEN** a client withdraws `30` units of `CHEM-0001` from `A-01`
- **THEN** the system returns status 201, shelf `A-01` holds `70` units of `CHEM-0001`, and a `WITHDRAW` movement of `30` exists

#### Scenario: Withdraw more than available
- **GIVEN** shelf `A-01` holds `20` units of `CHEM-0001`
- **WHEN** a client withdraws `25` units of `CHEM-0001` from `A-01`
- **THEN** the system returns status 422 with a message stating the available units `20`, and stock does not change

#### Scenario: Withdraw all stock
- **GIVEN** shelf `A-01` holds `20` units of `CHEM-0001`
- **WHEN** a client withdraws `20` units of `CHEM-0001` from `A-01`
- **THEN** `CHEM-0001` no longer appears in the stock of `A-01`

### Requirement: Transfer stock between shelves
The system SHALL let a client move a positive integer quantity of a product from one shelf to a different shelf, in the same or another warehouse. The source MUST hold enough units, and the target MUST pass the zone and capacity rules. The transfer SHALL be all-or-nothing and SHALL record one `TRANSFER` movement with source and target.

#### Scenario: Transfer between matching shelves
- **GIVEN** shelves `A-01` and `A-02` both have zone `HIGH`, and `A-01` holds `100` units of `CHEM-0001`
- **WHEN** a client transfers `40` units of `CHEM-0001` from `A-01` to `A-02`
- **THEN** the system returns status 201, `A-01` holds `60`, `A-02` holds `40`, and one `TRANSFER` movement of `40` exists

#### Scenario: Transfer to the same shelf
- **WHEN** a client transfers stock with the same shelf as source and target
- **THEN** the system returns status 400 and stock does not change

#### Scenario: Transfer more than source holds
- **GIVEN** shelf `A-01` holds `10` units of `CHEM-0001`
- **WHEN** a client transfers `15` units of `CHEM-0001` from `A-01` to `A-02`
- **THEN** the system returns status 422 and neither shelf's stock changes

### Requirement: Concurrent movements keep stock consistent
The system MUST apply concurrent movements on the same shelf so that quantities never go negative and capacity is never exceeded, whatever the order of the requests.

#### Scenario: Two withdrawals race
- **GIVEN** shelf `A-01` holds `10` units of `CHEM-0001`
- **WHEN** two clients each withdraw `8` units of `CHEM-0001` from `A-01` at the same time
- **THEN** exactly one withdrawal succeeds, the other returns status 422, and `A-01` holds `2` units

### Requirement: Movement history
The system SHALL keep every successful movement with its type, product, quantity, source shelf (for withdraw and transfer), target shelf (for receive and transfer), an optional note and a timestamp. Movements MUST NOT be editable or deletable through the API. Clients SHALL list movements filtered by product, shelf, type and date range, newest first.

#### Scenario: Filter movements by product
- **GIVEN** movements exist for products `CHEM-0001` and `CHEM-0002`
- **WHEN** a client lists movements for `CHEM-0001`
- **THEN** the system returns only movements of `CHEM-0001`, newest first

#### Scenario: Filter movements by shelf
- **GIVEN** a transfer from `A-01` to `A-02` exists
- **WHEN** a client lists movements for shelf `A-02`
- **THEN** the transfer is included

### Requirement: Query stock levels
The system SHALL let a client list stock entries, each with shelf, warehouse, product, product turnover and quantity. The list SHALL be filterable by warehouse, shelf, product and turnover. Entries with quantity zero SHALL NOT appear.

#### Scenario: Filter stock by turnover
- **GIVEN** warehouse `WH-01` holds `HIGH` and `LOW` products
- **WHEN** a client lists stock of `WH-01` with turnover `HIGH`
- **THEN** the system returns only entries of `HIGH` products

#### Scenario: Product total across shelves
- **GIVEN** product `CHEM-0001` has `60` units on `A-01` and `40` units on `A-02`
- **WHEN** a client lists stock for `CHEM-0001`
- **THEN** the system returns both entries, with quantities `60` and `40`

### Requirement: Warehouse stock summary by turnover
The system SHALL return, for one warehouse, a summary per turnover class with the number of shelves, total capacity, used units, free units and number of distinct products. All three classes SHALL appear, with zeros when empty.

#### Scenario: Summary of a warehouse
- **GIVEN** warehouse `WH-01` has one `HIGH` shelf of capacity `500` holding `150` units of one product, and no other shelves
- **WHEN** a client requests the summary of `WH-01`
- **THEN** the `HIGH` row shows `1` shelf, capacity `500`, used `150`, free `350` and `1` product, and the `MEDIUM` and `LOW` rows show zeros
