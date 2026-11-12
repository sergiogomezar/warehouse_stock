import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Turnover, TURNOVER_ENUM_NAME } from '../common/turnover.js';
import { Warehouse } from './warehouse.entity.js';

@Entity({ name: 'shelves' })
@Unique('UQ_shelves_warehouse_code', ['warehouseId', 'code'])
@Check('CHK_shelves_capacity_positive', '"capacity" > 0')
export class Shelf {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse?: Relation<Warehouse>;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'enum', enum: Turnover, enumName: TURNOVER_ENUM_NAME })
  zone: Turnover;

  @Column({ type: 'integer' })
  capacity: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
