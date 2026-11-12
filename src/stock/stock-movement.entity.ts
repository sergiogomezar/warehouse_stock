import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Product } from '../products/product.entity.js';
import { Shelf } from '../warehouses/shelf.entity.js';

export enum StockMovementType {
  RECEIVE = 'RECEIVE',
  WITHDRAW = 'WITHDRAW',
  TRANSFER = 'TRANSFER',
}

/** Append-only history of stock changes. Never updated or deleted. */
@Entity({ name: 'stock_movements' })
@Check('CHK_stock_movements_quantity_positive', '"quantity" > 0')
@Check(
  'CHK_stock_movements_shelves_match_type',
  `("type" = 'RECEIVE' AND "from_shelf_id" IS NULL AND "to_shelf_id" IS NOT NULL)` +
    ` OR ("type" = 'WITHDRAW' AND "from_shelf_id" IS NOT NULL AND "to_shelf_id" IS NULL)` +
    ` OR ("type" = 'TRANSFER' AND "from_shelf_id" IS NOT NULL AND "to_shelf_id" IS NOT NULL` +
    ` AND "from_shelf_id" <> "to_shelf_id")`,
)
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: StockMovementType,
    enumName: 'stock_movement_type',
  })
  type: StockMovementType;

  @Index('IDX_stock_movements_product_id')
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product?: Relation<Product>;

  @Index('IDX_stock_movements_from_shelf_id')
  @Column({ name: 'from_shelf_id', type: 'uuid', nullable: true })
  fromShelfId: string | null;

  @ManyToOne(() => Shelf, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'from_shelf_id' })
  fromShelf?: Relation<Shelf> | null;

  @Index('IDX_stock_movements_to_shelf_id')
  @Column({ name: 'to_shelf_id', type: 'uuid', nullable: true })
  toShelfId: string | null;

  @ManyToOne(() => Shelf, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'to_shelf_id' })
  toShelf?: Relation<Shelf> | null;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Index('IDX_stock_movements_created_at')
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
