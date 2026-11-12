import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Turnover, TURNOVER_ENUM_NAME } from '../common/turnover.js';

@Entity({ name: 'products' })
@Unique('UQ_products_sku', ['sku'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  sku: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  /** Unit of measure, for example `BAG`, `KG` or `L`. */
  @Column({ type: 'varchar', length: 20 })
  unit: string;

  @Column({ type: 'enum', enum: Turnover, enumName: TURNOVER_ENUM_NAME })
  turnover: Turnover;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
