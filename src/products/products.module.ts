import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockItem } from '../stock/stock-item.entity.js';
import { StockMovement } from '../stock/stock-movement.entity.js';
import { Product } from './product.entity.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  // StockItem and StockMovement are registered here only for read-only
  // "has stock / has movements" checks. Stock writes live in StockService.
  imports: [TypeOrmModule.forFeature([Product, StockItem, StockMovement])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
