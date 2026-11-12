import { Product } from '../products/product.entity.js';
import { StockItem } from '../stock/stock-item.entity.js';
import { StockMovement } from '../stock/stock-movement.entity.js';
import { Shelf } from '../warehouses/shelf.entity.js';
import { Warehouse } from '../warehouses/warehouse.entity.js';

// Every entity, for data sources created outside Nest (migration CLI, e2e setup).
// The app registers the same entities through `TypeOrmModule.forFeature`.
export const entities: Function[] = [
  Warehouse,
  Shelf,
  Product,
  StockItem,
  StockMovement,
];
