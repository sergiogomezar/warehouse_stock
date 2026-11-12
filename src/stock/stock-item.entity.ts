import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../products/product.entity.js';
import { Shelf } from '../warehouses/shelf.entity.js';

/**
 * Units of one product on one shelf. A row is deleted when its quantity
 * reaches zero, so zero entries never exist.
 */
@Entity({ name: 'stock_items' })
@Check('CHK_stock_items_quantity_positive', '"quantity" > 0')
export class StockItem {
  @PrimaryColumn({ name: 'shelf_id', type: 'uuid' })
  shelfId: string;

  @PrimaryColumn({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Shelf, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'shelf_id' })
  shelf?: Relation<Shelf>;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product?: Relation<Product>;

  @Column({ type: 'integer' })
  quantity: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
