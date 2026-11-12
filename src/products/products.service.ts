import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { withDatabaseErrors } from '../common/database-errors.js';
import { StockItem } from '../stock/stock-item.entity.js';
import { StockMovement } from '../stock/stock-movement.entity.js';
import { Product } from './product.entity.js';
import type {
  CreateProductDto,
  ListProductsQuery,
  UpdateProductDto,
} from './product.schemas.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    await this.assertSkuFree(this.products, dto.sku);
    return withDatabaseErrors(
      () => this.products.save(this.products.create(dto)),
      skuTakenMessage(dto.sku),
    );
  }

  findAll(query: ListProductsQuery): Promise<Product[]> {
    return this.products.find({
      where: query.turnover ? { turnover: query.turnover } : {},
      order: { sku: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.products.findOneBy({ id });
    if (!product) throw productNotFound(id);
    return product;
  }

  update(id: string, dto: UpdateProductDto): Promise<Product> {
    return withDatabaseErrors(
      () =>
        this.dataSource.transaction(async (manager) => {
          const products = manager.getRepository(Product);
          // FOR UPDATE serializes with stock movements, which lock the product FOR SHARE.
          const product = await this.lockProduct(products, id);

          if (dto.sku !== undefined && dto.sku !== product.sku) {
            await this.assertSkuFree(products, dto.sku);
          }
          if (dto.turnover !== undefined && dto.turnover !== product.turnover) {
            const hasStock = await manager
              .getRepository(StockItem)
              .existsBy({ productId: id });
            if (hasStock) {
              throw new ConflictException(
                `Product ${product.sku} has stock on a shelf; its turnover cannot change`,
              );
            }
          }
          return products.save(products.merge(product, dto));
        }),
      dto.sku ? skuTakenMessage(dto.sku) : undefined,
    );
  }

  remove(id: string): Promise<void> {
    return withDatabaseErrors(
      () =>
        this.dataSource.transaction(async (manager) => {
          const products = manager.getRepository(Product);
          const product = await this.lockProduct(products, id);

          const [hasStock, hasMovements] = await Promise.all([
            manager.getRepository(StockItem).existsBy({ productId: id }),
            manager.getRepository(StockMovement).existsBy({ productId: id }),
          ]);
          if (hasStock || hasMovements) {
            throw new ConflictException(
              `Product ${product.sku} has stock or recorded movements and cannot be deleted`,
            );
          }
          await products.delete({ id });
        }),
      'Product is referenced by stock or movements and cannot be deleted',
    );
  }

  private async lockProduct(
    products: Repository<Product>,
    id: string,
  ): Promise<Product> {
    const product = await products.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!product) throw productNotFound(id);
    return product;
  }

  private async assertSkuFree(
    products: Repository<Product>,
    sku: string,
  ): Promise<void> {
    if (await products.existsBy({ sku })) {
      throw new ConflictException(skuTakenMessage(sku));
    }
  }
}

function productNotFound(id: string): NotFoundException {
  return new NotFoundException(`Product ${id} not found`);
}

function skuTakenMessage(sku: string): string {
  return `A product with SKU ${sku} already exists`;
}
